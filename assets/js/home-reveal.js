// One entrance per element and document lifetime. Scroll only triggers; time drives playback.
export function initHomeReveal(reduced) {
  const targets = Array.from(document.querySelectorAll('.is-home [data-home-reveal]'));
  if (!targets.length) return;
  const root = document.documentElement, pending = new Set(), active = new Map();
  let observer, frame = 0;
  const finish = element => {
    element.dataset.reveal = 'visible';
    pending.delete(element);
    observer?.unobserve(element);
    active.get(element)?.cancel();
    active.delete(element);
  };
  const release = () => {
    observer?.disconnect();
    cancelAnimationFrame(frame); frame = 0;
    targets.forEach(finish);
    root.dataset.homeReveal = 'ready';
  };
  const showViewport = () => targets.forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight) finish(element);
  });
  const showPassed = () => {
    frame = 0;
    // A skipped or rapidly crossed item must never remain hidden above the reader.
    for (const element of [...pending, ...active.keys()]) {
      if (element.getBoundingClientRect().top < Math.min(96, innerHeight * .15)) finish(element);
    }
  };
  const schedule = () => {
    if (!frame && (pending.size || active.size)) frame = requestAnimationFrame(showPassed);
  };
  const enter = (element, delay) => {
    pending.delete(element); observer.unobserve(element);
    element.dataset.reveal = 'visible';
    if (reduced.matches || document.hidden || element.contains(document.activeElement)) return;
    const distance = element.dataset.homeReveal === 'heading' ? 20 : 30;
    try {
      // Individual translate preserves the card's hover transform and its child animations.
      const animation = element.animate([
        { opacity: 0, translate: `0 ${distance}px` },
        { opacity: 1, translate: '0 0' },
      ], { duration: 600, delay, easing: 'cubic-bezier(.44,0,.56,1)', fill: 'backwards' });
      active.set(element, animation);
      animation.finished.then(() => {
        if (active.get(element) === animation) active.delete(element);
      }, () => {});
    } catch (_) { finish(element); }
  };
  try {
    if (reduced.matches || root.dataset.homeReveal === 'disabled' || !('IntersectionObserver' in window) || !Element.prototype.animate || !CSS.supports('translate: 0 1px')) {
      release(); return;
    }
    observer = new IntersectionObserver(entries => {
      try {
        const groups = new Map();
        entries.filter(entry => entry.isIntersecting && pending.has(entry.target))
          .sort((a, b) => targets.indexOf(a.target) - targets.indexOf(b.target))
          .forEach(entry => {
            const element = entry.target;
            if (entry.boundingClientRect.top < Math.min(96, innerHeight * .15)) { finish(element); return; }
            const group = element.closest('[data-home-reveal-group]') || element;
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push(element);
          });
        // Restart the stagger for each newly visible local batch, never for the whole page.
        groups.forEach(items => items.forEach((element, index) => enter(element, Math.min(index, 2) * 100)));
      } catch (_) { release(); }
    }, { threshold: 0 });
    const navigationType = performance.getEntriesByType('navigation')[0]?.type;
    const restoring = navigationType === 'back_forward' || scrollY > 8 || Boolean(location.hash);
    targets.forEach(element => {
      const top = element.getBoundingClientRect().top;
      if (element.dataset.reveal === 'visible' || top < 0 || (restoring && top < innerHeight)) finish(element);
      else { element.dataset.reveal = 'pending'; pending.add(element); observer.observe(element); }
    });
    document.addEventListener('focusin', event => {
      const element = event.target.closest('[data-home-reveal]');
      if (targets.includes(element)) finish(element);
    });
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    // Existing native-navigation scroll priming happens before the shared snapshot.
    document.addEventListener('hero-scroll-sync', showViewport);
    addEventListener('pagehide', () => [...active.keys()].forEach(finish));
    addEventListener('pageshow', event => {
      if (event.persisted || scrollY > 8 || navigationType === 'back_forward') showViewport();
      requestAnimationFrame(() => { if (scrollY > 8) showViewport(); });
    });
    addEventListener('pagereveal', () => {
      if (window.navigation?.activation?.navigationType === 'traverse') showViewport();
    });
    reduced.addEventListener('change', () => { if (reduced.matches) release(); });
    root.dataset.homeReveal = 'ready';
  } catch (_) { release(); }
}
