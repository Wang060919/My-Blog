import calendar from '../../scripts/lib/contributions.js';
const { normalizeCalendar, DAY } = calendar;
export const KEY = 'github:Wang060919:v1';
export const ROUTE = '/api/contributions';
const LIMIT = 100000;
export async function boundedText(response, limit = LIMIT) {
  if (Number(response.headers.get('content-length')) > limit) throw Error('Oversized response');
  if (!response.body) throw Error('Missing response');
  const reader = response.body.getReader(); let size = 0; const chunks = [];
  try { while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > limit) throw Error('Oversized response'); chunks.push(value); } }
  catch (error) { await reader.cancel(); throw error; }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
export async function refresh(env, fetchImpl = fetch, now = new Date()) {
  if (!env.GITHUB_TOKEN || !env.CONTRIBUTIONS) throw Error('Missing configuration');
  const fetchedAt = now.toISOString(), to = fetchedAt.slice(0,10), from = new Date(Date.parse(to+'T00:00:00Z') - 364 * DAY).toISOString().slice(0,10);
  const response = await fetchImpl('https://api.github.com/graphql', { method:'POST', redirect:'error', signal:AbortSignal.timeout(15000), headers:{ Authorization:`Bearer ${env.GITHUB_TOKEN}`, 'Content-Type':'application/json', 'User-Agent':'My-Blog-Contribution-Cache' }, body:JSON.stringify({ query:'query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}', variables:{login:'Wang060919',from:from+'T00:00:00Z',to:to+'T23:59:59Z'} }) });
  if (!response.ok) throw Error('GitHub unavailable');
  const payload = JSON.parse(await boundedText(response));
  if (payload.errors || !payload.data?.user) throw Error('No calendar');
  const data = normalizeCalendar(payload.data.user.contributionsCollection.contributionCalendar, { username:'Wang060919', fetchedAt, from, to });
  const body = JSON.stringify(data);
  if (new TextEncoder().encode(body).byteLength > LIMIT) throw Error('Snapshot too large');
  // No expiry: a failed refresh must never erase the last good snapshot.
  await env.CONTRIBUTIONS.put(KEY, body, { metadata:{ fetchedAt } });
  return data;
}
export async function handle(request, env, ctx, cache) {
  const url = new URL(request.url), origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value=>value.trim()).filter(Boolean);
  const cors = new Headers({ Vary:'Origin', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  if (origin && !allowed.includes(origin)) return new Response('Origin not allowed',{status:403,headers:cors});
  if (origin) cors.set('Access-Control-Allow-Origin',origin);
  if (url.pathname !== ROUTE || url.search) return new Response('Not found',{status:404,headers:cors});
  if (request.method === 'OPTIONS') { cors.set('Access-Control-Allow-Methods','GET, OPTIONS'); cors.set('Access-Control-Max-Age','3600'); return new Response(null,{status:204,headers:cors}); }
  if (request.method !== 'GET') { cors.set('Allow','GET, OPTIONS'); return new Response('Method not allowed',{status:405,headers:cors}); }
  // Store a CORS-free response under one fixed key; apply Origin only after lookup.
  const key = new Request(url.origin + ROUTE, {method:'GET'});
  let response;
  try {
    response = cache ? await cache.match(key) : undefined;
    if (!response) {
      const entry = await env.CONTRIBUTIONS.getWithMetadata(KEY,{type:'text',cacheTtl:60});
      if (typeof entry.value !== 'string' || !entry.value || entry.value.length > LIMIT || new TextEncoder().encode(entry.value).byteLength > LIMIT || !Number.isFinite(Date.parse(entry.metadata?.fetchedAt))) throw Error('No snapshot');
      response = new Response(entry.value,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300','X-Snapshot-Fetched-At':entry.metadata.fetchedAt}});
      if (cache) ctx.waitUntil(cache.put(key,response.clone()).catch(()=>{}));
    }
  } catch { return new Response(JSON.stringify({status:'unavailable'}),{status:503,headers:new Headers([...cors,['Content-Type','application/json'],['Retry-After','300']])}); }
  const headers = new Headers(response.headers);
  for (const [name,value] of cors) headers.set(name,value);
  // Browser cache is short; no HTTP cache stores a per-Origin CORS variant.
  headers.set('Cache-Control','no-store');
  headers.set('X-Snapshot-Stale',String(Date.now()-Date.parse(headers.get('X-Snapshot-Fetched-At')) > 7*DAY));
  return new Response(response.body,{status:200,headers});
}
export default {
  fetch(request,env,ctx) { return handle(request,env,ctx,caches.default); },
  async scheduled(_event,env,ctx) { ctx.waitUntil(refresh(env).catch(()=>{ console.error('Contribution refresh failed; previous KV snapshot retained.'); throw Error('Contribution refresh failed'); })); }
};
