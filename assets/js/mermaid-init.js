// Doks override: pin the CDN version; retain theme switching and on-demand loading.
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.esm.min.mjs';

(() => {
  const elements = Array.from(document.querySelectorAll('.mermaid'));
  if (!elements.length) {
    return;
  }

  // Store original content
  elements.forEach((ele) => {
    ele.setAttribute('data-mermaid-src', ele.textContent);
  });

  const resetElements = () => {
    return new Promise((resolve) => {
      elements.forEach((ele) => {
        ele.textContent = ele.getAttribute('data-mermaid-src') || '';
        ele.removeAttribute('data-processed');
      });
      resolve();
    });
  };

  const getTheme = () => {
    const theme = document.documentElement.getAttribute('data-bs-theme');
    return theme === 'dark' ? 'dark' : 'default';
  };

  const init = (theme) => {
    mermaid.initialize({ theme, startOnLoad: false, securityLevel: 'strict' });
    mermaid.run({ nodes: elements });
  };

  // Initial render
  init(getTheme());

  // Listen for theme changes
  document.addEventListener('themeChanged', () => {
    resetElements()
      .then(() => init(getTheme()))
      .catch(console.error);
  });
})();
