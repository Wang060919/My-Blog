const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Run through npm so the same npm CLI is used on Windows and Linux.
if (!process.env.npm_execpath) {
  console.error('请使用 npm run check 启动检查。');
  process.exit(1);
}
const npm = (args, capture = false) => spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
  encoding: 'utf8',
  stdio: capture ? 'pipe' : 'inherit',
  timeout: 300000,
});
let failed = false;
for (const command of ['outdated', 'audit']) {
  const args = command === 'audit' ? ['audit', '--audit-level=moderate', '--json'] : ['outdated', '--json'];
  const result = npm(args, true);
  let report;
  try { report = JSON.parse(result.stdout || '{}'); } catch { report = null; }
  if (result.error || !report || report.error || result.status === null || result.status > 1 || (result.status !== 0 && !Object.keys(report).length)) {
    console.error(`${command} 检查未完成，请检查网络、registry 或 npm 错误；这不等于已发现漏洞。`);
    console.error(result.error?.message || result.stderr || report?.error?.summary || `npm exit: ${result.status}`);
    failed = true;
  } else if (command === 'outdated') {
    console.log(`依赖更新：${Object.keys(report).length} 个包有可用更新（不会自动升级）。`);
  } else if (!report.metadata?.vulnerabilities) {
    console.error('安全审计未返回有效的漏洞统计。');
    failed = true;
  } else {
    console.log('安全审计：', report.metadata.vulnerabilities);
    if (result.status !== 0) {
      console.error('发现达到 moderate 阈值的漏洞；请先阅读 npm audit 详情，再评估更新。');
      failed = true;
    }
  }
}
const build = npm(['run', 'build']);
if (build.error || build.status !== 0) {
  console.error(build.error?.message || '生产构建失败。');
  process.exit(1);
}
const verify = spawnSync(process.execPath, [path.join(__dirname, 'verify-build.js')], { stdio: 'inherit', timeout: 60000 });
if (verify.error || verify.status !== 0) failed = true;
console.log(failed ? '检查未全部通过，请处理上述问题。' : '健康检查通过。');
process.exitCode = failed ? 1 : 0;
