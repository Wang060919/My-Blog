// Reversible progress on the existing document flow; no pinning or extra scroll distance.
export function initHeroScroll(reduced) {
  const hero=document.querySelector('.home-intro'),work=document.getElementById('selected-work');
  if(!hero || !work)return;
  const heading=hero.querySelector('.hero-scroll-heading'),support=hero.querySelector('.hero-scroll-support'),showcase=hero.querySelector('.showcase'),stage=hero.querySelector('.showcase-stage');
  if(!heading || !support || !showcase || !stage)return;
  const compact=matchMedia('(max-width:767px), (pointer:coarse)');
  const layers=[heading,support,showcase];
  let frame=0,metrics;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
  // offset geometry excludes the progress translations, avoiding measurement feedback.
  const box=element=>{let top=0;for(let node=element;node;node=node.offsetParent)top+=node.offsetTop;return{top,bottom:top+element.offsetHeight,height:element.offsetHeight};};
  const clear=()=>{
    layers.forEach(layer=>{layer.style.removeProperty('--scroll-alpha');layer.style.removeProperty('--scroll-shift');layer.inert=false;layer.removeAttribute('data-scroll-inactive');});
    hero.style.removeProperty('--scroll-wave-alpha');
  };
  const outgoing=(layer,progress,distance)=>{
    const focused=layer.contains(document.activeElement) && document.activeElement.matches(':focus-visible'),alpha=focused?1:1-smooth(progress);
    layer.style.setProperty('--scroll-alpha',alpha.toFixed(4));
    layer.style.setProperty('--scroll-shift',`${focused?0:-distance*smooth(progress)}px`);
    // An outgoing transparent layer cannot retain invisible pointer/Tab targets.
    const inactive=alpha<.06 && !focused;
    layer.inert=inactive;layer.toggleAttribute('data-scroll-inactive',inactive);
  };
  const update=()=>{
    frame=0;
    if(reduced.matches){clear();return;}
    if(!metrics)return;
    const {h,s,show,visual,entry,header}=metrics,y=scrollY,vh=innerHeight,mobile=compact.matches;
    outgoing(heading,(y-(h.top-header-12))/Math.max(1,h.height),mobile?5:10);
    outgoing(support,(y-(s.top-header-28))/Math.max(1,s.height+16),mobile?4:8);
    const start=visual.bottom-header-vh*(mobile ? .28 : .32),end=show.bottom-header-8;
    outgoing(showcase,(y-start)/Math.max(1,end-start),mobile?7:14);
    const incoming=smooth((vh*.98-(entry.top-y))/(vh*.34));
    hero.style.setProperty('--scroll-wave-alpha',(1-incoming*.88).toFixed(4));
  };
  const schedule=()=>{if(!frame && !document.hidden && !reduced.matches)frame=requestAnimationFrame(update);};
  const measure=()=>{
    cancelAnimationFrame(frame);frame=0;
    metrics={h:box(heading),s:box(support),show:box(showcase),visual:box(stage),entry:box(work),header:document.querySelector('.site-header')?.offsetHeight||0};
    // Only the visual part of the fixed stage defines the late showcase exit.
    metrics.visual.bottom=metrics.visual.top+(hero.querySelector('.showcase-visual')?.offsetHeight||metrics.visual.height);
    update();
  };
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});
  addEventListener('pageshow',measure);addEventListener('pagereveal',measure);
  document.addEventListener('hero-scroll-sync',measure);
  document.addEventListener('focusin',update);document.addEventListener('focusout',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)measure();});
  reduced.addEventListener('change',measure);compact.addEventListener('change',measure);
  if('ResizeObserver' in window){const observer=new ResizeObserver(measure);[heading,support,showcase,work,document.querySelector('.site-header')].filter(Boolean).forEach(element=>observer.observe(element));}
  document.fonts?.ready.then(measure);measure();
}
