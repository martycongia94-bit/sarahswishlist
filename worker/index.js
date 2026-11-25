import catalog from './catalog.json';
const json = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control':'no-store'}});
const cleanSecret = v => typeof v === 'string' ? v.trim() : '';
const isTestKey = k => /^(sk|rk)_test_[A-Za-z0-9]+$/.test(k);
const validIds = ids => Array.isArray(ids) && ids.length > 0 && ids.length <= 39 && new Set(ids).size === ids.length && ids.every(id => typeof id === 'string' && Object.hasOwn(catalog,id));
async function verify(raw, header, secret) {
  const parts = (header || '').split(',');
  const t = parts.find(x => x.startsWith('t='))?.slice(2);
  if (!secret || !t || !/^\d+$/.test(t) || Math.abs(Date.now()/1000-Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const expected = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+raw))),x=>x.toString(16).padStart(2,'0')).join('');
  return parts.filter(x=>x.startsWith('v1=')).some(x=>{const s=x.slice(3);if(s.length!==expected.length)return false;let d=0;for(let i=0;i<s.length;i++)d|=s.charCodeAt(i)^expected.charCodeAt(i);return d===0;});
}
export default {
  async fetch(req,env) {
    const u=new URL(req.url);
    if(!u.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      const orders=env.ORDERS.get(env.ORDERS.idFromName('sandbox'));
      const stripeKey=cleanSecret(env.STRIPE_SECRET_KEY), secret=cleanSecret(env.STRIPE_WEBHOOK_SECRET);
      if(u.pathname==='/api/test/status' && req.method==='GET') return orders.fetch('https://internal/status');
      if(u.pathname==='/api/test/checkout' && req.method==='POST') {
        if(req.headers.get('Origin')!==u.origin)return json({error:'Origin'},403);
        if(!isTestKey(stripeKey)||!secret.startsWith('whsec_'))return json({error:'Sandbox not configured'},503);
        const body=await req.json();
        const productIds=body.productIds ?? [body.productId];
        if(!validIds(productIds))return json({error:'Unknown or duplicate product'},400);
        const sender=typeof body.sender==='string'?body.sender.trim().slice(0,100):'';
        return orders.fetch('https://internal/create',{method:'POST',body:JSON.stringify({productIds,sender,origin:u.origin})});
      }
      if(u.pathname==='/api/stripe/webhook' && req.method==='POST') {
        const raw=await req.text();
        if(!await verify(raw,req.headers.get('Stripe-Signature'),secret))return json({error:'Signature'},400);
        if(JSON.parse(raw).livemode!==false)return json({error:'Test only'},400);
        return orders.fetch('https://internal/event',{method:'POST',body:raw});
      }
      return json({error:'Not found'},404);
    } catch {return json({error:'Request failed'},500);}
  }
};
export class TestOrders {
  constructor(ctx,env){this.ctx=ctx;this.env=env;}
  async fetch(req){
    const path=new URL(req.url).pathname;
    const storage=this.ctx.storage;
    if(path==='/status'){
      const rows=[...(await storage.list({prefix:'order:'})).values()];
      return json({paid:rows.filter(x=>x.status==='paid').map(x=>x.productId),pending:rows.filter(x=>x.status==='pending').map(x=>x.productId)});
    }
    if(path==='/create'){
      const stripeKey=cleanSecret(this.env.STRIPE_SECRET_KEY);
      if(!isTestKey(stripeKey))return json({error:'Invalid Stripe test key format'},503);
      const {productIds,sender,origin}=await req.json();
      if(!validIds(productIds))return json({error:'Unknown product'},400);
      const attempt=crypto.randomUUID();
      const keys=productIds.map(id=>'order:'+id);
      const locked=await storage.transaction(async tx=>{
        const rows=await tx.get(keys);
        if([...rows.values()].some(x=>x.status==='paid'||x.status==='pending'))return false;
        await tx.put(Object.fromEntries(productIds.map(id=>['order:'+id,{productId:id,attempt,status:'pending'}])));
        return true;
      });
      if(!locked)return json({error:'Unavailable in test'},409);
      const form=new URLSearchParams({mode:'payment',success_url:origin+'/?stripe_test=success',cancel_url:origin+'/?stripe_test=cancel','allowed_payment_method_types[0]':'card','metadata[attempt]':attempt,'metadata[productIds]':JSON.stringify(productIds),expires_at:String(Math.floor(Date.now()/1000)+1860)});
      if(sender)form.set('metadata[sender]',sender);
      productIds.forEach((id,i)=>{
        const p=`line_items[${i}]`;
        form.set(p+'[price_data][currency]','eur');form.set(p+'[price_data][unit_amount]','100');form.set(p+'[price_data][product_data][name]','TEST — '+catalog[id]);form.set(p+'[quantity]','1');
      });
      let r;
      try{r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+stripeKey,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':attempt},body:form});}
      catch{return json({error:'Uncertain Stripe response; contact test administrator'},502);}
      if(!r.ok){
        if([400,401,403,404,422].includes(r.status))await storage.transaction(async tx=>{const rows=await tx.get(keys);for(const [k,v] of rows)if(v.attempt===attempt&&v.status==='pending')await tx.delete(k);});
        return json({error:'Stripe rejected checkout',stripeStatus:r.status},502);
      }
      const s=await r.json();
      if(s.livemode!==false||typeof s.id!=='string'||!s.url||new URL(s.url).origin!=='https://checkout.stripe.com')return json({error:'Invalid session'},502);
      await storage.transaction(async tx=>{const rows=await tx.get(keys);for(const [k,v] of rows)if(v.attempt===attempt&&v.status==='pending')await tx.put(k,{...v,sessionId:s.id});});
      return json({url:s.url});
    }
    if(path==='/event'){
      const event=await req.json(),s=event.data?.object;
      if(!s?.metadata?.attempt||s.livemode!==false||typeof s.id!=='string')return json({received:true});
      let ids;
      try{ids=s.metadata.productIds?JSON.parse(s.metadata.productIds):[s.metadata.productId];}catch{return json({received:true});}
      if(!validIds(ids))return json({received:true});
      const paid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&s.payment_status==='paid'&&s.amount_total===100*ids.length&&s.currency==='eur'&&s.mode==='payment';
      const released=['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type);
      if(!paid&&!released)return json({received:true});
      await storage.transaction(async tx=>{
        const keys=ids.map(id=>'order:'+id),rows=await tx.get(keys);
        if(keys.some(k=>{const v=rows.get(k);return !v||v.attempt!==s.metadata.attempt||(v.sessionId&&v.sessionId!==s.id);}))return;
        if(paid&&keys.some(k=>!['pending','paid'].includes(rows.get(k).status)))return;
        for(const k of keys){const v=rows.get(k);if(v.status==='pending')await tx.put(k,{...v,sessionId:s.id,status:paid?'paid':'released'});}
      });
      return json({received:true});
    }
    return json({error:'Not found'},404);
  }
}
