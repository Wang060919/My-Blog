// Build a clearly labelled demonstration without changing the production snapshot.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'contribution-example-'));
try {
  const fixtureData = path.join(data, 'data');
  fs.mkdirSync(fixtureData);
  fs.copyFileSync(path.resolve(__dirname, '../tests/fixtures/contributions-example.json'), path.join(fixtureData, 'github_contributions.json'));
  const config = path.join(data, 'config');
  fs.cpSync(path.resolve(__dirname, '../config'), config, { recursive:true });
  const moduleFile = path.join(config, '_default/module.toml');
  fs.writeFileSync(moduleFile, fs.readFileSync(moduleFile, 'utf8').replace('source = \"data\"', `source = ${JSON.stringify(fixtureData)}`));
  const result = spawnSync(process.execPath, [path.join(__dirname, 'hugo-runner.js'), '--environment', 'production', '--configDir', config, '--minify', '--destination', '.dev-public/contribution-example'], { stdio:'inherit', env:{ ...process.env } });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { fs.rmSync(data, { recursive:true, force:true }); }
