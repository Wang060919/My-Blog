// Offline only: prepare the existing verified snapshot for user-controlled KV initialization.
const fs=require('node:fs'),path=require('node:path');
const {validateSnapshot}=require('../../scripts/lib/contributions');
const data=validateSnapshot(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/github_contributions.json'),'utf8')));
if(data.status!=='ready'||data.example||data.username!=='Wang060919'||data.source!=='github-graphql')throw Error('A real verified snapshot is required');
const directory=path.resolve(__dirname,'../../.cache/contribution-seed');fs.mkdirSync(directory,{recursive:true});
fs.writeFileSync(path.join(directory,'value.json'),JSON.stringify(data));
fs.writeFileSync(path.join(directory,'metadata.json'),JSON.stringify({fetchedAt:data.fetchedAt}));
console.log('Prepared .cache/contribution-seed/value.json and metadata.json. No network calls or Cloudflare changes.');
