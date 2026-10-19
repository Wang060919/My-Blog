import { animateProjectFlow } from './project-flow.js';
// One finite assembly per illustration. Underlying content is always rendered.
export function initAssembly(reduced) {
  const seen = new WeakSet(), active = new Map();
  const stop = root => { active.get(root)?.forEach(animation => animation.cancel()); active.delete(root); delete root.dataset.assembling; };
  const run = (root, replay = false) => {
    if (!root || root.hidden || reduced.matches || document.hidden || !Element.prototype.animate) return;
    if (!replay && seen.has(root)) return;
    if(!replay && document.activeViewTransition){document.activeViewTransition.finished.then(()=>run(root),()=>{});return;}
    const rect = root.getBoundingClientRect();
    if (rect.bottom < 80 || rect.top >= innerHeight) return;
    stop(root); seen.add(root);
    const compact = matchMedia('(max-width: 767px), (pointer: coarse)').matches;
    const pieces = Array.from(root.querySelectorAll('[data-piece]')).filter(el => !el.closest('[hidden]'));
    const animations = [];
    root.dataset.assembling='true';
    const animate=(element,frames,duration,delay=0,easing='cubic-bezier(.22,1,.36,1)')=>{
      if(element)animations.push(element.animate(frames,{duration:duration*(compact ? .82 : 1),delay:delay*(compact ? .82 : 1),easing,fill:'backwards'}));
    };
    pieces.forEach((piece, index) => {
      // Preserve author transforms (the board and notebook have their own orientation).
      const base = getComputedStyle(piece).transform;
      const transform = base === 'none' ? '' : base;
      const distance = compact ? 5 : 11;
      const animation = piece.animate([
        {opacity: .6, transform: `translateY(${distance}px) ${transform}`},
        {opacity: 1, transform: `translateY(0) ${transform}`}
      ], {duration: compact ? 360 : 520, delay: Math.min(index * (compact ? 40 : 65), 260), easing: 'cubic-bezier(.22,1,.36,1)'});
      animations.push(animation);
    });
    animateProjectFlow(root.querySelector('[data-flow]'),animate);
    const line = root.querySelector('.scene-code');
    if (line && !compact && typeof line.getTotalLength === 'function') {
      const length = line.getTotalLength();
      animations.push(line.animate([{strokeDasharray: `${length}`, strokeDashoffset: length}, {strokeDasharray: `${length}`, strokeDashoffset: 0}], {duration: 800, easing: 'ease-out'}));
    }
    active.set(root, animations);
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => { if (active.get(root) === animations) {active.delete(root);delete root.dataset.assembling;} });
  };
  const roots = document.querySelectorAll('[data-assembly]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) {stop(entry.target);return;}
      if (entry.target.hidden) return;
      // A fast scroll may already have passed the object. Do not rewind it into an entrance.
      if (entry.target.getBoundingClientRect().bottom > 80) run(entry.target);
    }), {threshold: .12});
    roots.forEach(root => observer.observe(root));
  }
  document.querySelector('.replay-assembly')?.addEventListener('click', () => run(document.querySelector('.showcase-panel:not([hidden])'), true));
  const replay = document.querySelector('.replay-assembly');
  const update = () => { if (replay) replay.hidden = reduced.matches; if (reduced.matches) active.forEach((_, root) => stop(root)); };
  reduced.addEventListener('change', update); update();
  document.addEventListener('visibilitychange', () => { if (document.hidden) active.forEach((_, root) => stop(root)); });
  // BFCache restores the finished page; it must not replay entrances on Back.
  addEventListener('pageshow', event => { if (event.persisted) active.forEach((_, root) => stop(root)); });
  addEventListener('pageswap',()=>active.forEach((_,root)=>stop(root)));
  return {run,stop};
}
