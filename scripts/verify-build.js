const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const output = path.resolve(process.argv[2] || 'public');
const read = (file) => fs.readFileSync(path.join(output, file), 'utf8');
const sitemap = read('sitemap.xml');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const home = read('index.html');
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
console.log(`Build verified: ${published} articles, ${locations.length} sitemap URLs, ${diagramPages} Mermaid page(s), 8 legacy URL mappings, copy button CSS, and 404.html.`);
