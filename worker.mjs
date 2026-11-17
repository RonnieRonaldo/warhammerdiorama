const file = 'gothic-cathedral-ruins.zip';
const price = 'pri_01m7mh8dhsxcgybhgx4k7jecc4';
const product = 'pro_01m7mh6v1pe1hde75r2h0ct1ar';
const cookie = '__Host-diorama';
const headers = {'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff'};
const reply = (status, data = {}) => Response.json(data, {status, headers});
async function fingerprint(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2,'0')).join('');
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const secret = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)__Host-diorama=([a-f0-9]{64})(?:;|$)/)?.[1];
    try {
      if (url.pathname === '/api/checkout-session' && request.method === 'POST') {
        if (request.headers.get('Origin') !== url.origin) return reply(403);
        if (!env.PADDLE_API_KEY || !await env.DOWNLOADS.head(file)) return reply(503);
        const value = secret || Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,'0')).join('');
        const response = reply(200, {binding:await fingerprint(value), confirmed:Boolean(secret)});
        response.headers.set('Set-Cookie', cookie+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000');
        return response;
      }
      if (!['/api/order','/api/download'].includes(url.pathname) || request.method !== 'GET') return reply(404);
      const id = url.searchParams.get('transaction');
      if (!secret || !/^txn_[a-z0-9]{26}$/.test(id || '')) return reply(403);
      const result = await fetch('https://api.paddle.com/transactions/'+id, {headers:{Authorization:'Bearer '+env.PADDLE_API_KEY}});
      if (!result.ok) return reply(result.status === 404 ? 404 : 503);
      const {data} = await result.json();
      if (data.custom_data?.order_binding !== await fingerprint(secret) ||
          !data.items?.some(item => item.price?.id === price && item.price.product_id === product && item.quantity >= 1)) return reply(403);
      if (!['paid','completed'].includes(data.status)) return reply(data.status === 'canceled' ? 410 : 202);
      if (url.pathname === '/api/order') return reply(200, {ready:true});
      const object = await env.DOWNLOADS.get(file);
      if (!object) return reply(503);
      return new Response(object.body, {headers:{...headers,'Content-Type':'application/zip','Content-Disposition':'attachment; filename="'+file+'"'}});
    } catch { return reply(503); }
  }
};
