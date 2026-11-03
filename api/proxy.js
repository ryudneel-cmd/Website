export const config = { runtime: 'edge' };

const EXACT = new Set(['leokhol.com']);
const SUFFIX = '.leokhol.com';
const TIMEOUT = 9000;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': '*',
  'access-control-max-age': '86400',
};

const json = (o, s) => new Response(JSON.stringify(o), {
  status: s, headers: { ...CORS, 'content-type': 'application/json' },
});

const FWD = ['accept', 'accept-language', 'content-type', 'cookie', 'referer',
  'origin', 'user-agent', 'x-requested-with', 'sec-ch-ua',
  'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-fetch-dest',
  'sec-fetch-mode', 'sec-fetch-site'];

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const q = new URL(req.url).searchParams;
  const raw = q.get('url');
  const ip = q.get('ip');
  if (!raw) return json({ error: 'url manquante' }, 400);

  let target;
  try { target = new URL(raw); } catch { return json({ error: 'url invalide' }, 400); }
  if (target.protocol !== 'https:' && target.protocol !== 'http:')
    return json({ error: 'protocole invalide' }, 400);

  const host = target.hostname.toLowerCase();
  if (!EXACT.has(host) && !host.endsWith(SUFFIX))
    return json({ error: 'hote non autorise', host }, 403);

  if (ip && !/^[0-9a-f.:]+$/i.test(ip)) return json({ error: 'ip invalide' }, 400);

  const dest = ip
    ? `http://${ip.includes(':') ? `[${ip}]` : ip}${target.pathname}${target.search}`
    : target.toString();

  const headers = new Headers();
  for (const k of FWD) {
    const v = req.headers.get(k);
    if (v) headers.set(k, v);
  }
  if (ip) headers.set('host', host);
  if (!headers.has('user-agent'))
    headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36');

  const body = (req.method === 'GET' || req.method === 'HEAD') ? undefined : await req.text();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT);
  const t0 = Date.now();

  try {
    const res = await fetch(dest, { method: req.method, headers, body, redirect: 'manual', signal: ac.signal });
    const buf = await res.arrayBuffer();
    const out = new Headers(CORS);
    out.set('cache-control', 'no-store');
    out.set('x-proxy-status', String(res.status));
    out.set('x-proxy-ms', String(Date.now() - t0));
    const ct = res.headers.get('content-type');
    if (ct) out.set('content-type', ct);
    const loc = res.headers.get('location');
    if (loc) out.set('x-proxy-location', loc);
    return new Response(buf, { status: res.status, headers: out });
  } catch (e) {
    return json({ error: String((e && e.name) || e), ms: Date.now() - t0 }, 502);
  } finally {
    clearTimeout(timer);
  }
}
