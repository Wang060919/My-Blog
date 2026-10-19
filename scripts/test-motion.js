// Dependency-free event/geometry tests. These are not browser rendering tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const tests = [];
function test(name, body) {
  try { body(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
}
function fixture({ reduced = false, compact = false, scroll = 0, navigation = 'navigate', observer = true } = {}) {
  let count = 0;
  const frames = new Map(), observers = [], resizeObservers = [];
  class EventTarget {
    constructor() { this.listeners = {}; }
    addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
    emit(type, values = {}) { for (const callback of this.listeners[type] || []) callback({ type, ...values }); }
  }
  class Style {
    constructor() { this.values = new Map(); }
    setProperty(key, value) { this.values.set(key, value); }
    removeProperty(key) { this.values.delete(key); }
    getPropertyValue(key) { return this.values.get(key) || ''; }
  }
  class Element extends EventTarget {
    constructor(name, top = 0, height = 100) {
      super(); this.name = name; this.offsetTop = top; this.offsetHeight = height;
      this.offsetParent = null; this.dataset = {}; this.style = new Style();
      this.children = []; this.attributes = new Map(); this.animations = [];
      this.inert = false; this.hidden = false; this.focusVisible = false;
    }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    matches(selector) { return selector === ':focus-visible' && this.focusVisible; }
    closest(selector) { if (selector === '[data-home-reveal]') return this.revealRoot || this; if (selector === '[data-home-reveal-group]') return this.group || null; return null; }
    getBoundingClientRect() { return { top: this.offsetTop - context.scrollY, bottom: this.offsetTop + this.offsetHeight - context.scrollY, height: this.offsetHeight, left: 0, width: 100 }; }
    querySelector(selector) { return this.selectors?.[selector] || null; }
    querySelectorAll(selector) { return this.lists?.[selector] || []; }
    removeAttribute(key) { this.attributes.delete(key); }
    setAttribute(key, value) { this.attributes.set(key, value); }
    toggleAttribute(key, value) { if (value) this.attributes.set(key, ''); else this.attributes.delete(key); }
    animate(keyframes, options) { const animation = { keyframes, options, canceled: false, finished: new Promise(() => {}), cancel() { this.canceled = true; } }; this.animations.push(animation); return animation; }
  }
  class Media extends EventTarget { constructor(matches) { super(); this.matches = matches; } change(matches) { this.matches = matches; this.emit('change', { matches }); } }
  class IntersectionObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; this.elements = new Set(); observers.push(this); }
    observe(element) { this.elements.add(element); }
    unobserve(element) { this.elements.delete(element); }
    disconnect() { this.elements.clear(); }
    emit(elements, isIntersecting = true) { this.callback(elements.map(target => ({ target, isIntersecting, boundingClientRect: target.getBoundingClientRect() }))); }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; resizeObservers.push(this); }
    observe() {}
  }
  const window = new EventTarget(), document = new EventTarget();
  document.documentElement = new Element('html'); document.activeElement = new Element('body'); document.hidden = false;
  const hero = new Element('hero', 78, 1000), heading = new Element('heading', 140, 180), support = new Element('support', 340, 170), showcase = new Element('showcase', 550, 550), stage = new Element('stage', 650, 420), visual = new Element('visual', 650, 330), work = new Element('work', 1200, 500), header = new Element('header', 0, 78);
  hero.selectors = { '.hero-scroll-heading': heading, '.hero-scroll-support': support, '.showcase': showcase, '.showcase-stage': stage, '.showcase-visual': visual };
  const targets = [new Element('reveal-heading', 1200, 100), new Element('card-1', 1340, 300), new Element('card-2', 1660, 300), new Element('card-3', 2000, 300)];
  targets.forEach((element, index) => { element.dataset.homeReveal = index ? 'card' : 'heading'; element.group = work; });
  document.querySelector = selector => ({ '.home-intro': hero, '.site-header': header, '.replay-assembly': null })[selector] || null;
  document.getElementById = id => id === 'selected-work' ? work : null;
  document.querySelectorAll = selector => selector === '.is-home [data-home-reveal]' ? targets : [];
  const motion = new Media(reduced), mobile = new Media(compact), fine = new Media(!compact);
  const context = { window, document, Element, ResizeObserver, CSS: { supports: () => true }, scrollY: scroll, innerHeight: 800, location: { hash: '' }, performance: { getEntriesByType: () => [{ type: navigation }] }, matchMedia: query => query.includes('fine') ? fine : mobile,
    requestAnimationFrame(callback) { frames.set(++count, callback); return count; }, cancelAnimationFrame(id) { frames.delete(id); }, addEventListener: window.addEventListener.bind(window) };
  window.ResizeObserver = ResizeObserver;
  if (observer) { context.IntersectionObserver = IntersectionObserver; window.IntersectionObserver = IntersectionObserver; }
  function load(file, name, ...args) {
    const source = fs.readFileSync(path.join(repo, `assets/js/${file}.js`), 'utf8').replace(/^import .*;\n/gm, '').replace(/export function /g, 'function ');
    const scope = vm.createContext({ ...context, animateProjectFlow() {} });
    Object.defineProperty(scope, 'scrollY', { get: () => context.scrollY });
    Object.defineProperty(scope, 'innerHeight', { get: () => context.innerHeight });
    vm.runInContext(source, scope, { filename: `assets/js/${file}.js` });
    return scope[name](...args);
  }
  return { context, window, document, frames, observers, resizeObservers, Element, motion, mobile, fine, hero, heading, support, showcase, stage, work, targets, load,
    tick(now = 100) { const scheduled = [...frames.values()]; frames.clear(); scheduled.forEach(callback => callback(now)); },
    scrollTo(y) { context.scrollY = y; window.emit('scroll'); },
    reveal() { load('home-reveal', 'initHomeReveal', motion); }, heroScroll() { load('hero-scroll', 'initHeroScroll', motion); } };
}
const alpha = element => Number(element.style.getPropertyValue('--scroll-alpha'));

