import { initWaves } from './waves.js';
import { initAssembly } from './assembly.js';
import { initDisclosures } from './disclosures.js';
import { initHeroScroll } from './hero-scroll.js';
import { initHomeReveal } from './home-reveal.js';
// Native, progressively enhanced navigation, local search and restrained motion.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  initHomeReveal(reduced);
  initHeroScroll(reduced);
  const assembly = initAssembly(reduced);
  initDisclosures(reduced);
  // Light-only UI: ignore saved/system dark preferences without changing storage.
  document.documentElement.dataset.bsTheme = 'light';

  const navigation=document.querySelector('.desktop-nav');
  if(navigation){
    const current=navigation.querySelector('[aria-current]');
    let indicated=current;
    const indicate=link=>{
      indicated=link;
      navigation.dataset.enhanced='true';navigation.style.setProperty('--nav-opacity',link?'1':'0');
      if(!link)return;
      const area=navigation.getBoundingClientRect(),rect=link.getBoundingClientRect();
      navigation.style.setProperty('--nav-left',`${rect.left-area.left+4}px`);navigation.style.setProperty('--nav-width',`${rect.width-8}px`);
    };
    navigation.querySelectorAll('a').forEach(link=>{
      link.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')indicate(link);});
      link.addEventListener('focus',()=>indicate(link));
    });
    navigation.addEventListener('pointerleave',()=>indicate(current));
    navigation.addEventListener('focusout',event=>{if(!navigation.contains(event.relatedTarget))indicate(current);});
    if('ResizeObserver' in window)new ResizeObserver(()=>indicate(indicated)).observe(navigation);
    document.fonts?.ready.then(()=>indicate(indicated));indicate(current);
  }


  const sentinel=document.querySelector('.header-sentinel');
  if(sentinel && 'IntersectionObserver' in window) new IntersectionObserver(entries=>{
    document.body.dataset.scrolled=String(!entries[0].isIntersecting);
  }).observe(sentinel);

  const menu=document.querySelector('.mobile-nav');
  const menuSummary=menu?.querySelector('summary');
  const menuNav=menu?.querySelector('nav');
  let menuSequence=0, menuAnimation;
  const closeMenu=(restore=false,immediate=false)=>{
    if(!menu?.open)return;
    const sequence=++menuSequence;menuAnimation?.cancel();
    menuSummary.setAttribute('aria-expanded','false');
    menuSummary.setAttribute('aria-label','打开导航菜单');
    menu.dataset.closing='true';menuNav.inert=true;
    if(restore)menuSummary.focus();
    const finish=()=>{if(sequence===menuSequence){menu.open=false;delete menu.dataset.closing;menuNav.inert=false;}};
    if(reduced.matches || immediate || !menuNav.animate){finish();return;}
    menuAnimation=menuNav.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],{duration:120,easing:'ease-out'});
    menuAnimation.finished.then(finish,()=>{});
  };
  menuSummary?.setAttribute('aria-expanded','false');
  menuSummary?.addEventListener('click',event=>{
    event.preventDefault();
    if(menu.open && !menu.dataset.closing){closeMenu(true);return;}
    ++menuSequence;menuAnimation?.cancel();delete menu.dataset.closing;
    menu.open=true;menuNav.inert=false;
    menuSummary.setAttribute('aria-expanded','true');
    menuSummary.setAttribute('aria-label','关闭导航菜单');
    if(!reduced.matches && menuNav.animate)menuAnimation=menuNav.animate([{opacity:0,transform:'translateY(-9px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu?.open){closeMenu(true);event.preventDefault();}});
  menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeMenu(false,true)));
  document.addEventListener('click',event=>{if(menu?.open && !menu.contains(event.target))closeMenu();});
  matchMedia('(min-width: 768px)').addEventListener('change',event=>{if(event.matches)closeMenu(false,true);});
  reduced.addEventListener('change',()=>{if(reduced.matches){if(menu?.dataset.closing)closeMenu(false,true);else menuAnimation?.cancel();}});

  const tabBar=document.querySelector('.project-tabs');
  const tabs=Array.from(tabBar?.querySelectorAll('[role="tab"]') || []);
  let activeTab=tabs.find(tab=>tab.getAttribute('aria-selected')==='true');
  let panelSequence=0;const panelAnimations=new Set();
  const moveIndicator=()=>{
    if(!activeTab)return;
    const bar=tabBar.getBoundingClientRect(),tab=activeTab.getBoundingClientRect();
    tabBar.style.setProperty('--tab-left',`${tab.left-bar.left}px`);
    tabBar.style.setProperty('--tab-width',`${tab.width}px`);
    tabBar.dataset.enhanced='true';
  };
  const selectTab=(tab,focus=false,immediate=false)=>{
    if(activeTab===tab){if(focus)tab.focus();return;}
    const sequence=++panelSequence;
    panelAnimations.forEach(animation=>animation.cancel());panelAnimations.clear();
    const previous=activeTab && document.getElementById(activeTab.getAttribute('aria-controls'));
    if(previous)assembly.stop(previous);
    activeTab=tab;
    const next=document.getElementById(tab.getAttribute('aria-controls'));
    tabs.forEach(item=>{
      const selected=item===tab,panel=document.getElementById(item.getAttribute('aria-controls'));
      item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;
      panel.hidden=!selected;panel.inert=!selected;panel.removeAttribute('aria-hidden');delete panel.dataset.switching;
    });
    moveIndicator();if(focus)tab.focus();
    if(immediate)return;
    assembly.run(next, true);
    if(reduced.matches || !next.animate)return;
    next.dataset.switching='true';
    const incoming=next.animate([{opacity:0,transform:'translateY(10px) scale(.994)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
    panelAnimations.add(incoming);
    incoming.finished.then(()=>{if(sequence===panelSequence)delete next.dataset.switching;},()=>{}).finally(()=>panelAnimations.delete(incoming));
    if(previous){
      previous.hidden=false;previous.inert=true;previous.setAttribute('aria-hidden','true');
      const outgoing=previous.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:200,easing:'ease-out'});
      panelAnimations.add(outgoing);
      outgoing.finished.then(()=>{if(sequence===panelSequence){previous.hidden=true;previous.removeAttribute('aria-hidden');}},()=>{}).finally(()=>panelAnimations.delete(outgoing));
    }
  };
  document.addEventListener('project-tab-restore',event=>{
    const tab=tabs.find(item=>item.id===`tab-${event.detail}`);if(tab)selectTab(tab,false,true);
  });
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(tab));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=tabs.length-1;
      if(next!==undefined){event.preventDefault();selectTab(tabs[next],true);}
    });
  });
  if(tabBar){
    moveIndicator();
    if('ResizeObserver' in window)new ResizeObserver(moveIndicator).observe(tabBar);
    else addEventListener('resize',moveIndicator,{passive:true});
    document.fonts?.ready.then(moveIndicator);
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){
    ++panelSequence;panelAnimations.forEach(animation=>animation.cancel());panelAnimations.clear();
    tabs.forEach(tab=>{const panel=document.getElementById(tab.getAttribute('aria-controls'));panel.hidden=tab!==activeTab;panel.inert=tab!==activeTab;panel.removeAttribute('aria-hidden');delete panel.dataset.switching;});
  }});

  document.querySelectorAll('[data-filter-for]').forEach(bar => {
    const list = document.getElementById(bar.dataset.filterFor);
    if (!list) return;
    const entries = Array.from(list.querySelectorAll('[data-category]'));
    const buttons = Array.from(bar.querySelectorAll('[data-filter]'));
    const empty = document.createElement('p'); empty.className = 'filter-empty'; empty.hidden = true; empty.setAttribute('role','status');
    empty.append('这个分类还没有公开内容。');
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'text-link'; reset.textContent = '查看全部'; empty.append(reset); list.after(empty);
    const filter = (value, updateURL = true) => {
      if (!buttons.some(b => b.dataset.filter === value)) value = 'all';
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
      let count = 0;
      entries.forEach(entry => { entry.hidden = value !== 'all' && entry.dataset.category !== value; if (!entry.hidden) count++; });
      list.dataset.filtered = String(value !== 'all');
      empty.hidden = count !== 0;
      if (updateURL) { const url = new URL(location.href); if (value === 'all') url.searchParams.delete('category'); else url.searchParams.set('category',value); history.replaceState(null,'',url); }
    };
    buttons.forEach(b => b.addEventListener('click', () => filter(b.dataset.filter)));
    reset.addEventListener('click', () => filter('all'));
    filter(new URLSearchParams(location.search).get('category') || 'all', false);
    addEventListener('popstate', () => filter(new URLSearchParams(location.search).get('category') || 'all', false));
  });

  let indexPromise;
  const loadIndex = url => indexPromise ||= fetch(url).then(r => { if (!r.ok) throw new Error('index'); return r.json(); }).catch(e => { indexPromise = null; throw e; });
  const normalize = value => value.toLocaleLowerCase().replace(/\s+/g,' ').trim();
  const addHighlighted = (element, value, query) => {
    const text = String(value || ''); const at = normalize(text).indexOf(normalize(query));
    if (!query || at < 0) { element.textContent = text; return; }
    element.append(document.createTextNode(text.slice(0,at)));
    const mark = document.createElement('mark'); mark.textContent = text.slice(at,at+query.length); element.append(mark,document.createTextNode(text.slice(at+query.length)));
  };
  document.querySelectorAll('.search-widget').forEach(widget => {
    const form = widget.querySelector('form'), input = widget.querySelector('input'), results = widget.querySelector('.search-results'), status = widget.querySelector('.search-status'), retry = widget.querySelector('.search-retry');
    let selected = -1, generation = 0, timer;
    const render = async () => {
      clearTimeout(timer);
      const run = ++generation; const query = input.value.trim();
      results.replaceChildren(); selected = -1; retry.hidden = true; status.textContent = '正在加载搜索…';
      try {
        const index = await loadIndex(widget.dataset.index);
        if (run !== generation) return;
        const words = normalize(query).split(' ').filter(Boolean);
        const matches = index.filter(item => words.every(w => normalize([item.title,item.summary,item.content,...item.tags].join(' ')).includes(w)))
          .map(item => ({...item, score: words.reduce((n,w) => n+(normalize(item.title).includes(w)?4:0)+(normalize(item.summary).includes(w)?1:0),0)}))
          .sort((a,b) => b.score-a.score).slice(0,24);
        status.textContent = query ? matches.length ? `找到 ${matches.length} 条相关内容` : '没有找到相关内容。试试其他关键词，或清空搜索。' : '从这些公开记录开始，或输入关键词。';
        const labels = {blog:'文章',projects:'作品',docs:'文档'};
        for (const type of ['blog','projects','docs']) {
          const group = matches.filter(item => item.type === type).slice(0,query ? 12 : 3);
          if (!group.length) continue;
          const heading = document.createElement('h3'); heading.textContent = labels[type]; results.append(heading);
          group.forEach(item => {
            const link = document.createElement('a'); link.href = item.permalink;
            const title = document.createElement('span'); addHighlighted(title,item.title,query);
            const desc = document.createElement('p'); addHighlighted(desc,item.summary.slice(0,95),query); link.append(title,desc); results.append(link);
          });
        }
      } catch (_) {
        if (run !== generation) return;
        status.textContent = '搜索暂时无法加载。可以重试，或先浏览文章与作品。'; retry.hidden = false;
        const links = document.createElement('div'); links.className = 'search-error-links';
        for (const [title,url] of [['全部文章','/blog/'],['作品','/projects/']]) { const a = document.createElement('a'); a.href = url; a.textContent = title+' ↗'; links.append(a); }
        results.append(links);
      }
    };
    input.addEventListener('input', () => {
      // Invalidate old requests and keyboard choices before the debounce expires.
      ++generation; selected = -1; results.replaceChildren(); retry.hidden = true;
      status.textContent = '正在搜索…';
      clearTimeout(timer); timer = setTimeout(render,110);
    });
    form.addEventListener('reset', () => { clearTimeout(timer); setTimeout(() => { input.value = ''; render(); input.focus(); },0); });
    form.addEventListener('submit', e => { e.preventDefault(); const links = results.querySelectorAll('a'); if (selected >= 0 && links[selected]) links[selected].click(); else if (input.value.trim()) render(); });
    input.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const links = Array.from(results.querySelectorAll('a')); if (!links.length) return;
      e.preventDefault();
      selected = selected < 0 ? (e.key === 'ArrowDown' ? 0 : links.length - 1)
        : (selected + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((link,i) => { link.toggleAttribute('data-selected',i === selected); });
      links[selected].scrollIntoView({block:'nearest'}); status.textContent = `已选择：${links[selected].querySelector('span')?.textContent || links[selected].textContent}`;
    });
    retry.addEventListener('click', render);
    widget.addEventListener('search-open', render);
    if (widget.closest('.search-page')) { input.value = new URLSearchParams(location.search).get('q') || ''; render(); }
  });

  const dialog = document.getElementById('site-search'); let searchTrigger;
  const openSearch = trigger => { if (!dialog?.showModal) { location.href='/search/'; return; } closeMenu(); searchTrigger=trigger; if (!dialog.open) dialog.showModal(); dialog.querySelector('input').focus(); dialog.querySelector('.search-widget').dispatchEvent(new Event('search-open')); };
  const closeSearch = () => { dialog.close(); searchTrigger?.focus(); };
  document.querySelectorAll('[data-open-search]').forEach(link => link.addEventListener('click', e => { e.preventDefault(); openSearch(link); }));
  dialog?.querySelector('[data-close-search]').addEventListener('click', closeSearch);
  dialog?.addEventListener('cancel', e => { e.preventDefault(); closeSearch(); });
  dialog?.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) closeSearch(); } });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !e.target.closest('input,textarea,[contenteditable="true"]')) { e.preventDefault(); openSearch(document.activeElement); } });

  const reveals = document.querySelectorAll('[data-reveal]:not([data-home-reveal])');
  let revealObserver;
  if ('IntersectionObserver' in window && !reduced.matches) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.dataset.reveal='visible'; revealObserver.unobserve(entry.target); } }),{threshold:.06});
    reveals.forEach(el => { if (el.getBoundingClientRect().top > innerHeight-30) el.dataset.reveal='pending'; revealObserver.observe(el); });
  }
  const hero=document.querySelector('.home-intro'); let inView=true;
  const waves=initWaves(document.querySelector('.wave-scene'),reduced);
  const updateWave=()=>{ const running=!reduced.matches && inView && !document.hidden; if(hero)hero.dataset.motion=running?'running':'paused';waves.setRunning(running); };
  if(hero && 'IntersectionObserver' in window) new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;updateWave();}).observe(hero);
  document.addEventListener('visibilitychange',updateWave);
  reduced.addEventListener('change',()=>{if(reduced.matches){revealObserver?.disconnect();reveals.forEach(el=>el.dataset.reveal='visible');}updateWave();}); updateWave();

  const tocLinks=Array.from(document.querySelectorAll('.desktop-toc a'));
  if(tocLinks.length && 'IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){tocLinks.forEach(a=>{if(a.hash===`#${encodeURIComponent(entry.target.id)}` || decodeURIComponent(a.hash)===`#${entry.target.id}`) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');});}});},{rootMargin:'-90px 0px -65% 0px'});
    document.querySelectorAll('.prose h2[id],.prose h3[id]').forEach(h=>observer.observe(h));
  }
})();
