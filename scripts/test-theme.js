// Source/bootstrap checks with deterministic browser API doubles, not visual tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const head = read('layouts/_partials/head/script-header-priority.html');
const bootstrap = head.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(bootstrap, 'Missing first-paint theme script');
const site = read('assets/js/site.js');
const start = site.indexOf('  const reduced =');
const end = site.indexOf('  const navigation=', start);
assert.ok(start > 0 && end > start, 'Startup boundaries changed; update the test fixture');
const tests = [];
function test(name, run) {
  try { run(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
}
for (const scenario of [
  { name:'Saved dark preference', saved:'dark', systemDark:false },
  { name:'Saved light preference with system dark', saved:'light', systemDark:true },
  { name:'No saved preference with system dark', saved:null, systemDark:true },
  { name:'Invalid saved preference with system dark', saved:'invalid', systemDark:true },
  { name:'Blocked storage with system dark', blocked:true, systemDark:true },
  { name:'No storage object with system dark', absent:true, systemDark:true },
]) {
  test(`${scenario.name} stays light from head through startup and system changes`, () => {
    let reads=0, writes=0, colorQueries=0;
    const assignments=[], listeners=[];
    const dataset = new Proxy({ bsTheme:'light' }, {set(object,key,value){if(key==='bsTheme')assignments.push(value);object[key]=value;return true;}});
    const context = {
      document:{documentElement:{dataset},querySelector:()=>null,dispatchEvent(){}},
      matchMedia(query){if(query.includes('prefers-color-scheme'))colorQueries++;return{matches:query.includes('prefers-color-scheme')&&scenario.systemDark,addEventListener(type,callback){if(query.includes('prefers-color-scheme'))listeners.push(callback);}};},
      initHomeReveal(){},initHeroScroll(){},initDisclosures(){},initAssembly(){return{};},Event:class{},
    };
    if(!scenario.absent)context.localStorage={getItem(){reads++;if(scenario.blocked)throw new Error('Storage blocked');return scenario.saved;},setItem(){writes++;},removeItem(){writes++;},clear(){writes++;}};
    vm.runInNewContext(bootstrap,context);
    assert.equal(dataset.bsTheme,'light');
    vm.runInNewContext(site.slice(start,end),context);
    listeners.forEach(callback=>callback({matches:true}));
    listeners.forEach(callback=>callback({matches:false}));
    assert.equal(dataset.bsTheme,'light');
    assert.ok(assignments.every(value=>value==='light'),'First paint/runtime must never assign dark');
    assert.equal(reads,0,'Ignore saved preferences without reading storage');
    assert.equal(writes,0,'Do not erase or rewrite stored preferences');
    assert.equal(colorQueries,0,'Do not subscribe to system theme changes');
  });
}
test('No-JavaScript HTML starts light',()=>assert.match(read('layouts/baseof.html'),/data-bs-theme="light"/));
test('Shared desktop/mobile header has no theme toggle',()=>assert.doesNotMatch(read('layouts/_partials/site/header.html'),/theme-toggle|data-bs-theme-value/));
test('Fallback Doks header configuration is light-only',()=>{const config=read('config/_default/params.toml');assert.match(config,/colorMode\s*=\s*"light"/);assert.match(config,/colorModeToggler\s*=\s*false/);});
test('Dark source styles remain available',()=>assert.match(read('assets/scss/common/_personal-site.scss'),/:root\[data-bs-theme="dark"\]/));
console.log(JSON.stringify({mode:'Node source/bootstrap tests with API doubles; not browser rendering validation',tests,passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length},null,2));
process.exitCode=tests.some(test=>!test.passed)?1:0;
