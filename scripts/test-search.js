// Dependency-free event-logic regression. This is not a browser/layout test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const file = fs.readFileSync(path.join(repo, 'assets/js/site.js'), 'utf8');
const start = file.indexOf('  let indexPromise;');
const end = file.indexOf('  const dialog =', start);
assert.ok(start > 0 && end > start, 'Search module boundaries changed; update test harness');
const source = file.slice(start, end);
const index = [
  { title:'Hugo A', summary:'Hugo article', content:'Hugo', tags:[], type:'blog', permalink:'/blog/hugo-a/' },
  { title:'Hugo B', summary:'Hugo article', content:'Hugo', tags:[], type:'blog', permalink:'/blog/hugo-b/' },
  { title:'Docker C', summary:'Docker article', content:'Docker', tags:[], type:'blog', permalink:'/blog/docker-c/' },
];
const flush = async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
function fixture({deferred=false, fail=false}={}) {
  const clicked=[], timers=new Map(); let counter=0,resolveFetch;
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attributes=new Map();this.dataset={};this.value='';this._text='';this.hidden=false;}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(x=>x.textContent ?? String(x)).join('');}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this._text='';this.children=[...children];}
    addEventListener(type,handler){(this.listeners[type] ||= []).push(handler);}
    emit(type,props={}){const event={type,preventDefault(){this.defaultPrevented=true;},...props};for(const callback of this.listeners[type]||[])callback(event);return event;}
    setAttribute(key,value){this.attributes.set(key,String(value));}
    getAttribute(key){return this.attributes.get(key)??null;}
    toggleAttribute(key,force){if(force ?? !this.attributes.has(key))this.attributes.set(key,'');else this.attributes.delete(key);}
    querySelectorAll(tag){return this.children.flatMap(child=>child instanceof Element?[...(child.tag===tag?[child]:[]),...child.querySelectorAll(tag)]:[]);}
    querySelector(tag){return this.querySelectorAll(tag)[0]||null;}
    click(){clicked.push(this.href);}
    scrollIntoView(){}
    focus(){this.focused=true;}
  }
  const widget=new Element('div'),form=new Element('form'),input=new Element('input'),results=new Element('div'),status=new Element('p'),retry=new Element('button');
  widget.dataset.index='/search-index.json';widget.closest=selector=>selector==='.search-page'?widget:null;
  widget.querySelector=selector=>({form,input,'.search-results':results,'.search-status':status,'.search-retry':retry})[selector];
  const document={querySelectorAll:selector=>selector==='.search-widget'?[widget]:[],createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
  const response=()=>fail?Promise.reject(new Error('network')):Promise.resolve({ok:true,json:()=>Promise.resolve(index)});
  const context={document,URLSearchParams,location:{search:''},fetch:()=>deferred?new Promise(resolve=>{resolveFetch=()=>resolve({ok:true,json:()=>Promise.resolve(index)});}):response(),setTimeout:callback=>{timers.set(++counter,callback);return counter;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(source,context,{filename:'assets/js/site.js:search'});
  return {widget,form,input,results,status,retry,clicked, resolve:()=>resolveFetch(), tick:async()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(callback=>callback());await flush();},links:()=>results.querySelectorAll('a'),selected:()=>results.querySelectorAll('a').find(link=>link.attributes.has('data-selected'))};
}
const tests=[];
async function test(name,body){try{await body();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:error.message});}}
(async()=>{
  await test('Initial results include all three fixture entries',async()=>{const f=fixture();await flush();assert.equal(f.links().length,3);});
  await test('Initial ArrowDown selects first result',async()=>{const f=fixture();await flush();f.input.emit('keydown',{key:'ArrowDown'});assert.equal(f.selected().href,'/blog/hugo-a/');});
  await test('Initial ArrowUp selects final result',async()=>{const f=fixture();await flush();f.input.emit('keydown',{key:'ArrowUp'});assert.equal(f.selected().href,'/blog/docker-c/');});
  await test('Arrow keys wrap around both ends',async()=>{const f=fixture();await flush();f.input.emit('keydown',{key:'ArrowDown'});f.input.emit('keydown',{key:'ArrowUp'});assert.equal(f.selected().href,'/blog/docker-c/');f.input.emit('keydown',{key:'ArrowDown'});assert.equal(f.selected().href,'/blog/hugo-a/');});
  await test('Enter opens current explicitly selected result',async()=>{const f=fixture();await flush();f.input.emit('keydown',{key:'ArrowDown'});f.form.emit('submit');assert.deepEqual(f.clicked,['/blog/hugo-a/']);});
  await test('Editing then immediately submitting does not open stale selection',async()=>{const f=fixture();await flush();f.input.emit('keydown',{key:'ArrowDown'});f.input.value='Docker';f.input.emit('input');f.form.emit('submit');assert.deepEqual(f.clicked,[]);await flush();assert.equal(f.links()[0].href,'/blog/docker-c/');});
  await test('Older pending response cannot paint after query changes during debounce',async()=>{const f=fixture({deferred:true});f.input.value='Docker';f.input.emit('input');f.resolve();await flush();assert.equal(f.links().length,0,'Old render must not show Hugo results for the new Docker query');await f.tick();assert.equal(f.links().length,1);assert.equal(f.links()[0].href,'/blog/docker-c/');});
  await test('Debounced query produces only matching results',async()=>{const f=fixture();await flush();f.input.value='Docker';f.input.emit('input');await f.tick();assert.equal(f.links().length,1);assert.equal(f.links()[0].href,'/blog/docker-c/');});
  await test('Immediate submit cancels debounce so a new selection stays selected',async()=>{const f=fixture();await flush();f.input.value='Docker';f.input.emit('input');f.form.emit('submit');await flush();f.input.emit('keydown',{key:'ArrowDown'});assert.equal(f.selected().href,'/blog/docker-c/');await f.tick();assert.equal(f.selected()?.href,'/blog/docker-c/');});
  await test('Reset restores initial results and focus',async()=>{const f=fixture();await flush();f.input.value='Docker';f.input.emit('input');await f.tick();f.form.emit('reset');await f.tick();assert.equal(f.input.value,'');assert.equal(f.links().length,3);assert.ok(f.input.focused);});
  await test('Failure provides retry and real navigation fallback',async()=>{const f=fixture({fail:true});await flush();assert.equal(f.retry.hidden,false);assert.deepEqual(f.links().map(link=>link.href),['/blog/','/projects/']);});
  const output={mode:'Node vm running exact production search event block with deterministic DOM/fetch/timer test doubles; not browser validation',tests,passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length};
  console.log(JSON.stringify(output,null,2));process.exitCode=output.failed?1:0;
})().catch(error=>{console.error(error);process.exitCode=1;});
