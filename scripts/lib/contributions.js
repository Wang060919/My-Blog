const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const DAY = 86400000;
function dateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Invalid calendar date');
  const time = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw Error('Invalid calendar date');
  return time;
}
function normalizeCalendar(calendar, { username, fetchedAt, from, to, example = false }) {
  const start = dateValue(from), end = dateValue(to);
  if (end < start || end - start > 366 * DAY) throw Error('Invalid calendar range');
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username) || !Number.isFinite(Date.parse(fetchedAt))) throw Error('Invalid snapshot metadata');
  const raw = calendar.weeks.flatMap(week => week.contributionDays);
  if (raw.length !== (end - start) / DAY + 1) throw Error('Incomplete calendar');
  let total = 0, activeDays = 0;
  const days = raw.map((day, index) => {
    const time = dateValue(day.date), level = LEVELS.indexOf(day.contributionLevel), count = day.contributionCount;
    if (time !== start + index * DAY || !Number.isSafeInteger(count) || count < 0 || level < 0 || (count === 0) !== (level === 0)) throw Error('Invalid contribution day');
    total += count; if (count > 0) activeDays++;
    return { date: day.date, count, level, contributionLevel: day.contributionLevel };
  });
  if (total !== calendar.totalContributions) throw Error('Calendar total mismatch');
  if (end > Date.parse(fetchedAt)) throw Error('Future calendar date');
  const cells = [...Array(new Date(start).getUTCDay()).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  let previousMonth = '';
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    const group = cells.slice(i, i + 7), first = group.find(Boolean);
    const month = first.date.slice(0, 7), label = month !== previousMonth ? `${Number(month.slice(5))}月` : '';
    previousMonth = month;
    weeks.push({ month: label, days: group });
  }
  return { schemaVersion: 1, status: 'ready', example, username, fetchedAt, from, to, source: example ? 'example' : 'github-graphql', total, activeDays, weeks };
}
function validateSnapshot(snapshot) {
  if (snapshot.status === 'unavailable') return snapshot;
  const result = normalizeCalendar({ totalContributions: snapshot.total, weeks: snapshot.weeks.map(w => ({ contributionDays: w.days.filter(Boolean).map(d => ({ date:d.date, contributionCount:d.count, contributionLevel:d.contributionLevel })) })) }, snapshot);
  if (JSON.stringify(result) !== JSON.stringify(snapshot)) throw Error('Invalid normalized snapshot');
  return result;
}
module.exports = { normalizeCalendar, validateSnapshot, LEVELS, DAY };
