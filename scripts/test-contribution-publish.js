const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { publish } = require('./publish-contributions');
const fixture = require('../tests/fixtures/contributions-example.json');
const { validateSnapshot } = require('./lib/contributions');
const real = { ...fixture, example:false, source:'github-graphql' };
validateSnapshot(real);
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'contribution-publish-test-'));
const input=path.join(directory,'snapshot.json');
fs.writeFileSync(input,JSON.stringify(real,null,2)+'\n');
const config={token:'test-only',input,event:'schedule',ref:'refs/heads/main',repository:'Wang060919/My-Blog',now:Date.parse(real.fetchedAt)};
const old={status:'unavailable',username:'Wang060919'};
const response=value=>({ok:true,json:async()=>value});
const file=value=>({type:'file',encoding:'base64',sha:'a'.repeat(40),content:Buffer.from(JSON.stringify(value,null,2)+'\n').toString('base64')});
(async()=>{
 let calls=[];
 const fake=async(url,request)=>{calls.push({url,...request});return response(request.method==='PUT'?{commit:{sha:'b'.repeat(40)}}:file(old));};
 const result=await publish({...config,fetchImpl:fake});
 assert.equal(result.commit,'b'.repeat(40));assert.equal(calls.length,2);
 assert.equal(calls[0].url,'https://api.github.com/repos/Wang060919/My-Blog/contents/data/github_contributions.json?ref=main');
 const body=JSON.parse(calls[1].body);assert.equal(body.branch,'main');assert.equal(body.sha,'a'.repeat(40));assert.deepEqual(JSON.parse(Buffer.from(body.content,'base64').toString()),real);assert.equal(calls[1].redirect,'error');
 for(const change of [{event:'pull_request'},{event:'push'},{ref:'refs/heads/feature'},{repository:'other/repo'},{token:''},{now:config.now+49*3600000},{now:config.now-3600000}]){calls=[];await assert.rejects(publish({...config,...change,fetchImpl:fake}));assert.equal(calls.length,0);}
 calls=[];assert.deepEqual(await publish({...config,fetchImpl:async()=>{calls.push(1);return response(file(real));}}),{changed:false});assert.equal(calls.length,1);
 for(const bad of [{...real,example:true,source:'example'},{status:'unavailable',username:'Wang060919'}]){fs.writeFileSync(input,JSON.stringify(bad));await assert.rejects(publish({...config,fetchImpl:fake}));}
 fs.writeFileSync(input,JSON.stringify(real));
 for(const current of [{...real,fetchedAt:'2026-10-19T18:00:00Z'},{...file(old),encoding:'utf8'}])await assert.rejects(publish({...config,fetchImpl:async()=>response(current.encoding?current:file(current))}));
 calls=[];await assert.rejects(publish({...config,fetchImpl:async(url,request)=>{calls.push(1);return request.method==='PUT'?{ok:false,status:409}:response(file(old));}}));assert.equal(calls.length,2);
 fs.rmSync(directory,{recursive:true,force:true});
 console.log('Contribution publication tests passed: fixed repo/path/branch, event guards, freshness, real-only, unchanged no-op, optimistic conflict and no retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});
const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/contribution-refresh.yml'),'utf8');
assert.match(workflow,/cron: '0 16 \* \* \*'/);
assert.equal((workflow.match(/contents: write/g)||[]).length,1);
assert.ok(workflow.indexOf('contents: write')>workflow.indexOf('  publish:'));
assert.match(workflow,/needs: refresh/);
assert.ok(!/pull_request:|push:|secrets\./.test(workflow));
assert.equal((workflow.match(/persist-credentials: false/g)||[]).length,2);
