const fs = require('node:fs');
const path = require('node:path');
const { validateSnapshot } = require('./lib/contributions');
const file = path.resolve(__dirname, '../data/github_contributions.json');
const snapshot = validateSnapshot(JSON.parse(fs.readFileSync(file, 'utf8')));
if (snapshot.example) throw Error('Example contributions must not enter the production data directory. Use npm run preview:contributions.');
console.log(`Contribution snapshot validated: ${snapshot.status}.`);
