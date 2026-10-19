import autoprefixer from 'autoprefixer';
import purgeCSSPlugin from '@fullhuman/postcss-purgecss';

const purgecss = purgeCSSPlugin({
    content: ['./hugo_stats.json'],
    defaultExtractor: (content) => {
        const els = JSON.parse(content).htmlElements;
        return [...(els.tags || []), ...(els.classes || []), ...(els.ids || [])];
    },
    dynamicAttributes: [
        'data-motion',
        'data-reveal',
        'data-home-reveal',
        'data-hero-entry',
        'data-switching',
        'data-selected',
        'data-filtered',
        'data-enhanced',
        'data-scrolled',
        'data-closing',
        'data-scroll-inactive',
        'aria-expanded',
        'aria-selected',
        'aria-pressed',
        'aria-current',
        'data-bs-popper',
        'data-bs-target',
        'data-bs-theme',
        'data-dark-mode',
        'data-global-alert',
        'data-pane', // tabs.js
        'data-popper-placement',
        'data-sizes',
        'data-toggle-tab', // tabs.js
        'id',
        'size',
        'type'
    ],
    safelist: [
        /^view-transition/,
        'data-vt-active',
        'filter-empty',
        'search-error-links',
        'copy-status',
        'copy-failed',
        'mermaid-status',
        'mark',
        'active',
        'btn-clipboard', // clipboards.js
        'clipboard', // clipboards.js
        'disabled',
        'hidden',
        'modal-backdrop', // search-modal.js
        'selected', // search-modal.js
        'show',
        'img-fluid',
        'blur-up',
        'lazyload',
        'lazyloaded',
        'alert-link',
        'container-fw ',
        'container-lg',
        'container-fluid',
        'offcanvas-backdrop',
        'figcaption',
        'dt',
        'dd',
        'showing',
        'hiding',
        'page-item',
        'page-link',
        'not-content',
        'copy',
        'btn-copy',
        'gh-copy-btn', // custom.js: dynamically created copy button
        'copied', // custom.js: copy success state
    ]
});

export default {
  plugins: [
    autoprefixer(),
    ...(process.env.HUGO_ENVIRONMENT === "production" ? [purgecss] : []),
  ],
};
