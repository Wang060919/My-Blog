import { fetchLiveSnapshot } from './contribution-data.js';
export function initContributions(reduced) {
  const section = document.querySelector('[data-contributions]');
  if (!section || section.dataset.initialized) return;
  section.dataset.initialized = 'true';
  const scroll = section.querySelector('[data-calendar-scroll]');
  let days = Array.from(section.querySelectorAll('.contribution-day'));
  const detail = section.querySelector('#contribution-detail');
  if (!scroll) return;
  let interacted = false;
  section.addEventListener('pointerdown', () => { interacted = true; });
  section.addEventListener('keydown', () => { interacted = true; });
  const dateInput = section.querySelector('[data-calendar-date]');
  let initialText = detail.textContent;
  let selected = days.findIndex(day => day.tabIndex === 0);
  const select = (index, focus = false) => {
    if (!days.length) return;
    selected = Math.max(0, Math.min(days.length - 1, index));
    days.forEach((day, i) => { day.tabIndex = i === selected ? 0 : -1; day.toggleAttribute('data-selected', i === selected); });
    const day = days[selected];
    dateInput.value = day.dataset.date;
    detail.textContent = `${day.dataset.date} · ${day.dataset.count} 次贡献`;
    if (focus) { day.focus({ preventScroll: true }); day.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); }
  };
  const bindDays = () => days.forEach((day, index) => {
    day.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') detail.textContent = `${day.dataset.date} · ${day.dataset.count} 次贡献`; });
    day.addEventListener('focus', () => select(index));
    day.addEventListener('click', () => select(index));
    day.addEventListener('keydown', event => {
      const destinations = { ArrowRight:index + 7, ArrowLeft:index - 7, ArrowDown:index + 1, ArrowUp:index - 1, Home:0, End:days.length - 1 };
      if (event.key in destinations) { event.preventDefault(); select(destinations[event.key], true); }
      if (event.key === 'Escape') { days.forEach(d => d.removeAttribute('data-selected')); detail.textContent = initialText; }
    });
  });
  bindDays();
  scroll.addEventListener('pointerleave', () => { const day = days[selected]; detail.textContent = day?.hasAttribute('data-selected') ? `${day.dataset.date} · ${day.dataset.count} 次贡献` : initialText; });
  dateInput.addEventListener('change', () => { const index = days.findIndex(day => day.dataset.date === dateInput.value); if (index >= 0) { select(index); days[index].scrollIntoView({ block:'nearest', inline:'nearest', behavior:'instant' }); } });
  scroll.scrollLeft = scroll.scrollWidth;
  const snapshot = section.querySelector('[data-snapshot-time]');
  if (snapshot && Date.now() - Date.parse(snapshot.dataset.snapshotTime) > 7 * 86400000) section.querySelector('[data-stale-notice]').hidden = false;
  if (section.dataset.contributionsEndpoint) {
    const applyLiveSnapshot = data => {
      if (document.activeElement === dateInput) { dateInput.addEventListener('blur', () => applyLiveSnapshot(data), { once:true }); return; }
      if (Date.parse(data.fetchedAt) <= Date.parse(snapshot.dataset.snapshotTime)) return;
      const focusedDate = document.activeElement?.matches('.contribution-day') ? document.activeElement.dataset.date : null;
      const selectedDate = interacted ? (dateInput.value || days[selected]?.dataset.date) : null;
      const calendar = section.querySelector('.contribution-calendar'), fragment = document.createDocumentFragment();
      let lastMonth = '';
      data.weeks.forEach(week => {
        const column = document.createElement('div'); column.className = 'contribution-week';
        const label = document.createElement('span'); label.className = 'contribution-month'; label.setAttribute('aria-hidden','true');
        const date = week.days.find(Boolean)?.date, month = date?.slice(0,7);
        label.textContent = month && month !== lastMonth ? `${Number(month.slice(5))}月` : ''; if(month) lastMonth=month; column.append(label);
        week.days.forEach(day => {
          const cell = document.createElement(day ? 'button' : 'span'); cell.className = day ? 'contribution-day' : 'contribution-blank';
          if(day){ cell.type='button'; cell.dataset.date=day.date; cell.dataset.count=String(day.count); cell.dataset.level=String(day.level); cell.tabIndex=-1; cell.setAttribute('aria-label',`${day.date}，${day.count} 次贡献`); cell.title=`${day.date} · ${day.count} 次贡献`; }
          else cell.setAttribute('aria-hidden','true');
          column.append(cell);
        }); fragment.append(column);
      });
      // Build detached nodes first; keep the visible snapshot if any validation fails.
      calendar.replaceChildren(fragment); days=Array.from(calendar.querySelectorAll('.contribution-day')); bindDays();
      initialText=`${data.from} — ${data.to}`; detail.textContent=initialText;
      dateInput.min=data.from; dateInput.max=data.to; dateInput.value=data.to;
      selected=days.findIndex(day=>day.dataset.date===(focusedDate||selectedDate)); if(selected<0)selected=days.length-1;
      days[selected].tabIndex=0; dateInput.value=days[selected].dataset.date;
      if(interacted || focusedDate)select(selected,Boolean(focusedDate));
      section.querySelector('[data-contribution-total]').textContent=String(data.total);
      section.querySelector('[data-contribution-active]').textContent=String(data.activeDays);
      const time=snapshot.querySelector('time');time.dateTime=data.fetchedAt;time.textContent=data.fetchedAt.slice(0,10).replaceAll('-','.');
      snapshot.dataset.snapshotTime=data.fetchedAt;
      section.querySelector('[data-stale-notice]').hidden=Date.now()-Date.parse(data.fetchedAt)<=7*86400000;
      snapshot.hidden=false; section.querySelector('[data-contribution-empty]')?.remove();
      if(!interacted && !focusedDate)scroll.scrollLeft=scroll.scrollWidth;
    };
    fetchLiveSnapshot(section.dataset.contributionsEndpoint).then(applyLiveSnapshot).catch(() => { /* Keep the original, dated, static snapshot on any failure. */ });
  }
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
