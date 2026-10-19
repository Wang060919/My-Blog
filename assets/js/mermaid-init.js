// Pinned, page-scoped Mermaid with readable source retained on failure.
const elements = Array.from(document.querySelectorAll('.mermaid'));
const sources = new Map(elements.map(element => [element, element.textContent]));
let queue = Promise.resolve();
const showFailure = () => elements.forEach(element => {
  element.replaceChildren(document.createTextNode(sources.get(element)));
  element.removeAttribute('data-processed');
  if (!element.nextElementSibling?.classList.contains('mermaid-status')) {
    const note = document.createElement('p');
    note.className = 'mermaid-status';
    note.setAttribute('role','status');
    note.textContent = '图表暂时无法显示，已保留图表源码供阅读。';
    element.after(note);
  }
});
if (elements.length) {
  try {
    const { default: mermaid } = await import('https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs');
    const scheduleRender = () => {
      queue = queue.catch(() => {}).then(async () => {
        elements.forEach(element => { element.textContent = sources.get(element); element.removeAttribute('data-processed'); });
        mermaid.initialize({theme:document.documentElement.dataset.bsTheme === 'dark' ? 'dark' : 'default',startOnLoad:false,securityLevel:'strict'});
        await mermaid.run({nodes:elements});
      }).catch(showFailure);
    };
    scheduleRender();
    document.addEventListener('themeChanged',scheduleRender);
  } catch (_) { showFailure(); }
}
