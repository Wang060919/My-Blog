export function initContributions(reduced) {
  const section = document.querySelector('[data-contributions]');
  if (!section || section.dataset.initialized) return;
  section.dataset.initialized = 'true';
  const scroll = section.querySelector('[data-calendar-scroll]');
  const days = Array.from(section.querySelectorAll('.contribution-day'));
  const detail = section.querySelector('#contribution-detail');
  if (!scroll || !days.length) return;
  const dateInput = section.querySelector('[data-calendar-date]');
  const initialText = detail.textContent;
  let selected = days.findIndex(day => day.tabIndex === 0);
  const select = (index, focus = false) => {
    selected = Math.max(0, Math.min(days.length - 1, index));
    days.forEach((day, i) => { day.tabIndex = i === selected ? 0 : -1; day.toggleAttribute('data-selected', i === selected); });
    const day = days[selected];
    dateInput.value = day.dataset.date;
    detail.textContent = `${day.dataset.date} · ${day.dataset.count} 次贡献`;
    if (focus) { day.focus({ preventScroll: true }); day.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); }
  };
  days.forEach((day, index) => {
    day.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') detail.textContent = `${day.dataset.date} · ${day.dataset.count} 次贡献`; });
    day.addEventListener('focus', () => select(index));
    day.addEventListener('click', () => select(index));
    day.addEventListener('keydown', event => {
      const destinations = { ArrowRight:index + 7, ArrowLeft:index - 7, ArrowDown:index + 1, ArrowUp:index - 1, Home:0, End:days.length - 1 };
      if (event.key in destinations) { event.preventDefault(); select(destinations[event.key], true); }
      if (event.key === 'Escape') { days.forEach(d => d.removeAttribute('data-selected')); detail.textContent = initialText; }
    });
  });
  scroll.addEventListener('pointerleave', () => { const day = days[selected]; detail.textContent = day.hasAttribute('data-selected') ? `${day.dataset.date} · ${day.dataset.count} 次贡献` : initialText; });
  dateInput.addEventListener('change', () => { const index = days.findIndex(day => day.dataset.date === dateInput.value); if (index >= 0) { select(index); days[index].scrollIntoView({ block:'nearest', inline:'nearest', behavior:'instant' }); } });
  scroll.scrollLeft = scroll.scrollWidth;
  const snapshot = section.querySelector('[data-snapshot-time]');
  if (snapshot && Date.now() - Date.parse(snapshot.dataset.snapshotTime) > 7 * 86400000) section.querySelector('[data-stale-notice]').hidden = false;
  const animations = new Set();
  const animate = () => {
    if (reduced.matches || !section.animate) return;
    const run = (element, frames, options) => { const animation = element.animate(frames, options); animations.add(animation); animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation)); };
    run(section, [{ opacity:.55, transform:'translateY(10px)' }, { opacity:1, transform:'translateY(0)' }], { duration:420, easing:'ease-out' });
    section.querySelectorAll('.contribution-week').forEach((week, i) => run(week, [{ opacity:.4 }, { opacity:1 }], { duration:260, delay:i * 5, easing:'ease-out' }));
  };
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); animate(); } }, { threshold:.15 });
    observer.observe(section);
    reduced.addEventListener('change', () => { if (reduced.matches) { observer.disconnect(); animations.forEach(animation => animation.cancel()); animations.clear(); } });
  }
}