test('Hero exit reverses to full opacity and restores interaction', () => {
  const f = fixture(); f.heroScroll(); assert.equal(alpha(f.heading), 1);
  f.scrollTo(1000); f.tick(); assert.equal(alpha(f.heading), 0); assert.equal(f.heading.inert, true);
  f.scrollTo(0); f.tick(); assert.equal(alpha(f.heading), 1); assert.equal(f.heading.inert, false);
});
test('Coarse/mobile hero exit uses half the desktop displacement', () => {
  const desktop = fixture(), mobile = fixture({ compact: true }); desktop.heroScroll(); mobile.heroScroll();
  for (const f of [desktop, mobile]) { f.scrollTo(250); f.tick(); }
  assert.equal(parseFloat(desktop.heading.style.getPropertyValue('--scroll-shift')), -10);
  assert.equal(parseFloat(mobile.heading.style.getPropertyValue('--scroll-shift')), -5);
});
test('Keyboard focus keeps the outgoing layer visible and interactive', () => {
  const f = fixture(); const link = new f.Element('link'); link.focusVisible = true; f.support.children.push(link); f.document.activeElement = link;
  f.heroScroll(); f.scrollTo(900); f.tick(); assert.equal(alpha(f.support), 1); assert.equal(f.support.inert, false);
});
test('Reduced motion clears hero styles and inert state immediately', () => {
  const f = fixture(); f.heroScroll(); f.scrollTo(1100); f.tick(); f.motion.change(true);
  for (const element of [f.heading, f.support, f.showcase]) { assert.equal(element.style.getPropertyValue('--scroll-alpha'), ''); assert.equal(element.inert, false); }
});
test('Reduced motion does not schedule hero work on every scroll', () => {
  const f = fixture({ reduced: true }); f.heroScroll(); f.scrollTo(500); assert.equal(f.frames.size, 0);
});
test('Background scroll does not schedule hero work', () => {
  const f = fixture(); f.heroScroll(); f.document.hidden = true; f.scrollTo(500); assert.equal(f.frames.size, 0);
});
test('History restore recomputes hero exit at the restored position', () => {
  const f = fixture(); f.heroScroll(); f.context.scrollY = 1000; f.window.emit('pageshow', { persisted: true }); assert.equal(alpha(f.heading), 0);
  f.context.scrollY = 0; f.document.emit('hero-scroll-sync'); assert.equal(alpha(f.heading), 1);
});
test('Resized hero geometry is remeasured', () => {
  const f = fixture({ scroll: 250 }); f.heroScroll(); assert.equal(alpha(f.heading), 0);
  f.heading.offsetTop = 500; f.resizeObservers[0].callback(); assert.equal(alpha(f.heading), 1);
});
test('Home reveal is once-only even when observer supplies a repeated entry', () => {
  const f = fixture(); f.reveal(); const target = f.targets[0]; assert.equal(target.dataset.reveal, 'pending');
  f.context.scrollY = 700; f.observers[0].emit([target]); f.observers[0].emit([target]); assert.equal(target.animations.length, 1); assert.equal(target.dataset.reveal, 'visible');
});
test('Home reveal stagger is bounded within each batch', () => {
  const f = fixture(); f.reveal(); f.context.scrollY = 1100; f.observers[0].emit(f.targets);
  assert.deepEqual(f.targets.map(target => target.animations[0].options.delay), [0, 100, 200, 200]);
});
test('Fast scroll finishes skipped items without replaying them', () => {
  const f = fixture(); f.reveal(); f.scrollTo(2200); f.tick(); assert.ok(f.targets.every(target => target.dataset.reveal === 'visible')); assert.ok(f.targets.every(target => target.animations.length === 0));
});
test('Scrolling back up preserves finite reveal playback without replaying it', () => {
  const f = fixture(); f.reveal(); f.context.scrollY = 700; f.observers[0].emit([f.targets[0]]);
  f.scrollTo(0); f.tick(); assert.equal(f.targets[0].animations[0].canceled, false);
  f.context.scrollY = 700; f.observers[0].emit([f.targets[0]]); assert.equal(f.targets[0].animations.length, 1);
});
test('Hiding the document finishes active reveal animations', () => {
  const f = fixture(); f.reveal(); f.context.scrollY = 700; f.observers[0].emit([f.targets[0]]);
  f.document.hidden = true; f.document.emit('visibilitychange'); assert.equal(f.targets[0].animations[0].canceled, true);
});
test('Hiding the document cancels already queued reveal work', () => {
  const f = fixture(); f.reveal(); f.scrollTo(700); assert.equal(f.frames.size, 1);
  f.document.hidden = true; f.document.emit('visibilitychange'); assert.equal(f.frames.size, 0);
});
test('Background scroll does not schedule home-reveal work', () => {
  const f = fixture(); f.reveal(); f.document.hidden = true; f.scrollTo(700); assert.equal(f.frames.size, 0);
});
test('Returning to a visible document exposes the current viewport without replay', () => {
  const f = fixture(); f.reveal(); f.document.hidden = true; f.document.emit('visibilitychange');
  f.context.scrollY = 1000; f.document.hidden = false; f.document.emit('visibilitychange');
  assert.equal(f.targets[0].dataset.reveal, 'visible'); assert.equal(f.targets[0].animations.length, 0);
  f.observers[0].emit([f.targets[0]]); assert.equal(f.targets[0].animations.length, 0);
  assert.equal(f.targets[3].dataset.reveal, 'pending');
});
test('Midpage refresh exposes visible and passed content without an entrance', () => {
  const f = fixture({ scroll: 1400, navigation: 'reload' }); f.reveal(); assert.ok(f.targets.every(target => target.dataset.reveal === 'visible')); assert.ok(f.targets.every(target => target.animations.length === 0));
});
test('BFCache return exposes restored viewport content', () => {
  const f = fixture(); f.reveal(); f.context.scrollY = 1000; f.window.emit('pageshow', { persisted: true }); assert.equal(f.targets[0].dataset.reveal, 'visible'); assert.equal(f.targets[1].dataset.reveal, 'visible');
});
test('Focusing a pending reveal releases it synchronously', () => {
  const f = fixture(); f.reveal(); f.document.emit('focusin', { target: f.targets[0] }); assert.equal(f.targets[0].dataset.reveal, 'visible');
});
test('Changing to reduced motion finishes all reveals and active animations', () => {
  const f = fixture(); f.reveal(); f.context.scrollY = 700; f.observers[0].emit([f.targets[0]]); f.motion.change(true);
  assert.equal(f.targets[0].animations[0].canceled, true); assert.ok(f.targets.every(target => target.dataset.reveal === 'visible'));
});
test('Initially reduced motion keeps all reveals visible without animations', () => {
  const f = fixture({ reduced: true }); f.reveal(); assert.ok(f.targets.every(target => target.dataset.reveal === 'visible')); assert.equal(f.observers.length, 0);
});
test('Page hide completes an active reveal before history restoration', () => {
  const f = fixture(); f.reveal(); f.context.scrollY = 700; f.observers[0].emit([f.targets[0]]); f.window.emit('pagehide');
  assert.equal(f.targets[0].animations[0].canceled, true); f.window.emit('pageshow', { persisted: true }); f.observers[0].emit([f.targets[0]]); assert.equal(f.targets[0].animations.length, 1);
});
test('Missing IntersectionObserver leaves all home content readable', () => {
  const f = fixture({ observer: false }); f.reveal(); assert.ok(f.targets.every(target => target.dataset.reveal === 'visible')); assert.equal(f.document.documentElement.dataset.homeReveal, 'ready');
});
test('Waves stop scheduling frames and clear parallax when paused', () => {
  const f = fixture(); const svg = new f.Element('svg'); svg.closest = () => f.hero;
  const waves = f.load('waves', 'initWaves', svg, f.motion); waves.setRunning(true); assert.equal(f.frames.size, 1);
  f.tick(100); f.tick(150); assert.equal(svg.dataset.waveFrames, '1'); waves.setRunning(false); assert.equal(f.frames.size, 0); assert.equal(svg.dataset.waveRunning, 'false'); assert.equal(f.hero.style.getPropertyValue('--wave-x'), '');
});
test('Reduced-motion waves never start a frame loop', () => {
  const f = fixture({ reduced: true }); const svg = new f.Element('svg'); const waves = f.load('waves', 'initWaves', svg, f.motion); waves.setRunning(true); assert.equal(f.frames.size, 0); assert.equal(svg.dataset.waveRunning, 'false');
});
const output = { mode: 'Node VM executes production motion modules against deterministic geometry, lifecycle, observer and animation test doubles; not browser/layout validation.', tests, passed: tests.filter(item => item.passed).length, failed: tests.filter(item => !item.passed).length };
console.log(JSON.stringify(output, null, 2)); process.exitCode = output.failed ? 1 : 0;
