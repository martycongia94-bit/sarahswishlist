
import catalog from './catalog.json';
import { commitCheckoutLocks } from './checkout-locks.js';
import firebaseConfig from '../firebase-applet-config.json';

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });

const cleanSecret = v =>
  typeof v === 'string' ? v.trim() : '';

const isTestKey = k =>
  /^(sk|rk)_test_[A-Za-z0-9]+$/.test(k);

const validIds = ids =>
  Array.isArray(ids) &&
  ids.length > 0 &&
  ids.length <= 39 &&
  new Set(ids).size === ids.length &&
  ids.every(id =>
    typeof id === 'string' &&
    Object.hasOwn(catalog, id)
  );

// STRIPE WEBHOOK SECURITY

async function verify(raw, header, secret) {
  const parts = (header || '').split(',');
  const t = parts.find(x => x.startsWith('t='))?.slice(2);

  if (
    !secret ||
    !t ||
    !/^\d+$/.test(t) ||
    Math.abs(Date.now() / 1000 - Number(t)) > 300
  ) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expected = Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(t + '.' + raw)
      )
    ),
    x => x.toString(16).padStart(2, '0')
  ).join('');

  return parts
    .filter(x => x.startsWith('v1='))
    .some(x => {
      const s = x.slice(3);

      if (s.length !== expected.length) return false;

      let d = 0;

      for (let i = 0; i < s.length; i++) {
        d |= s.charCodeAt(i) ^ expected.charCodeAt(i);
      }

      return d === 0;
    });
}

// FIREBASE ADMIN AUTHENTICATION

async function verifyAdmin(req, env, ownerOnly = false) {
  try {
    const token = req.headers
      .get('Authorization')
      ?.match(/^Bearer (.+)$/i)?.[1];

    if (!token || token.length > 10000) return false;

    const project = env.FIREBASE_PROJECT_ID;
    const database = env.FIREBASE_DATABASE_ID;

    if (!project || !database || !env.FIREBASE_OWNER_UID) {
      return false;
    }

    const parts = token.split('.');

    if (parts.length !== 3) return false;

    const decode = s => Uint8Array.from(
      atob(s.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const header = JSON.parse(
      new TextDecoder().decode(decode(parts[0]))
    );

    const claims = JSON.parse(
      new TextDecoder().decode(decode(parts[1]))
    );

    if (header.alg !== 'RS256' || !header.kid) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);

    if (
      claims.aud !== project ||
      claims.iss !== `https://securetoken.google.com/${project}` ||
      !Number.isFinite(claims.exp) ||
      claims.exp <= now ||
      !Number.isFinite(claims.iat) ||
      claims.iat > now ||
      !Number.isFinite(claims.auth_time) ||
      claims.auth_time > now ||
      claims.email_verified !== true ||
      typeof claims.email !== 'string' ||
      typeof claims.sub !== 'string' ||
      !claims.sub ||
      claims.sub.length > 128
    ) return false;

    const response = await fetch(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    );

    if (!response.ok) return false;

    const { keys } = await response.json();
    const jwk = keys.find(k => k.kid === header.kid);

    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      decode(parts[2]),
      new TextEncoder().encode(
        parts[0] + '.' + parts[1]
      )
    );

    if (!valid) return false;

    if (claims.sub === env.FIREBASE_OWNER_UID) {
      return true;
    }

    if (ownerOnly) return false;

    const admin = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/${encodeURIComponent(database)}/documents/admins/${encodeURIComponent(claims.sub)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!admin.ok) return false;

    const data = await admin.json();

    return (
      data.fields?.uid?.stringValue === claims.sub &&
      data.fields?.email?.stringValue?.toLowerCase() ===
        claims.email.toLowerCase()
    );

  } catch {
    return false;
  }
}

