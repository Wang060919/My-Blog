const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../data/github_contributions.json');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/contributions.js'),'utf8').replace(/^import .*\n/,'').replace('export function','function');
function setup(empty=false){
 let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});let document;
 class Node {
  constructor(tag='div',cls=''){this.tagName=tag;this.className=cls;this.dataset={};this.children=[];this.listeners={};this.tabIndex=-1;this.textContent='';this.value='';this.hidden=false;this.scrollWidth=1000;this.scrollLeft=100;}
  append(...nodes){this.children.push(...nodes.flatMap(n=>n.tagName==='fragment'?n.children:[n]));}
  replaceChildren(...nodes){if(this.querySelectorAll('.contribution-day').includes(document.activeElement))document.activeElement=null;this.children=[];this.append(...nodes);}
  addEventListener(type,fn,options){(this.listeners[type]??=[]).push({fn,once:options?.once});}
  emit(type,event={}){const list=[...(this.listeners[type]||[])];for(const x of list){if(x.once)this.listeners[type]=this.listeners[type].filter(y=>y!==x);x.fn(event);}}
  setAttribute(key,value){if(key.startsWith('data-'))this.dataset[key.slice(5)]=value;}
  removeAttribute(key){delete this.dataset[key.slice(5)];}
  toggleAttribute(key,on){if(on)this.setAttribute(key,'');else this.removeAttribute(key);}
  hasAttribute(key){return key.slice(5) in this.dataset;}
  matches(selector){return selector==='.'+this.className;}
  querySelectorAll(selector){return this.children.flatMap(n=>[...(n.matches(selector)?[n]:[]),...n.querySelectorAll(selector)]);}
  focus(){document.activeElement=this;this.emit('focus');}
  scrollIntoView(){} remove(){this.removed=true;}
 }
 const section=new Node(),scroll=new Node(),calendar=new Node('div','contribution-calendar'),detail=new Node(),input=new Node('input'),snapshot=new Node(),time=new Node('time'),notice=new Node(),fallback=new Node();
 section.dataset.contributionsEndpoint='https://cache.example/api/contributions';snapshot.dataset.snapshotTime=empty?'':data.fetchedAt;snapshot.hidden=empty;detail.textContent=data.from+' — '+data.to;
 if(!empty)for(const day of data.weeks.flatMap(w=>w.days).filter(Boolean)){const node=new Node('button','contribution-day');node.dataset={date:day.date,count:String(day.count),level:String(day.level)};node.tabIndex=day.date===data.to?0:-1;calendar.append(node);}
 scroll.append(calendar);section.append(scroll);snapshot.querySelector=()=>time;
 const map={'[data-calendar-scroll]':scroll,'#contribution-detail':detail,'[data-calendar-date]':input,'[data-snapshot-time]':snapshot,'[data-stale-notice]':notice,'.contribution-calendar':calendar,'[data-contribution-total]':new Node(),'[data-contribution-active]':new Node(),'[data-contribution-empty]':fallback};section.querySelector=s=>map[s];
 document={activeElement:null,querySelector:()=>section,createElement:tag=>new Node(tag),createDocumentFragment:()=>new Node('fragment')};
 vm.runInNewContext(source+'\ninitContributions({matches:true,addEventListener(){}});',{document,fetchLiveSnapshot:()=>promise,Date,Array,Number,String,Set,window:{}});
 return{resolve,reject,document,section,calendar,input,snapshot,fallback,detail};
}
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const fresh={...data,fetchedAt:new Date(Date.parse(data.fetchedAt)+1000).toISOString()};
 const f=setup();const old=f.calendar.children[20];old.focus();f.resolve(fresh);await flush();assert.equal(f.document.activeElement.dataset.date,old.dataset.date);assert.notEqual(f.document.activeElement,old);assert.equal(f.input.value,old.dataset.date);assert.equal(f.calendar.querySelectorAll('.contribution-day').filter(x=>x.tabIndex===0).length,1);
 const editing=setup();editing.document.activeElement=editing.input;editing.input.value='2026-02-01';editing.section.emit('keydown');editing.resolve(fresh);await flush();assert.equal(editing.input.value,'2026-02-01');assert.equal(editing.snapshot.dataset.snapshotTime,data.fetchedAt);editing.document.activeElement=null;editing.input.emit('blur');assert.equal(editing.input.value,'2026-02-01');assert.equal(editing.snapshot.dataset.snapshotTime,fresh.fetchedAt);
 const empty=setup(true);empty.resolve(fresh);await flush();assert.equal(empty.snapshot.hidden,false);assert.equal(empty.fallback.removed,true);assert.equal(empty.calendar.querySelectorAll('.contribution-day').length,365);
 const failure=setup();failure.reject(Error('offline'));await flush();assert.equal(failure.snapshot.dataset.snapshotTime,data.fetchedAt);assert.equal(failure.calendar.children.length,365);
 console.log('Contribution async UI tests passed: keyboard focus survives refresh, date editing defers replacement, empty state upgrades, and failures preserve static data.');
})().catch(error=>{console.error(error);process.exitCode=1;});
