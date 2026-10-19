// Native cross-document transitions: no intercepted links, fetch router or history writes.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const project = path => path.match(/^\/projects\/(vanishtrans|esp32-lab|ai-chat)\/?$/)?.[1];
  const listing = path => path === '/' || /^\/projects\/?$/.test(path);
  let clicked;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-project-link]');
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && link && !link.download && (!link.target || link.target === '_self')) clicked = link;
  });
  const clear = () => {
    document.querySelectorAll('[data-vt-active]').forEach(el => { el.style.removeProperty('view-transition-name');el.style.removeProperty('view-transition-group');el.removeAttribute('data-vt-active'); });
    delete document.documentElement.dataset.projectTransition;
  };
  const name=(element,value)=>{if(element){element.style.viewTransitionName=value;element.setAttribute('data-vt-active','');}};
  const visible = el => { const box = el.getBoundingClientRect(); return box.width && box.height && box.bottom > 80 && box.top < innerHeight; };
  const restoreTab=key=>{
    document.querySelectorAll('.project-tabs [role="tab"]').forEach(tab=>{
      const selected=tab.id===`tab-${key}`,panel=document.getElementById(tab.getAttribute('aria-controls'));
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;panel.hidden=!selected;panel.inert=!selected;
    });
    document.dispatchEvent(new CustomEvent('project-tab-restore',{detail:key}));
  };
  const remember=activation=>{
    try{
      const key=project(new URL(activation.entry.url).pathname);
      if(!key || !listing(location.pathname) || !activation.from?.key)return;
      const surface=clicked?.dataset.projectLink===key ? (clicked.matches('[data-project-surface]')?clicked:clicked.closest('.showcase-panel')?.querySelector('[data-project-surface]')) : null;
      if(surface)sessionStorage.setItem(`wang-project-origin:${activation.from.key}`,JSON.stringify({key,kind:surface.matches('.project-card')?'card':'showcase',x:scrollX,y:scrollY}));
    }catch(_){}
  };
  const restoreState=activation=>{
    try{
      if(!listing(location.pathname) || activation?.navigationType!=='traverse')return;
      const key=project(new URL(activation.from.url).pathname),origin=JSON.parse(sessionStorage.getItem(`wang-project-origin:${activation.entry.key}`));
      if(key && origin?.key===key && origin.kind==='showcase')restoreTab(key);
    }catch(_){}
  };
  const prepare = (from, to, entering, activation) => {
    clear();
    const key = project(to.pathname) || project(from.pathname);
    if (!key || !(listing(from.pathname) || listing(to.pathname))) return;
    let surface;
    let restoreOrigin;
    if(entering && listing(to.pathname) && activation?.navigationType==='traverse'){
      try{restoreOrigin=JSON.parse(sessionStorage.getItem(`wang-project-origin:${activation.entry.key}`));}catch(_){}
      if(restoreOrigin?.key!==key)restoreOrigin=null;
      if(!restoreOrigin)return false;
    }
    if (project(location.pathname)) surface = document.querySelector(`[data-project-surface="${key}"]`);
    else {
      if(restoreOrigin){
        if(restoreOrigin.kind==='showcase'){
          restoreTab(key);
          surface=document.querySelector(`#panel-${key} [data-project-surface]`);
        }else surface=document.querySelector(`.project-card[data-project-surface="${key}"]`);
        // Chromium may restore a traversed document only after its transition.
        // Align this one known snapshot now; retain native automatic history restoration.
        if(Number.isFinite(restoreOrigin.y))scrollTo({top:restoreOrigin.y,left:restoreOrigin.x||0,behavior:'instant'});
        document.dispatchEvent(new Event('hero-scroll-sync'));
      }
      if (!entering && clicked?.dataset.projectLink === key) surface = clicked.matches('[data-project-surface]') ? clicked : clicked.closest('.showcase-panel')?.querySelector('[data-project-surface]');
      surface ||= Array.from(document.querySelectorAll(`[data-project-surface="${key}"]`)).find(visible);
    }
    // Offscreen surfaces never fly across the page; use the short ordinary transition.
    if (surface && (restoreOrigin || visible(surface))) {
      name(surface,'project-surface');
      const art=surface.querySelector('.app-preview,.hardware-preview,.terminal-preview');
      // Older implementations retain the clipped whole-surface transition.
      if(art && CSS.supports('view-transition-group:nearest')){name(art,'project-art');art.style.viewTransitionGroup='nearest';}
      const title=surface.matches('.project-card') ? surface.querySelector('h3') : document.querySelector('.project-heading h1');
      // The showcase caption is deliberately not stretched into the page heading.
      if(title && (restoreOrigin || visible(title)))name(title,'project-title');
      document.documentElement.dataset.projectTransition=project(location.pathname)?'expand':'contract';
    }
  };
  addEventListener('pageswap', event => {
    event.viewTransition?.ready.catch(()=>{});
    if(event.activation)remember(event.activation);
    if (!event.viewTransition) return;
    if (reduced.matches) { event.viewTransition.skipTransition(); return; }
    try { prepare(new URL(location.href), new URL(event.activation.entry.url), false,event.activation); }
    catch (_) { clear(); }
    event.viewTransition.finished.then(clear, clear);
  });
  addEventListener('pagereveal', event => {
    event.viewTransition?.ready.catch(()=>{});
    const activation = window.navigation?.activation;
    restoreState(activation);
    if (!event.viewTransition) { clear(); return; }
    if (reduced.matches) { event.viewTransition.skipTransition(); clear(); return; }
    try { if (activation?.from && prepare(new URL(activation.from.url), new URL(location.href), true,activation)===false){event.viewTransition.skipTransition();clear();return;} }
    catch (_) { clear(); }
    event.viewTransition.ready.then(()=>{
      if(reduced.matches){event.viewTransition.skipTransition();clear();return;}
      const direction=document.documentElement.dataset.projectTransition;
      if(direction && document.documentElement.animate){
        document.documentElement.animate([{borderRadius:direction==='expand'?'6px':'10px'},{borderRadius:direction==='expand'?'10px':'6px'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)',pseudoElement:'::view-transition-group(project-surface)'});
        if(direction==='expand')document.querySelectorAll('.project-facts,.project-prose > :first-child').forEach((el,index)=>{
          const box=el.getBoundingClientRect();
          if(box.top<innerHeight)el.animate([{opacity:.78,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,delay:100+index*50,easing:'cubic-bezier(.22,1,.36,1)'});
        });
      }
      clear();
    },clear);
  });
  addEventListener('pageshow', event => { if (!document.activeViewTransition){restoreState(window.navigation?.activation);if(event.persisted)clear();} });
})();
