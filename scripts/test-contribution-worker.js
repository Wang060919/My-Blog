const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const snapshot=require('../data/github_contributions.json');
(async()=>{
 const {handle,refresh,KEY}=await import('../workers/contributions/index.mjs');
 const source=fs.readFileSync(path.join(__dirname,'../assets/js/contribution-data.js'),'utf8');
 const {validateLiveSnapshot,fetchLiveSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.equal(validateLiveSnapshot(snapshot),snapshot);
 const fixture=require('../tests/fixtures/contributions-example.json');assert.throws(()=>validateLiveSnapshot(fixture));
 for(const mutate of [s=>s.total++,s=>s.weeks[0].days.pop(),s=>s.weeks[0].days[0]={date:'2025-10-19',count:0,level:0,contributionLevel:'NONE'},s=>s.weeks[2].days[0].level=9,s=>s.fetchedAt='2099-01-01T00:00:00Z']){const s=structuredClone(snapshot);mutate(s);assert.throws(()=>validateLiveSnapshot(s));}
 let reads=0,writes=0,stored=JSON.stringify(snapshot);const env={ALLOWED_ORIGINS:'https://blog.example,https://preview.example',GITHUB_TOKEN:'test-only',CONTRIBUTIONS:{async getWithMetadata(key){assert.equal(key,KEY);reads++;return {value:stored,metadata:{fetchedAt:snapshot.fetchedAt}};},async put(key,value,options){assert.equal(key,KEY);assert.ok(options.metadata.fetchedAt);stored=value;writes++;}}};
 const pending=[],ctx={waitUntil(p){pending.push(p);}},entries=new Map(),cache={async match(key){return entries.get(key.url)?.clone();},async put(key,response){assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);entries.set(key.url,response);}};
 const get=origin=>new Request('https://cache.example/api/contributions',{headers:origin?{Origin:origin}:{}});
 let r=await handle(get('https://blog.example'),env,ctx,cache);assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://blog.example');assert.equal(r.headers.get('Vary'),'Origin');await Promise.all(pending);
 r=await handle(get('https://preview.example'),env,ctx,cache);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://preview.example');assert.equal(reads,1);
 r=await handle(get('https://evil.example'),env,ctx,cache);assert.equal(r.status,403);assert.equal(reads,1);
 for(const request of [new Request('https://cache.example/api/contributions?user=someone'),new Request('https://cache.example/refresh'),new Request('https://cache.example/api/contributions',{method:'POST'})])assert.ok((await handle(request,env,ctx,cache)).status>=400);
 assert.equal((await handle(new Request('https://cache.example/api/contributions',{method:'OPTIONS',headers:{Origin:'https://blog.example'}}),env,ctx,cache)).status,204);
 assert.equal((await handle(get(),{...env,CONTRIBUTIONS:{getWithMetadata:async()=>({value:null})}},ctx)).status,503);
 const raw={totalContributions:snapshot.total,weeks:snapshot.weeks.map(w=>({contributionDays:w.days.filter(Boolean).map(d=>({date:d.date,contributionCount:d.count,contributionLevel:d.contributionLevel}))}))};
 const payload={data:{user:{contributionsCollection:{contributionCalendar:raw}}}};
 for(const fake of [async()=>{throw Error('offline')},async()=>new Response('',{status:403}),async()=>new Response('{'),async()=>new Response(JSON.stringify({errors:[{}]})),async()=>new Response('x'.repeat(100001)),async()=>new Response(JSON.stringify({data:{user:{contributionsCollection:{contributionCalendar:{...raw,totalContributions:0}}}}}))]){await assert.rejects(refresh(env,fake,new Date(snapshot.fetchedAt)));assert.equal(writes,0);assert.equal(stored,JSON.stringify(snapshot));}
 await refresh(env,async(url,options)=>{assert.equal(url,'https://api.github.com/graphql');assert.equal(JSON.parse(options.body).variables.login,'Wang060919');assert.equal(options.redirect,'error');return new Response(JSON.stringify(payload));},new Date(snapshot.fetchedAt));assert.equal(writes,1);
 assert.equal((await fetchLiveSnapshot('https://cache.example/api/contributions',async()=>new Response(JSON.stringify(snapshot),{headers:{'Content-Type':'application/json'}}))).total,379);
 await assert.rejects(fetchLiveSnapshot('http://cache.example/api/contributions'));
 await assert.rejects(fetchLiveSnapshot('https://cache.example/api/contributions',async()=>new Response('x'.repeat(100001),{headers:{'Content-Type':'application/json'}})));
 assert.ok(!fs.existsSync(path.join(__dirname,'../.github/workflows/contribution-refresh.yml')));
 assert.ok(!fs.existsSync(path.join(__dirname,'publish-contributions.js')));
 console.log('Worker/cache tests passed: fixed source/routes, CORS isolation, cached hot path, 503, bounded payloads, failed refresh retention, real-only client validation, and removal of write-main automation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
