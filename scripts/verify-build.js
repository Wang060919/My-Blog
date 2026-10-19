const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const output = path.resolve(process.argv[2] || 'public');
const read = (file) => fs.readFileSync(path.join(output, file), 'utf8');
const sitemap = read('sitemap.xml');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const home = read('index.html');
const verifyLight = (html, route) => {
  assert.match(html, /<html\b[^>]*\bdata-bs-theme=["']?light["'\s>]/, `Page must start light before JavaScript: ${route}`);
  assert.match(html, /document\.documentElement\.dataset\.bsTheme\s*=\s*["']light["']/, `Missing first-paint light bootstrap: ${route}`);
  assert.ok(!/<(?:button|a)\b[^>]*(?:theme-toggle|data-bs-theme-value)/.test(html), `Unexpected theme control: ${route}`);
};
verifyLight(home, '/');
verifyLight(read('404.html'), '404.html');
const canonical = home.match(/<link\b[^>]*rel=["']?canonical["']?[^>]*href=["']?([^"'\s>]+)/)?.[1];
assert.ok(canonical, 'Homepage canonical URL is missing');
const origin = new URL(canonical).origin;
assert.ok(locations.includes(`${origin}/`), 'Sitemap is missing the homepage');
assert.ok(!sitemap.includes('localhost'), 'Production sitemap contains localhost');
assert.ok(read('robots.txt').includes(`${origin}/sitemap.xml`), 'robots.txt must declare the site-wide sitemap');
assert.ok(fs.existsSync(path.join(output, '404.html')), 'Missing top-level 404.html');

const articles = fs.readdirSync('content/blog', { withFileTypes: true }).filter((entry) => entry.isDirectory());
let published = 0;
let diagramPages = 0;
for (const article of articles) {
  const sourcePath = path.join('content/blog', article.name, 'index.md');
  if (!fs.existsSync(sourcePath)) continue;
  const source = fs.readFileSync(sourcePath, 'utf8');
  const frontMatter = source.match(/^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1/);
  assert.ok(frontMatter, `Missing front matter: ${sourcePath}`);
  if (/^draft\s*[:=]\s*true\s*$/m.test(frontMatter[2])) continue;
  const slug = frontMatter[2].match(/^slug\s*[:=]\s*["']?([^\r\n"']+)/m)?.[1].trim() || article.name;
  const relative = `blog/${slug}/`;
  const html = read(`${relative}index.html`);
  verifyLight(html, relative);
  assert.ok(locations.includes(`${origin}/${relative}`), `Sitemap is missing ${relative}`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `Expected one H1: ${relative}`);
  const hasDiagram = /class=["']?mermaid["'\s>]/.test(html);
  const initializers = (html.match(/src=["']?[^"'\s>]*\/js\/mermaid-init\.js["'\s>]/g) || []).length;
  assert.equal(initializers, hasDiagram ? 1 : 0, `Incorrect Mermaid loading: ${relative}`);
  assert.ok(!html.includes('mermaid.min.js'), `Duplicate Mermaid script: ${relative}`);
  if (hasDiagram) diagramPages++;
  published++;
}
assert.ok(published > 0, 'No published articles were checked');
assert.ok(!home.includes('mermaid-init.js') && !home.includes('mermaid.min.js'), 'Homepage loads Mermaid');
if (diagramPages) {
  assert.ok(read('js/mermaid-init.js').includes('mermaid@11.4.0/'), 'Mermaid version is not pinned');
}

const stylesheet = home.match(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*href=["']?([^"'\s>]+)/)?.[1];
assert.ok(stylesheet, 'Missing main stylesheet');
const css = read(decodeURIComponent(new URL(stylesheet, origin).pathname).replace(/^\//, ''));
assert.ok(css.includes('.gh-copy-btn') && css.includes('.copied'), 'PurgeCSS removed dynamic copy button styles');

const rules = read('_redirects').split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'));
const sources = new Set();
const targets = new Set();
for (const rule of rules) {
  const [from, to, status, extra] = rule.trim().split(/\s+/);
  assert.ok(!extra && status === '301', `Invalid redirect: ${rule}`);
  assert.ok(from.startsWith('/blog/') && to.startsWith('/blog/'), `Unexpected redirect scope: ${rule}`);
  assert.ok(!sources.has(from), `Duplicate redirect source: ${from}`);
  assert.ok(fs.existsSync(path.join(output, to, 'index.html')), `Missing redirect target: ${to}`);
  assert.ok(!fs.existsSync(path.join(output, from, 'index.html')), `Stale article output: ${from}`);
  sources.add(from);
  targets.add(to);
}
assert.equal(targets.size, 8, 'Expected eight legacy article redirects');
assert.equal(sources.size, 16, 'Expected redirects with and without trailing slashes');
// Personal-site routes and local-only search must survive production asset pruning.
const personalRoutes = ['projects', 'projects/vanishtrans', 'projects/esp32-lab', 'projects/ai-chat', 'blog', 'about', 'docs', 'archives', 'tags', 'categories', 'search'];
for (const route of personalRoutes) {
  const html = read(`${route}/index.html`);
  verifyLight(html, route);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `Expected one H1: ${route}`);
  assert.ok(html.includes('class=site-header') || html.includes('class="site-header"'), `Missing shared navigation: ${route}`);
}
const searchIndex = JSON.parse(read('search-index.json'));
assert.equal(searchIndex.filter((item) => item.type === 'blog').length, published, 'Search must include every published article');
assert.equal(searchIndex.filter((item) => item.type === 'projects').length, 3, 'Search must include the three real project entries');
for (const item of searchIndex) {
  assert.ok(['blog', 'projects', 'docs'].includes(item.type), `Unexpected search type: ${item.type}`);
  assert.ok(fs.existsSync(path.join(output, decodeURIComponent(item.permalink), 'index.html')), `Missing search target: ${item.permalink}`);
}
const docsSources = fs.readdirSync('content/docs').filter((name) => name !== '_index.md');
if (docsSources.length === 0) {
  assert.ok(read('docs/index.html').includes('文档正在整理'), 'Empty documentation must show an honest empty state');
  assert.equal(searchIndex.filter((item) => item.type === 'docs').length, 0, 'Empty docs must not produce fake search entries');
}
for (const selector of ['data-motion', 'data-reveal', 'data-switching', 'data-selected', 'data-enhanced', 'data-scrolled', '.wave-texture', '.search-error-links']) {
  assert.ok(css.includes(selector), `PurgeCSS removed interactive state: ${selector}`);
}
assert.ok(home.includes('wave-scene') && home.includes('data-wave-lane'), 'Missing progressive wave geometry');
assert.ok(fs.existsSync(path.join(output, 'images/hero-waves-v2.webp')), 'Missing optimized wave texture');
for (const selector of ['@view-transition', '::view-transition-group(project-surface)', '.desk-scene', '.process-strip', '.replay-assembly']) {
  assert.ok(css.includes(selector), `PurgeCSS removed studio interaction style: ${selector}`);
}
assert.ok(home.includes('data-project-surface') && home.includes('data-assembly'), 'Missing progressive project illustration hooks');
assert.ok(home.includes('page-content-ready') && home.includes('blocking=render'), 'Missing native transition render boundary');
assert.ok(!home.includes('jost-v4-latin-'), 'Personal pages must not preload unused theme fonts');
for (const hook of ['data-flow=translation', 'data-flow=signal', 'data-flow=request']) {
  assert.ok(home.includes(hook) || home.includes(hook.replace('=', '="')+'"'), `Missing project flow: ${hook}`);
}
for (const selector of ['.selection-mark', '.signal-packets', '.terminal-output', '::view-transition-group-children(project-surface)']) {
  assert.ok(css.includes(selector), `Missing project flow style: ${selector}`);
}
for (const selector of ['.hero-scroll-heading', '.hero-scroll-support', '.hero-wave-scroll', 'data-scroll-inactive']) {
  assert.ok(css.includes(selector), `Missing reversible hero style: ${selector}`);
}
assert.ok(home.includes('hero-scroll-heading') && home.includes('hero-scroll-support'), 'Missing reversible hero wrappers');
assert.equal((home.match(/data-home-reveal-group/g) || []).length, 3, 'Homepage must retain work, journal and about entrance groups');
assert.ok(home.includes('homeReveal') && home.includes('1200'), 'Missing bounded entrance bootstrap fallback');
assert.ok(css.includes('data-home-reveal') && css.includes('prefers-reduced-motion'), 'Missing progressive homepage entrance styles');
assert.ok(css.includes('--card-muted') && css.includes('--footer-surface'), 'Missing scoped dark surfaces');
assert.ok(css.includes('.copy-failed') && css.includes('--gh-btn-success') && css.includes('--gh-btn-error'), 'Missing copy feedback theme states');
console.log(`Build verified: ${published} articles, ${locations.length} sitemap URLs, ${diagramPages} Mermaid page(s), 8 legacy URL mappings, copy button CSS, and 404.html.`);
console.log(`Personal site verified: ${personalRoutes.length} routes, ${searchIndex.length} search entries, documentation state, and production interaction styles.`);
console.log('Light-only shell verified: homepage, 404, articles and personal routes start light and contain no theme controls.');

assert.ok(home.includes('data-hero-entry'), 'Missing scroll-owned selected-work heading');
for (const token of ['--paper:#fcfaf8', '--ink:#26251e', '--radius-panel:6px', '--radius-control:999px']) {
  assert.ok(css.replace(/\s+/g, '').includes(token), `Missing editorial token: ${token}`);
}
for (const selector of ['data-hero-entry', '--preview-tilt', '.project-grid:not([data-filtered=']) {
  assert.ok(css.includes(selector), `Missing editorial state: ${selector}`);
}
console.log('Editorial surfaces verified: warm palette, responsive project grid and shared scroll entrance survive production pruning.');

assert.ok(home.includes('id=building') || home.includes('id="building"'), 'Missing contribution section');
for (const selector of ['contribution-calendar', 'contribution-day', 'data-level', 'contribution-date-label']) {
  assert.ok(css.includes(selector), `Missing contribution production style: ${selector}`);
}
assert.ok(home.indexOf('id=building') > home.indexOf('id=selected-work'), 'Contributions must follow selected work');
console.log('Contribution section verified: production styles and selected-work placement.');