async function checkFirebaseAvailability(ids, env) {
  const project = env.FIREBASE_PROJECT_ID;
  const database = env.FIREBASE_DATABASE_ID;
  if (!project || !database) throw new Error('Firebase not configured');

  const results = await Promise.all(ids.map(async id => {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/${encodeURIComponent(database)}/documents/wishlist_products/${encodeURIComponent(id)}`;
    const response = await fetch(url);
    if (response.status === 404) return false;
    if (!response.ok) throw new Error('Firebase unavailable');
    const { fields = {} } = await response.json();
    if (fields.id?.stringValue !== id || fields.received?.booleanValue !== false) return false;
    const status = fields.status?.stringValue;
    if (status === 'available') return true;
    if (status === 'reserved') {
      const expiry = Date.parse(fields.reservedUntil?.timestampValue || '');
      return Number.isFinite(expiry) && expiry <= Date.now();
    }
    return false;
  }));
  return results.every(Boolean);
}

// Dedicated Firebase identity: no admin privileges.
async function authenticateFirebaseWorker(env) {
  const email = cleanSecret(env.FIREBASE_WORKER_EMAIL);
  const password = env.FIREBASE_WORKER_PASSWORD;
  const uid = cleanSecret(env.FIREBASE_WORKER_UID);
  if (!email || !password || !uid || !env.FIREBASE_PROJECT_ID ||
      firebaseConfig.projectId !== env.FIREBASE_PROJECT_ID) {
    throw new Error('Firebase worker configuration missing');
  }
  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
      encodeURIComponent(firebaseConfig.apiKey),
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }) }
  );
  if (!response.ok) throw new Error('Firebase worker authentication failed');
  const data = await response.json();
  if (data.localId !== uid || typeof data.idToken !== 'string') {
    throw new Error('Unexpected Firebase worker identity');
  }
  return data.idToken;
}

// Shared checkout lock adapter, staged only until migration is complete.
async function sharedCheckoutLock(env, ids, attempt, operation) {
  const token = await authenticateFirebaseWorker(env);
  return commitCheckoutLocks(env, token, ids, attempt, operation);
}

// MAIN WORKER

export default {
  async fetch(req, env) {
    const u = new URL(req.url);

    if (!u.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(req);
    }

    try {
      const orders = env.ORDERS.get(
        env.ORDERS.idFromName('sandbox')
      );

      const stripeKey = cleanSecret(env.STRIPE_SECRET_KEY);
      const secret = cleanSecret(env.STRIPE_WEBHOOK_SECRET);

      // Crossmint owner-only read-only API diagnostic: no purchases or profile disclosure.
      if (u.pathname === '/api/admin/crossmint-check' && req.method === 'GET') {
        if (!await verifyAdmin(req, env, true)) return json({ error: 'Unauthorized' }, 403);
        const configured = Boolean(cleanSecret(env.CROSSMINT_SERVER_API_KEY));
        if (!configured) return json({ configured, connectionVerified: false, purchasesEnabled: false }, 503);
        try {
          const response = await fetch('https://www.crossmint.com/api/unstable/agent-checkouts/buyer-profiles?limit=1', {
            method: 'GET',
            headers: { 'X-API-KEY': cleanSecret(env.CROSSMINT_SERVER_API_KEY), Accept: 'application/json' },
            redirect: 'manual',
            signal: AbortSignal.timeout(10000)
          });
          const status = response.status;
          await response.body?.cancel();
          return json({ configured, connectionVerified: status === 200, crossmintStatus: status, purchasesEnabled: false }, status === 200 ? 200 : 502);
        } catch (error) {
          // Safe diagnostic only: expose the fetch failure class/message, never credentials.
          const diagnosticError = error instanceof Error
            ? `${error.name}: ${error.message}`.slice(0, 240)
            : 'Unknown fetch error';
          return json({
            configured,
            connectionVerified: false,
            purchasesEnabled: false,
            diagnosticError
          }, 503);
        }
      }

      // Admin-only, read-only identity diagnostic. Never returns credentials.
      if (u.pathname === '/api/admin/firebase-worker-check' && req.method === 'GET') {
        if (!await verifyAdmin(req, env)) return json({ error: 'Unauthorized' }, 403);
        try {
          await authenticateFirebaseWorker(env);
          return json({ test: true, authenticated: true });
        } catch {
          return json({ test: true, authenticated: false }, 503);
        }
      }

      if (u.pathname === '/api/admin/migration-readiness' && req.method === 'GET') {
        if (!await verifyAdmin(req, env)) return json({ error: 'Unauthorized' }, 403);
        return orders.fetch('https://internal/admin/migration-readiness');
      }

      if (u.pathname === '/api/admin/migration-preflight' && req.method === 'GET') {
        if (!await verifyAdmin(req, env)) return json({error:'Unauthorized'},403);
        return orders.fetch('https://internal/admin/migration-preflight');
      }

      if (u.pathname === '/api/admin/migrate-locks' && req.method === 'POST') {
        if (req.headers.get('Origin') !== u.origin || !await verifyAdmin(req, env, true)) return json({error:'Unauthorized'},403);
        return orders.fetch('https://internal/admin/migrate-locks', {method:'POST'});
      }

      // PROTECTED ADMIN ORDERS

      if (
        u.pathname === '/api/admin/orders' &&
        req.method === 'GET'
      ) {
        if (!await verifyAdmin(req, env)) {
          return json({ error: 'Unauthorized' }, 403);
        }

        return orders.fetch(
          'https://internal/admin/orders'
        );
      }

      // PUBLIC PRODUCT STATUS

      if (
        u.pathname === '/api/test/status' &&
        req.method === 'GET'
      ) {
        return orders.fetch('https://internal/status');
      }

      // Read-only sandbox availability diagnostic (never creates a checkout).
      if (u.pathname === '/api/test/availability' && req.method === 'GET') {
        const productIds = u.searchParams.getAll('id');
        if (!validIds(productIds)) return json({ error: 'Unknown product' }, 400);
        try {
          if (!await checkFirebaseAvailability(productIds, env)) {
            return json({ test: true, available: false, error: 'Product unavailable in Firebase' }, 409);
          }
          const statusResponse = await orders.fetch('https://internal/status');
          if (!statusResponse.ok) throw new Error('Status unavailable');
          const status = await statusResponse.json();
          if (productIds.some(id => status.paid.includes(id) || status.pending.includes(id))) {
            return json({ test: true, available: false, error: 'Unavailable in test' }, 409);
          }
          return json({ test: true, available: true });
        } catch {
          return json({ test: true, error: 'Unable to verify product availability' }, 503);
        }
      }

      // STRIPE CHECKOUT

      if (
        u.pathname === '/api/test/checkout' &&
        req.method === 'POST'
      ) {
        if (req.headers.get('Origin') !== u.origin) {
          return json({ error: 'Origin' }, 403);
        }

        if (
          !isTestKey(stripeKey) ||
          !secret.startsWith('whsec_')
        ) {
          return json(
            { error: 'Sandbox not configured' },
            503
          );
        }

        const body = await req.json();
        const productIds =
          body.productIds ?? [body.productId];

        if (!validIds(productIds)) {
          return json(
            { error: 'Unknown or duplicate product' },
            400
          );
        }

        const sender =
          typeof body.sender === 'string'
            ? body.sender.trim().slice(0, 100)
            : '';

        return orders.fetch(
          'https://internal/create',
          {
            method: 'POST',
            body: JSON.stringify({
              productIds,
              sender,
              origin: u.origin
            })
          }
        );
      }

      // STRIPE WEBHOOK

      if (
        u.pathname === '/api/stripe/webhook' &&
        req.method === 'POST'
      ) {
        const raw = await req.text();

        if (
          !await verify(
            raw,
            req.headers.get('Stripe-Signature'),
            secret
          )
        ) {
          return json({ error: 'Signature' }, 400);
        }

        if (JSON.parse(raw).livemode !== false) {
          return json({ error: 'Test only' }, 400);
        }

        return orders.fetch(
          'https://internal/event',
          {
            method: 'POST',
            body: raw
          }
        );
      }

      return json({ error: 'Not found' }, 404);

    } catch {
      return json({ error: 'Request failed' }, 500);
    }
  }
};

// DURABLE OBJECT

export class TestOrders {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(req) {
    const path = new URL(req.url).pathname;
    const storage = this.ctx.storage;

    // ADMIN ORDER HISTORY

    if (path === '/admin/orders') {
      const rows = [
        ...(await storage.list({
          prefix: 'order:'
        })).values()
      ];

      const grouped = new Map();

      for (const row of rows) {
        if (!row.attempt) continue;

        const id = row.sessionId || row.attempt;

        if (!grouped.has(id)) {
          grouped.set(id, {
            id,
            sessionId: row.sessionId || null,
            status: row.status,
            products: [],
            amount: 0,
            currency: 'eur',
            sender: null,
            createdAt: null,
            test: true,
            stripeDetailsAvailable: false
          });
        }

        const order = grouped.get(id);

        order.products.push({
          id: row.productId,
          name: catalog[row.productId] || row.productId,
          status: row.status
        });

        order.amount += 100;

        if (order.status !== row.status) {
          order.status = 'mixed';
        }
      }

      const orders = [...grouped.values()];

      const stripeKey = cleanSecret(
        this.env.STRIPE_SECRET_KEY
      );

      if (isTestKey(stripeKey)) {
        for (let i = 0; i < orders.length; i += 5) {
          await Promise.all(
            orders.slice(i, i + 5).map(async order => {
              if (!order.sessionId) return;

              try {
                const response = await fetch(
                  'https://api.stripe.com/v1/checkout/sessions/' +
                    encodeURIComponent(order.sessionId),
                  {
                    headers: {
                      Authorization: 'Bearer ' + stripeKey
                    }
                  }
                );

                if (!response.ok) return;

                const session = await response.json();

                if (session.livemode !== false) return;

                order.sender =
                  session.metadata?.sender || null;

                order.createdAt = session.created
                  ? new Date(
                      session.created * 1000
                    ).toISOString()
                  : null;

                order.amount =
                  session.amount_total ?? order.amount;

                order.currency =
                  session.currency || 'eur';

                order.stripeDetailsAvailable = true;

              } catch {
                // Keep locally available details.
              }
            })
          );
        }
      }

      orders.sort((a, b) =>
        (b.createdAt || '').localeCompare(
          a.createdAt || ''
        )
      );

      const paidOrders = orders.filter(
        o => o.status === 'paid'
      );

      return json({
        test: true,
        orders,
        summary: {
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          paidProducts: paidOrders.reduce(
            (sum, o) => sum + o.products.length,
            0
          ),
          totalPaid: paidOrders.reduce(
            (sum, o) => sum + o.amount,
            0
          )
        }
      });
    }

    // Read-only preflight: validate historical paid products before migration.
    if (path === '/admin/migration-preflight') {
      if (this.env.FIREBASE_CHECKOUT_MODE !== 'migration') return json({error:'Maintenance required'},409);
      const rows = [...(await storage.list({prefix:'order:'})).values()];
      if (rows.some(x => x.status === 'pending')) return json({error:'Pending orders exist'},409);
      const paid = rows.filter(x => x.status === 'paid');
      const results = [];
      for (const row of paid) {
        const available = validIds([row.productId]) && typeof row.attempt === 'string' &&
          /^[a-zA-Z0-9_-]{1,128}$/.test(row.attempt) &&
          await checkFirebaseAvailability([row.productId], this.env);
        results.push({id:row.productId, available});
      }
      return json({test:true, ready:results.every(x=>x.available), products:results});
    }

    if (path === '/admin/migrate-locks' && req.method === 'POST') {
      if (this.env.FIREBASE_CHECKOUT_MODE !== 'migration') return json({error:'Maintenance required'},409);
      const rows = [...(await storage.list({prefix:'order:'})).values()];
      if (rows.some(x => x.status === 'pending')) return json({error:'Pending orders exist'},409);
      const paid = rows.filter(x => x.status === 'paid');
      if (!paid.length || paid.some(x => !validIds([x.productId]) || !/^[a-zA-Z0-9_-]{1,128}$/.test(x.attempt || ''))) return json({error:'Invalid historical orders'},409);
      const groups = new Map();
      for (const row of paid) {
        if (!groups.has(row.attempt)) groups.set(row.attempt, []);
        groups.get(row.attempt).push(row.productId);
      }
      try {
        for (const [attempt, ids] of groups) {
          for (let i = 0; i < ids.length; i += 10) {
            const batch = ids.slice(i,i+10);
            await sharedCheckoutLock(this.env,batch,attempt,'acquire');
            await sharedCheckoutLock(this.env,batch,attempt,'paid');
          }
        }
        return json({test:true,migrated:paid.length});
      } catch {
        return json({error:'Migration incomplete; keep maintenance active and retry after review'},503);
      }
    }

    // Read-only migration readiness diagnostic.
    if (path === '/admin/migration-readiness') {
      const rows = [...(await storage.list({ prefix: 'order:' })).values()];
      return json({
        test: true,
        paused: this.env.FIREBASE_CHECKOUT_MODE === 'migration',
        paid: rows.filter(x => x.status === 'paid').length,
        pending: rows.filter(x => x.status === 'pending').length
      });
    }

    // PUBLIC STATUS

    if (path === '/status') {
      const rows = [
        ...(await storage.list({
          prefix: 'order:'
        })).values()
      ];

      return json({
        paid: rows
          .filter(x => x.status === 'paid')
          .map(x => x.productId),

        pending: rows
          .filter(x => x.status === 'pending')
          .map(x => x.productId)
      });
    }

    // CREATE MULTI-PRODUCT CHECKOUT

    if (path === '/create') {
      const stripeKey = cleanSecret(
        this.env.STRIPE_SECRET_KEY
      );

      if (!isTestKey(stripeKey)) {
        return json(
          { error: 'Invalid Stripe test key format' },
          503
        );
      }

      const {
        productIds,
        sender,
        origin
      } = await req.json();

      if (!validIds(productIds)) {
        return json(
          { error: 'Unknown product' },
          400
        );
      }

      try {
        if (!await checkFirebaseAvailability(productIds, this.env)) {
          return json({ error: 'Product unavailable in Firebase' }, 409);
        }
      } catch {
        return json({ error: 'Unable to verify product availability' }, 503);
      }

      // Migration gate: stop new sessions while existing orders are synchronized.
      if (this.env.FIREBASE_CHECKOUT_MODE !== 'active') {
        return json({ error: 'Sandbox checkout temporarily paused for migration' }, 503);
      }

      if (productIds.length > 10) return json({error:'Maximum 10 products per checkout'},400);
      const attempt = crypto.randomUUID();

      const keys = productIds.map(
        id => 'order:' + id
      );

      const locked = await storage.transaction(
        async tx => {
          const rows = await tx.get(keys);

          if (
            [...rows.values()].some(
              x =>
                x.status === 'paid' ||
                x.status === 'pending'
            )
          ) {
            return false;
          }

          await tx.put(
            Object.fromEntries(
              productIds.map(id => [
                'order:' + id,
                {
                  productId: id,
                  attempt,
                  status: 'pending'
                }
              ])
            )
          );

          return true;
        }
      );

      if (!locked) {
        return json(
          { error: 'Unavailable in test' },
          409
        );
      }

      try {
        await sharedCheckoutLock(this.env, productIds, attempt, 'acquire');
      } catch {
        // Fail closed: a remote commit may have succeeded despite a network error.
        return json({error:'Checkout lock uncertain; administrator review required'},503);
      }

      const form = new URLSearchParams({
        mode: 'payment',

        success_url:
          origin + '/?stripe_test=success',

        cancel_url:
          origin + '/?stripe_test=cancel',

        'allowed_payment_method_types[0]': 'card',

        'metadata[attempt]': attempt,

        'metadata[productIds]':
          JSON.stringify(productIds),

        expires_at: String(
          Math.floor(Date.now() / 1000) + 1860
        )
      });

      if (sender) {
        form.set('metadata[sender]', sender);
      }

      productIds.forEach((id, i) => {
        const p = `line_items[${i}]`;

        form.set(
          p + '[price_data][currency]',
          'eur'
        );

        form.set(
          p + '[price_data][unit_amount]',
          '100'
        );

        form.set(
          p + '[price_data][product_data][name]',
          'TEST — ' + catalog[id]
        );

        form.set(p + '[quantity]', '1');
      });

      let r;

      try {
        r = await fetch(
          'https://api.stripe.com/v1/checkout/sessions',
          {
            method: 'POST',

            headers: {
              Authorization: 'Bearer ' + stripeKey,

              'Content-Type':
                'application/x-www-form-urlencoded',

              'Idempotency-Key': attempt
            },

            body: form
          }
        );

      } catch {
        return json(
          {
            error:
              'Uncertain Stripe response; contact test administrator'
          },
          502
        );
      }

      if (!r.ok) {
        if (
          [400, 401, 403, 404, 422].includes(r.status)
        ) {
          try {
            await sharedCheckoutLock(this.env, productIds, attempt, 'release');
          } catch {
            return json({error:'Lock release uncertain; administrator review required'},503);
          }
          await storage.transaction(async tx => {
            const rows = await tx.get(keys);

            for (const [k, v] of rows) {
              if (
                v.attempt === attempt &&
                v.status === 'pending'
              ) {
                await tx.delete(k);
              }
            }
          });
        }

        return json(
          {
            error: 'Stripe rejected checkout',
            stripeStatus: r.status
          },
          502
        );
      }

      const s = await r.json();

      if (
        s.livemode !== false ||
        typeof s.id !== 'string' ||
        !s.url ||
        new URL(s.url).origin !==
          'https://checkout.stripe.com'
      ) {
        return json(
          { error: 'Invalid session' },
          502
        );
      }

      await storage.transaction(async tx => {
        const rows = await tx.get(keys);

        for (const [k, v] of rows) {
          if (
            v.attempt === attempt &&
            v.status === 'pending'
          ) {
            await tx.put(k, {
              ...v,
              sessionId: s.id
            });
          }
        }
      });

      return json({ url: s.url });
    }

    // PROCESS STRIPE EVENTS

    if (path === '/event') {
      const event = await req.json();
      const s = event.data?.object;

      if (
        !s?.metadata?.attempt ||
        s.livemode !== false ||
        typeof s.id !== 'string'
      ) {
        return json({ received: true });
      }

      let ids;

      try {
        ids = s.metadata.productIds
          ? JSON.parse(s.metadata.productIds)
          : [s.metadata.productId];

      } catch {
        return json({ received: true });
      }

      if (!validIds(ids)) {
        return json({ received: true });
      }

      const paid =
        [
          'checkout.session.completed',
          'checkout.session.async_payment_succeeded'
        ].includes(event.type) &&
        s.payment_status === 'paid' &&
        s.amount_total === 100 * ids.length &&
        s.currency === 'eur' &&
        s.mode === 'payment';

      const released = [
        'checkout.session.expired',
        'checkout.session.async_payment_failed'
      ].includes(event.type);

      if (!paid && !released) {
        return json({ received: true });
      }

      const eventKeys = ids.map(id => 'order:' + id);
      const eventRows = await storage.get(eventKeys);
      if (eventKeys.some(k => {
        const v = eventRows.get(k);
        return !v || v.attempt !== s.metadata.attempt ||
          (v.sessionId && v.sessionId !== s.id);
      })) return json({received:true});
      if (eventKeys.every(k => eventRows.get(k).status === (paid ? 'paid' : 'released'))) {
        return json({received:true});
      }
      if (eventKeys.some(k => eventRows.get(k).status !== 'pending')) {
        return json({error:'Conflicting order state; review required'},503);
      }
      try {
        await sharedCheckoutLock(this.env, ids, s.metadata.attempt, paid ? 'paid' : 'release');
      } catch {
        return json({error:'Firebase finalization failed; retry required'},503);
      }

      await storage.transaction(async tx => {
        const keys = ids.map(
          id => 'order:' + id
        );

        const rows = await tx.get(keys);

        if (
          keys.some(k => {
            const v = rows.get(k);

            return (
              !v ||
              v.attempt !== s.metadata.attempt ||
              (v.sessionId && v.sessionId !== s.id)
            );
          })
        ) return;

        if (
          paid &&
          keys.some(
            k =>
              !['pending', 'paid'].includes(
                rows.get(k).status
              )
          )
        ) return;

        for (const k of keys) {
          const v = rows.get(k);

          if (v.status === 'pending') {
            await tx.put(k, {
              ...v,
              sessionId: s.id,
              status: paid ? 'paid' : 'released'
            });
          }
        }
      });

      return json({ received: true });
    }

    return json({ error: 'Not found' }, 404);
  }
}
