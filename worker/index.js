import catalog from './catalog.json';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
async function verify(raw,header,secret){
 const parts=(header||'').split(','); const t=parts.find(x=>x.startsWith('t='))?.slice(2);
 if(!secret||!t||!/^\d+$/.test(t)||Math.abs(Date.now()/1000-Number(t))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const expected=hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(t+'.'+raw)));
 return parts.filter(x=>x.startsWith('v1=')).some(x=>{const s=x.slice(3);if(s.length!==expected.length)return false;let d=0;for(let i=0;i<s.length;i++)d|=s.charCodeAt(i)^expected.charCodeAt(i);return d===0;});
}
export default {async fetch(req,env){
 const u=new URL(req.url); if(!u.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
 try{
 if(u.pathname==='/api/test/status'&&req.method==='GET')return env.ORDERS.get(env.ORDERS.idFromName('sandbox')).fetch('https://internal/status');
 if(u.pathname==='/api/test/checkout'&&req.method==='POST'){
 if(req.headers.get('Origin')!==u.origin)return json({error:'Origin'},403);
if(!env.STRIPE_SECRET_KEY)return json({error:'Stripe API key missing'},503);
if(!env.STRIPE_SECRET_KEY.startsWith('sk_test_'))return json({error:'Invalid Stripe test key format'},503);
if(!env.STRIPE_WEBHOOK_SECRET)return json({error:'Webhook secret missing'},503);
if(!env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_'))return json({error:'Invalid webhook secret format'},503); const {productId}=await req.json(); if(typeof productId!=='string'||!Object.hasOwn(catalog,productId))return json({error:'Unknown product'},400);
 return env.ORDERS.get(env.ORDERS.idFromName('sandbox')).fetch('https://internal/create',{method:'POST',body:JSON.stringify({productId,origin:u.origin})});
 }
 if(u.pathname==='/api/stripe/webhook'&&req.method==='POST'){
 const raw=await req.text();if(!await verify(raw,req.headers.get('Stripe-Signature'),env.STRIPE_WEBHOOK_SECRET))return json({error:'Signature'},400);
 const event=JSON.parse(raw);if(event.livemode!==false)return json({error:'Test only'},400);
 return env.ORDERS.get(env.ORDERS.idFromName('sandbox')).fetch('https://internal/event',{method:'POST',body:raw});
 }
 return json({error:'Not found'},404);
 }catch{return json({error:'Request failed'},500);}
}};
export class TestOrders{
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async fetch(req){return this.ctx.blockConcurrencyWhile(async()=>{
 const path=new URL(req.url).pathname;
 if(path==='/status'){const rows=await this.ctx.storage.list({prefix:'order:'});return json({paid:[...rows.values()].filter(x=>x.status==='paid').map(x=>x.productId),pending:[...rows.values()].filter(x=>x.status==='pending').map(x=>x.productId)});}
 if(path==='/create'){
 const {productId,origin}=await req.json();const key='order:'+productId;const old=await this.ctx.storage.get(key);
 if(old?.status==='paid'||old?.status==='pending')return json({error:'Unavailable in test'},409);
 const attempt=crypto.randomUUID();
 const form=new URLSearchParams({mode:'payment',success_url:origin+'/?stripe_test=success',cancel_url:origin+'/?stripe_test=cancel', 'payment_method_types[0]':'card','line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':'100','line_items[0][price_data][product_data][name]':'TEST — '+catalog[productId],'line_items[0][quantity]':'1','metadata[productId]':productId,'metadata[attempt]':attempt,expires_at:String(Math.floor(Date.now()/1000)+1860)});
 await this.ctx.storage.put(key,{productId,attempt,status:'pending'});
 let r;try{r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+this.env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':attempt},body:form});}catch{return json({error:'Uncertain Stripe response; contact test administrator'},502);}
 if(!r.ok){if(r.status<500)await this.ctx.storage.delete(key);return json({error:'Stripe rejected checkout'},502);}
 const session=await r.json();if(session.livemode!==false||!session.url)return json({error:'Invalid session'},502);
 await this.ctx.storage.put(key,{productId,attempt,sessionId:session.id,status:'pending'});return json({url:session.url});
 }
 if(path==='/event'){
 const event=await req.json();const s=event.data?.object;const id=s?.metadata?.productId;if(!id||!Object.hasOwn(catalog,id))return json({received:true});
 const key='order:'+id;const old=await this.ctx.storage.get(key);if(!old||old.attempt!==s.metadata.attempt||(old.sessionId&&old.sessionId!==s.id))return json({received:true});
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&s.payment_status==='paid'&&s.amount_total===100&&s.currency==='eur'&&s.mode==='payment')await this.ctx.storage.put(key,{...old,sessionId:s.id,status:'paid'});
 else if(old.status==='pending'&&['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type))await this.ctx.storage.put(key,{...old,status:'released'});
 return json({received:true});
 }
 return json({error:'Not found'},404);
 });}
}
