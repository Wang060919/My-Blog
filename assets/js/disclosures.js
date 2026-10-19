export function initDisclosures(reduced) {
  document.querySelectorAll('.mobile-toc,.docs-tree details').forEach(details=>{
    const summary=details.querySelector(':scope > summary'),body=details.querySelector(':scope > nav');
    if(!summary || !body || !body.animate)return;
    const panel=document.createElement('div');panel.className='disclosure-panel';body.before(panel);panel.append(body);
    let animation,sequence=0,desired=details.open;
    const finish=()=>{details.open=desired;panel.style.removeProperty('overflow');panel.style.removeProperty('height');body.inert=!desired;};
    const toggle=(open,immediate=false)=>{
      const version=++sequence;
      const height=details.open ? panel.getBoundingClientRect().height : 0;
      animation?.cancel();desired=open;
      summary.setAttribute('aria-expanded',String(open));
      if(!open && body.contains(document.activeElement))summary.focus();
      body.inert=!open;
      if(reduced.matches || immediate){finish();return;}
      details.open=true;panel.style.overflow='hidden';
      const target=panel.getBoundingClientRect().height;
      animation=panel.animate([{height:`${height}px`,opacity:open ? .45 : 1},{height:open?`${target}px`:'0px',opacity:open ? 1 : .45}],{duration:open?280:160,easing:'cubic-bezier(.22,1,.36,1)'});
      animation.finished.then(()=>{if(version===sequence)finish();},()=>{});
    };
    summary.setAttribute('aria-expanded',String(details.open));
    summary.addEventListener('click',event=>{event.preventDefault();toggle(!desired);});
    details.addEventListener('keydown',event=>{if(event.key==='Escape' && desired){event.preventDefault();toggle(false);summary.focus();}});
    body.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{if(matchMedia('(max-width:767px)').matches)toggle(false,true);}));
    reduced.addEventListener('change',()=>{if(reduced.matches){++sequence;animation?.cancel();finish();}});
  });
}
