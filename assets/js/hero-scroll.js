// One reversible document-scroll timeline. No pinning, wheel interception or extra height.
export function initHeroScroll(reduced) {
  const hero = document.querySelector('.home-intro'), work = document.getElementById('selected-work');
  if (!hero || !work) return;
  const heading = hero.querySelector('.hero-scroll-heading'), support = hero.querySelector('.hero-scroll-support');
  const showcase = hero.querySelector('.showcase'), stage = hero.querySelector('.showcase-stage');
  const entryHeading = work.querySelector('[data-hero-entry]');
  if (!heading || !support || !showcase || !stage) return;
  const compact = matchMedia('(max-width:767px), (pointer:coarse)');
  const layers = [heading, support, showcase, entryHeading].filter(Boolean);
  let frame = 0, metrics, lastY;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  // Offset geometry excludes visual transforms, preventing scroll/measurement feedback.
  const box = element => { let top = 0; for (let node = element; node; node = node.offsetParent) top += node.offsetTop; return { top, bottom: top + element.offsetHeight, height: element.offsetHeight }; };
  const clear = () => {
    layers.forEach(layer => {
      layer.style.removeProperty('--scroll-alpha'); layer.style.removeProperty('--scroll-shift');
      layer.inert = false; layer.removeAttribute('data-scroll-inactive');
    });
    hero.style.removeProperty('--scroll-wave-alpha');
    hero.style.removeProperty('--preview-tilt');
  };
  const paint = (layer, alpha, shift) => {
    if (!layer) return;
    const focused = layer.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    layer.style.setProperty('--scroll-alpha', (focused ? 1 : alpha).toFixed(4));
    layer.style.setProperty('--scroll-shift', `${focused ? 0 : shift}px`);
    const inactive = alpha < .06 && !focused;
    layer.inert = inactive; layer.toggleAttribute('data-scroll-inactive', inactive);
  };
  const update = () => {
    frame = 0;
    if (reduced.matches) { clear(); return; }
    if (!metrics || document.hidden) return;
    const { h, s, show, visual, entry, header } = metrics;
    const y = scrollY, vh = innerHeight, mobile = compact.matches;
    lastY = y;
    // All cues use this one progress value, with deliberately overlapping windows.
    const start = h.top - header - 12, span = Math.max(1, entry.top - header - start);
    const progress = (y - start) / span;
    const cue = (from, to) => smooth((progress - (from - start) / span) / Math.max(.001, (to - from) / span));
    const title = cue(start, start + h.height);
    const subtitleStart = s.top - header - 28;
    const subtitle = cue(subtitleStart, subtitleStart + s.height + 16);
    const preview = cue(visual.bottom - header - vh * (mobile ? .28 : .32), show.bottom - header - 8);
    // Incoming heading follows the wave retreat, rather than playing a separate timer.
    const arrival = cue(entry.top - vh * .92, entry.top - vh * .60);
    paint(heading, 1 - title, -(mobile ? 5 : 10) * title);
    paint(support, 1 - subtitle, -(mobile ? 4 : 8) * subtitle);
    paint(showcase, 1 - preview, -(mobile ? 7 : 14) * preview);
    paint(entryHeading, arrival, (mobile ? 10 : 20) * (1 - arrival));
    const wave = cue(entry.top - vh * .98, entry.top - vh * .64);
    hero.style.setProperty('--scroll-wave-alpha', (1 - wave * .88).toFixed(4));
    hero.style.setProperty('--preview-tilt', `${mobile ? 0 : preview * 3}deg`);
  };
  const schedule = () => {
    if (frame || document.hidden || reduced.matches) return;
    // Once both sections have passed, scroll is cheap until the reader comes back.
    const end = metrics ? Math.max(metrics.entry.top, metrics.show.bottom) : Infinity;
    if (scrollY > end && lastY > end) return;
    frame = requestAnimationFrame(update);
  };
  const measure = () => {
    cancelAnimationFrame(frame); frame = 0;
    metrics = { h: box(heading), s: box(support), show: box(showcase), visual: box(stage), entry: box(work), header: document.querySelector('.site-header')?.offsetHeight || 0 };
    metrics.visual.bottom = metrics.visual.top + (hero.querySelector('.showcase-visual')?.offsetHeight || metrics.visual.height);
    update();
  };
  addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', measure, { passive: true });
  addEventListener('pageshow', measure); addEventListener('pagereveal', measure);
  document.addEventListener('hero-scroll-sync', measure);
  document.addEventListener('focusin', update); document.addEventListener('focusout', schedule);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else measure();
  });
  reduced.addEventListener('change', measure); compact.addEventListener('change', measure);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    [heading, support, showcase, work, document.querySelector('.site-header')].filter(Boolean).forEach(element => observer.observe(element));
  }
  document.fonts?.ready.then(measure); measure();
}
