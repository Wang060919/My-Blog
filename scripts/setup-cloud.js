#!/usr/bin/env node
// Install a checksum-pinned official Hugo release into this checkout, never globally.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const version = fs.readFileSync(path.join(root, '.hugo-version'), 'utf8').trim();
// Published by gohugoio/hugo in both the release asset API and checksums file.
const checksums = {
  '0.165.0': 'f43494894cdf4a8630a201d5c828051c77f523cc66bb3938b30806835470ac20',
};
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || `${command} exited ${result.status}`);
  return result;
};

try {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    throw new Error('setup:cloud supports Linux x64 only. Install the pinned Hugo Extended version for your platform; the normal runner still supports system Hugo/HUGO_BINARY.');
  }
  if (!checksums[version]) throw new Error(`No reviewed checksum for Hugo ${version}; update the version and checksum together.`);
  const expectedNode = fs.readFileSync(path.join(root, '.node-version'), 'utf8').trim();
  if (process.versions.node !== expectedNode) throw new Error(`Expected Node ${expectedNode}; found ${process.versions.node}. Select .node-version before cloud setup.`);

  const cache = path.join(root, '.cache', 'toolchain');
  const destination = path.join(root, '.tools', 'hugo', version);
  fs.mkdirSync(cache, { recursive: true });
  fs.mkdirSync(destination, { recursive: true });
  const archiveName = `hugo_extended_${version}_linux-amd64.tar.gz`;
  const archive = path.join(cache, archiveName);
  if (!fs.existsSync(archive)) {
    const temporary = `${archive}.download`;
    try {
      run('curl', ['--fail', '--location', '--silent', '--show-error', '--retry', '2', '--connect-timeout', '20', '--max-time', '180',
        `https://github.com/gohugoio/hugo/releases/download/v${version}/${archiveName}`, '--output', temporary]);
      fs.renameSync(temporary, archive);
    } finally { fs.rmSync(temporary, { force: true }); }
  }
  const digest = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  if (digest !== checksums[version]) throw new Error(`Hugo archive checksum mismatch. Inspect/remove ${archive} and retry; nothing was extracted or executed.`);
  run('tar', ['-xzf', archive, '-C', destination, 'hugo']);
  const binary = path.join(destination, 'hugo');
  const result = run(binary, ['version'], { encoding: 'utf8', stdio: 'pipe' });
  if (!result.stdout.includes(`v${version}`) || !result.stdout.includes('+extended')) throw new Error('Downloaded binary did not report the pinned Extended version.');
  console.log(result.stdout.trim());
  console.log(`Verified SHA256: ${digest}`);
  console.log('Cloud Hugo is ready. Run npm ci --include=dev --cache .cache/npm, then npm run ci.');
} catch (error) {
  console.error(`Cloud setup failed: ${error.message}`);
  process.exitCode = 1;
}
