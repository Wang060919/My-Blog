#!/usr/bin/env node
// Opt-in build-time refresh. Never called by the browser or ordinary npm build.
const fs = require('node:fs');
const path = require('node:path');
const { normalizeCalendar, DAY } = require('./lib/contributions');
const target = path.resolve(__dirname, '../data/github_contributions.json');
async function update({ token = process.env.GITHUB_TOKEN, fetchImpl = fetch, output = target, now = new Date() } = {}) {
  if (!token) throw Error('GITHUB_TOKEN is absent; existing snapshot preserved');
  const fetchedAt = now.toISOString(), to = fetchedAt.slice(0, 10);
  const from = new Date(Date.parse(to + 'T00:00:00Z') - 364 * DAY).toISOString().slice(0, 10);
  const username = 'Wang060919';
  const response = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'My-Blog-Contribution-Snapshot' },
    body: JSON.stringify({ query: `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`, variables: { login:username, from:from+'T00:00:00Z', to:to+'T23:59:59Z' } })
  });
  if (!response.ok) throw Error(`GitHub HTTP ${response.status}; existing snapshot preserved`);
  const payload = await response.json();
  if (payload.errors || !payload.data?.user) throw Error('GitHub returned no usable calendar; existing snapshot preserved');
  const snapshot = normalizeCalendar(payload.data.user.contributionsCollection.contributionCalendar, { username, fetchedAt, from, to });
  const temp = output + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(snapshot, null, 2) + '\n', { mode:0o644 });
  fs.renameSync(temp, output);
  console.log(`Updated public contribution totals through ${to}.`);
}
if (require.main === module) update().catch(() => { console.error('Contribution refresh failed. Existing snapshot preserved; check authentication, network and calendar validation.'); process.exitCode=1; });
module.exports = { update };
