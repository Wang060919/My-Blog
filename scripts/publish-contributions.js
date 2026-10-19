#!/usr/bin/env node
// Single-file publication. No Git credential storage, force push, or arbitrary paths.
const fs = require('node:fs');
const path = require('node:path');
const { validateSnapshot } = require('./lib/contributions');
const REPOSITORY = 'Wang060919/My-Blog';
const FILE = 'data/github_contributions.json';
async function publish({ token = process.env.GITHUB_TOKEN, fetchImpl = fetch, input = path.resolve(__dirname, '../.cache/contribution-snapshot/github_contributions.json'), event = process.env.GITHUB_EVENT_NAME, ref = process.env.GITHUB_REF, repository = process.env.GITHUB_REPOSITORY, now = Date.now() } = {}) {
  if (!['schedule', 'workflow_dispatch'].includes(event) || ref !== 'refs/heads/main' || repository !== REPOSITORY) throw Error('Publication is restricted to the default main branch schedule/manual run');
  if (!token) throw Error('Missing publication authorization');
  const snapshot = validateSnapshot(JSON.parse(fs.readFileSync(input, 'utf8')));
  if (snapshot.status !== 'ready' || snapshot.example || snapshot.source !== 'github-graphql' || snapshot.username !== 'Wang060919') throw Error('Only a verified real snapshot can be published');
  const age = now - Date.parse(snapshot.fetchedAt);
  if (age < -300000 || age > 48 * 3600000) throw Error('Snapshot is not fresh enough to publish');
  const content = JSON.stringify(snapshot, null, 2) + '\n';
  const endpoint = `https://api.github.com/repos/${REPOSITORY}/contents/${FILE}`;
  const headers = { Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'Content-Type':'application/json' };
  const request = async (url, options = {}) => {
    const response = await fetchImpl(url, { ...options, headers, redirect:'error', signal:AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`Snapshot publication failed (HTTP ${response.status}); no automatic overwrite/retry`);
    return response.json();
  };
  const current = await request(endpoint + '?ref=main');
  if (current.type !== 'file' || current.encoding !== 'base64' || !/^[a-f0-9]{40}$/.test(current.sha)) throw Error('Unexpected target file');
  const oldText = Buffer.from(current.content.replace(/\s/g, ''), 'base64').toString('utf8');
  const oldSnapshot = validateSnapshot(JSON.parse(oldText));
  if (oldSnapshot.status === 'ready' && (oldSnapshot.to > snapshot.to || Date.parse(oldSnapshot.fetchedAt) > Date.parse(snapshot.fetchedAt))) throw Error('Refusing to publish an older calendar');
  if (oldText === content) return { changed:false };
  const result = await request(endpoint, { method:'PUT', body:JSON.stringify({ message:`chore: refresh public contribution snapshot (${snapshot.to})`, branch:'main', sha:current.sha, content:Buffer.from(content).toString('base64') }) });
  if (!result.commit?.sha) throw Error('Publication response incomplete; inspect main before retrying');
  return { changed:true, commit:result.commit.sha };
}
if (require.main === module) publish().then(result=>console.log(result.changed ? `Published validated contribution snapshot: ${result.commit}` : 'Snapshot unchanged; no commit.')).catch(()=>{ console.error('Snapshot publication failed. No automatic retry; inspect the workflow and main branch.');process.exitCode=1; });
module.exports = { publish };
