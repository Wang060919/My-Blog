const assert = require('node:assert/strict'), fs = require('node:fs');
const { normalizeCalendar, validateSnapshot, LEVELS, DAY } = require('./lib/contributions');
const fixture = require('../tests/fixtures/contributions-example.json');
assert.deepEqual(validateSnapshot(fixture), fixture);
const meta = { username:'Wang060919', fetchedAt:'2026-10-19T17:00:00Z', from:'2025-10-20', to:'2026-10-19' };
const raw = () => ({ totalContributions:fixture.total, weeks:fixture.weeks.map(w => ({ contributionDays:w.days.filter(Boolean).map(d => ({ date:d.date, contributionCount:d.count, contributionLevel:d.contributionLevel })) })) });
const valid = normalizeCalendar(raw(), meta);
assert.equal(valid.example, false); assert.equal(valid.weeks.length, 53);
assert.equal(valid.weeks.flatMap(w=>w.days).filter(Boolean).length,365);
assert.equal(valid.weeks[0].days[0],null); assert.equal(valid.weeks.at(-1).days.at(-1),null);
for (const mutate of [
 c=>c.totalContributions++, c=>c.weeks[0].contributionDays.pop(),
 c=>c.weeks[0].contributionDays[0].date='2025-02-30',
 c=>c.weeks[0].contributionDays[0].date=c.weeks[0].contributionDays[1].date,
 c=>c.weeks[0].contributionDays[0].contributionCount=-1,
 c=>c.weeks[0].contributionDays[0].contributionCount=1.5,
 c=>c.weeks[0].contributionDays[0].contributionLevel='BOGUS',
 c=>c.weeks[0].contributionDays[0].contributionLevel='FIRST_QUARTILE',
]) { const calendar=raw();mutate(calendar);assert.throws(()=>normalizeCalendar(calendar,meta)); }
assert.throws(()=>normalizeCalendar(raw(),{...meta,fetchedAt:'2025-01-01T00:00:00Z'}));
const leap = Array.from({length:366},(_,i)=>({date:new Date(Date.parse('2023-03-01T00:00:00Z')+i*DAY).toISOString().slice(0,10),contributionCount:0,contributionLevel:LEVELS[0]}));
assert.equal(normalizeCalendar({totalContributions:0,weeks:[{contributionDays:leap}]},{...meta,from:'2023-03-01',to:'2024-02-29'}).activeDays,0);
const before = fs.readFileSync(require('node:path').resolve(__dirname,'../data/github_contributions.json'));
const {spawnSync}=require('node:child_process');
const result=spawnSync(process.execPath,[require('node:path').join(__dirname,'update-contributions.js')],{env:{...process.env,GITHUB_TOKEN:''},encoding:'utf8'});
assert.equal(result.status,1);assert.deepEqual(fs.readFileSync(require('node:path').resolve(__dirname,'../data/github_contributions.json')),before);
console.log('Contribution tests passed: calendar integrity, levels, totals, leap day, future/empty cells, and missing-token cache preservation.');

(async () => {
 const os=require('node:os'), path=require('node:path'), {update}=require('./update-contributions');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'contribution-test-')), output=path.join(directory,'snapshot.json');
 fs.writeFileSync(output,JSON.stringify(fixture));
 const original=fs.readFileSync(output);
 for (const fetchImpl of [async()=>{throw Error('Network failure')},async()=>({ok:false,status:403}),async()=>({ok:true,json:async()=>{throw Error('Invalid JSON')}}),async()=>({ok:true,json:async()=>({errors:[{message:'Denied'}]})}),async()=>({ok:true,json:async()=>({data:{user:{contributionsCollection:{contributionCalendar:{totalContributions:0,weeks:[]}}}}})})]) {
  await assert.rejects(update({token:'test-only',fetchImpl,output,now:new Date(meta.fetchedAt)}));
  assert.deepEqual(fs.readFileSync(output),original);
 }
 await update({token:'test-only',output,now:new Date(meta.fetchedAt),fetchImpl:async(url,request)=>{
  assert.equal(url,'https://api.github.com/graphql');assert.equal(request.redirect,'error');
  return {ok:true,json:async()=>({data:{user:{contributionsCollection:{contributionCalendar:raw()}}}})};
 }});
 assert.equal(JSON.parse(fs.readFileSync(output)).example,false);
 fs.rmSync(directory,{recursive:true,force:true});
 console.log('Contribution refresh tests passed: HTTP/network/JSON/API/validation failures preserve cache; valid data replaces atomically.');
})().catch(error=>{console.error(error);process.exitCode=1;});
