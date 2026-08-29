document.addEventListener('DOMContentLoaded', () => {
  // 遍历所有代码块容器
  document.querySelectorAll('pre').forEach((pre) => {
    // 跳过 Mermaid 图表
    if (pre.classList.contains('mermaid')) return;
    const container = pre.closest('.expressive-code') || pre.closest('.highlight') || pre;

    // 1. 彻底清除主题自带的冗余旧按钮，防止出现两个按键
    container.querySelectorAll('.copy, .copy-code-button, .btn-copy').forEach(el => el.remove());

    // 2. 避免重复注入
    if (container.querySelector('.gh-copy-btn')) return;

    // 3. 容器强制相对定位
    container.style.position = 'relative';

    // 4. 创建统一的 GitHub 原生复制按钮
    const btn = document.createElement('button');
    btn.className = 'gh-copy-btn';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Copy to clipboard');
    btn.setAttribute('title', 'Copy');

    // GitHub 复制图标 SVG
    const copyIcon = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>`;
    
    // 复制成功勾选 SVG
    const successIcon = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="#1a7f37"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>`;

    btn.innerHTML = copyIcon;

    // 点击复制事件
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code') || pre;
      const textToCopy = code.innerText.trim();
      try {
        await navigator.clipboard.writeText(textToCopy);
        btn.innerHTML = successIcon;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = copyIcon;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    });

    container.appendChild(btn);
  });
});