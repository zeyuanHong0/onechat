import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { katex } from '@mdit/plugin-katex';
import mermaid from 'mermaid';

const timerMap = new WeakMap<HTMLElement, number>();

export function handleCodeCopy(btn: HTMLElement) {
  const codeText = btn.closest('.code-block-wrapper')?.querySelector('code')?.textContent ?? '';
  navigator.clipboard.writeText(codeText).then(() => {
    const icon = btn.querySelector('iconify-icon');
    const text = btn.querySelector('.copy-text');
    if (icon) icon.setAttribute('icon', 'lucide:check');
    if (text) text.textContent = '已复制';
    btn.classList.add('copied');
    const oldTimer = timerMap.get(btn);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }
    const timer = window.setTimeout(() => {
      if (icon) icon.setAttribute('icon', 'lucide:copy');
      if (text) text.textContent = '复制';
      btn.classList.remove('copied');
      timerMap.delete(btn);
    }, 2000);
    timerMap.set(btn, timer);
  });
}

const codeBlockWrapper = (lang: string, code: string) => {
  const displayLang = lang || 'text';
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <div class="code-block-lang">
        <iconify-icon icon="lucide:file-code-2" class="code-lang-icon"></iconify-icon>
        <span>${displayLang}</span>
      </div>
      <button class="code-copy-btn" data-copy title="复制代码">
        <iconify-icon icon="lucide:copy"></iconify-icon>
        <span class="copy-text">复制</span>
      </button>
    </div>
    <div class="code-block-body">
      <pre><code class="hljs language-${displayLang}">${code}</code></pre>
    </div>
  </div>`;
};

const mermaidBlockWrapper = (id: string, content: string) => {
  return `<div class="mermaid-wrapper">
    <div class="mermaid-header">
      <div class="mermaid-label">
        <iconify-icon icon="lucide:git-graph" class="mermaid-icon"></iconify-icon>
        <span>图表</span>
      </div>
    </div>
    <div class="mermaid-body">
      <div class="mermaid" id="${id}">${content}</div>
    </div>
  </div>`;
};

export function createMarkdownIt(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return '';
    },
  });

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info.trim() === 'mermaid') {
      return mermaidBlockWrapper(`mermaid-${idx}`, token.content);
    }
    const [lang, ...attrs] = token.info.trim().split(/\s+/);
    const code = options.highlight
      ? options.highlight(token.content, lang, attrs.join(' '))
      : token.content;
    return codeBlockWrapper(lang, code);
  };
  md.use(katex);

  return md;
}

export function initMermaid(theme: 'light' | 'dark') {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
  });
}

export async function renderMermaidNodes(root: ShadowRoot | null) {
  const mermaids = root?.querySelectorAll<HTMLDivElement>('.mermaid:not([data-processed])');
  if (mermaids && mermaids.length > 0) {
    for (const node of mermaids) {
      const text = node.textContent || '';
      const id = node.id || `mermaid-${Date.now()}`;
      try {
        const { svg } = await mermaid.render(id, text);
        node.innerHTML = svg;
      } catch (e) {
        console.error('mermaid render error:', e);
      }
      node.setAttribute('data-processed', 'true');
    }
  }
}
