import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import 'iconify-icon';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import githubMarkdownLightCss from 'github-markdown-css/github-markdown-light.css?inline';
import githubMarkdownDarkCss from 'github-markdown-css/github-markdown-dark.css?inline';
import hljsLightCss from 'highlight.js/styles/github.css?inline';
import hljsDarkCss from 'highlight.js/styles/github-dark.css?inline';
import { katex } from '@mdit/plugin-katex';
import katexCss from 'katex/dist/katex.min.css?inline';

// 给 CSS 中所有选择器加上 scope 前缀
function scopeCss(cssText: string, scope: string): string {
  return cssText
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
    .replace(/([^{}]+)\{/g, (_match, selectors: string) => {
      const scoped = selectors
        .split(',')
        .map((s) => {
          const trimmed = s.trim();
          if (!trimmed) return s;
          return `${scope} ${trimmed}`;
        })
        .join(', ');
      return `${scoped}{`;
    });
}

// markdown 适配样式
const markdownAdaptCssText = `
  .markdown-body {
    font-size: 13px;
    line-height: 1.6;
  }
  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    margin-top: 1em;
    margin-bottom: 0.4em;
  }
  .markdown-body h1 { font-size: 1.3em; padding-bottom: 0.2em; }
  .markdown-body h2 { font-size: 1.2em; padding-bottom: 0.2em; }
  .markdown-body h3 { font-size: 1.1em; }
  .markdown-body h4 { font-size: 1em; }
  .markdown-body h5 { font-size: 0.95em; }
  .markdown-body h6 { font-size: 0.9em; }
  .markdown-body p { margin: 0.5em 0; }
  .markdown-body ul,
  .markdown-body ol { margin: 0.5em 0; padding-left: 1.5em; }
  .markdown-body li { margin: 0.15em 0; }
  .markdown-body blockquote { padding: 0.2em 0.8em; margin: 0.5em 0; }
  .markdown-body :not(pre) > code {
    padding: 0.15em 0.35em;
    font-size: 0.88em;
    background: var(--ai-chat-code-inline-bg);
    border-radius: 4px;
  }
  .markdown-body pre {
    padding: 12px;
    font-size: 0.85em;
    line-height: 1.5;
    background: var(--ai-chat-code-block-bg);
    border-radius: 0 0 var(--ai-chat-radius-sm) var(--ai-chat-radius-sm);
  }
  .markdown-body pre code {
    padding: 0;
    background: transparent;
    font-size: inherit;
  }
  .markdown-body table { margin: 0.5em 0; font-size: 0.95em; }
  .markdown-body hr { margin: 0.8em 0; }
  .markdown-body img { margin: 0.5em 0; }
  .markdown-body a { text-decoration: none; }
  .markdown-body a:hover { text-decoration: underline; }
`;

const timerMap = new WeakMap<HTMLElement, number>();
function handleCodeCopy(btn: HTMLElement) {
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

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: 'loading' | 'sending' | 'stopped' | 'success' | 'error';
}

@customElement('ai-chat')
export class AiChat extends LitElement {
  static styles = [
    css`
      :host {
        --ai-chat-primary: #000000;
        --ai-chat-primary-hover: #1a1a1a;
        --ai-chat-bg: #ffffff;
        --ai-chat-surface: #fafafa;
        --ai-chat-border: #eaeaea;
        --ai-chat-text: #000000;
        --ai-chat-text-secondary: #888888;
        --ai-chat-user-bubble: #ebebeb;
        --ai-chat-ai-bubble: transparent;
        --ai-chat-ai-text: #000000;
        --ai-chat-code-bg: #1a1a1a;
        --ai-chat-code-text: #e6e6e6;
        --ai-chat-code-block-bg: #f0f1f3;
        --ai-chat-code-inline-bg: rgba(0, 0, 0, 0.06);
        --ai-chat-scrollbar-track: transparent;
        --ai-chat-scrollbar-thumb: #d4d4d4;
        --ai-chat-scrollbar-thumb-hover: #b0b0b0;
        --ai-chat-radius: 12px;
        --ai-chat-radius-sm: 8px;
        --ai-chat-font-size: 13px;
        --ai-chat-font-size-sm: 12px;
        --ai-chat-font-size-xs: 11px;
        --ai-chat-spacing: 16px;
        --ai-chat-spacing-sm: 8px;
        --ai-chat-spacing-xs: 4px;
        --ai-chat-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.06);
        --ai-chat-container-width: 400px;
        --ai-chat-container-height: 600px;
        --ai-chat-fab-size: 56px;
      }

      :host(.dark-theme) {
        --ai-chat-bg: #0a0a0a;
        --ai-chat-surface: #141414;
        --ai-chat-border: #2a2a2a;
        --ai-chat-text: #ededed;
        --ai-chat-text-secondary: #666666;
        --ai-chat-user-bubble: #202020;
        --ai-chat-ai-bubble: transparent;
        --ai-chat-ai-text: #ededed;
        --ai-chat-code-bg: #111111;
        --ai-chat-code-text: #e6e6e6;
        --ai-chat-code-block-bg: #1a1a1a;
        --ai-chat-code-inline-bg: rgba(255, 255, 255, 0.08);
        --ai-chat-scrollbar-track: transparent;
        --ai-chat-scrollbar-thumb: #333333;
        --ai-chat-scrollbar-thumb-hover: #555555;
        --ai-chat-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 20px rgba(0, 0, 0, 0.4);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .chat-wrapper {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 16px;
      }

      .chat-fab {
        position: absolute;
        right: 0;
        bottom: 0;
        width: var(--ai-chat-fab-size);
        height: var(--ai-chat-fab-size);
        border-radius: 50%;
        background: var(--ai-chat-primary);
        border: none;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--ai-chat-shadow);
        cursor: pointer;
        opacity: 1;
        transition:
          transform 0.2s,
          background-color 0.2s,
          opacity 0.2s ease;
      }

      .chat-fab:hover {
        transform: scale(1.05);
        background: var(--ai-chat-primary-hover);
      }

      .chat-fab.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .chat-fab iconify-icon {
        font-size: 24px;
      }

      .chat-panel {
        position: absolute;
        right: 0;
        bottom: 0;
        width: var(--ai-chat-container-width);
        height: var(--ai-chat-container-height);
        background: var(--ai-chat-bg);
        border-radius: 16px;
        box-shadow: var(--ai-chat-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid var(--ai-chat-border);
        transform-origin: bottom right;
        opacity: 0;

        transform: scale(0.95);
        visibility: hidden;
        pointer-events: none;

        transition:
          opacity 0.2s ease,
          transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chat-panel.open {
        opacity: 1;
        transform: scale(1);
        visibility: visible;
        pointer-events: auto;
      }

      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--ai-chat-border);
        background: var(--ai-chat-bg);
      }

      .chat-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .chat-header-logo {
        width: 28px;
        height: 28px;
        background: var(--ai-chat-primary);
        color: #ffffff;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chat-header-logo iconify-icon {
        width: 16px;
        height: 16px;
        display: block;
      }

      .chat-header-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--ai-chat-text);
      }

      .chat-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chat-header-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background: var(--ai-chat-surface);
        border: 1px solid var(--ai-chat-border);
        color: var(--ai-chat-text-secondary);
        padding: 0;
        transition:
          background-color 0.2s,
          color 0.2s;
      }

      .chat-header-btn:hover {
        background: var(--ai-chat-border);
        color: var(--ai-chat-text);
      }

      .chat-messages-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: var(--ai-chat-surface);
        scrollbar-width: thin;
        scrollbar-color: var(--ai-chat-scrollbar-thumb) var(--ai-chat-scrollbar-track);
      }

      .chat-messages-container::-webkit-scrollbar,
      .chat-input::-webkit-scrollbar {
        width: 10px;
      }

      .chat-messages-container::-webkit-scrollbar-track,
      .chat-input::-webkit-scrollbar-track {
        background: var(--ai-chat-scrollbar-track);
        border-radius: 999px;
      }

      .chat-messages-container::-webkit-scrollbar-thumb,
      .chat-input::-webkit-scrollbar-thumb {
        background: var(--ai-chat-scrollbar-thumb);
        border-radius: 999px;
        border: 2px solid var(--ai-chat-scrollbar-track);
      }

      .chat-messages-container::-webkit-scrollbar-thumb:hover,
      .chat-input::-webkit-scrollbar-thumb:hover {
        background: var(--ai-chat-scrollbar-thumb-hover);
      }

      .message-row {
        display: flex;
        max-width: 100%;
      }

      .message-row.user {
        justify-content: flex-end;
      }

      .message-row.ai {
        justify-content: flex-start;
      }

      .message-avatar {
        display: none;
      }

      .message-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 95%;
      }

      .message-bubble {
        padding: 10px 14px;
        border-radius: var(--ai-chat-radius);
        font-size: var(--ai-chat-font-size);
        line-height: 1.55;
        word-break: break-word;
      }

      .message-bubble.loading {
        min-width: 72px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--ai-chat-text-secondary);
      }

      .loading-icon {
        width: 16px;
        height: 16px;
        animation: ai-chat-spin 1s linear infinite;
      }

      .loading-dots {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .loading-dots span {
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: currentColor;
        animation: ai-chat-bounce 1.2s infinite ease-in-out both;
      }

      .loading-dots span:nth-child(2) {
        animation-delay: 0.12s;
      }

      .loading-dots span:nth-child(3) {
        animation-delay: 0.24s;
      }

      @keyframes ai-chat-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes ai-chat-bounce {
        0%,
        80%,
        100% {
          transform: translateY(0);
          opacity: 0.4;
        }

        40% {
          transform: translateY(-3px);
          opacity: 1;
        }
      }

      .message-row.user .message-bubble {
        background: var(--ai-chat-user-bubble);
        color: var(--ai-chat-text);
        border-bottom-right-radius: 4px;
      }

      .message-row.ai .message-content {
        max-width: 100%;
        min-width: 0;
      }

      .message-row.ai .message-bubble {
        background: transparent;
        color: var(--ai-chat-ai-text);
        padding: 0;
        border-radius: 0;
        overflow-wrap: break-word;
      }

      .message-time {
        font-size: var(--ai-chat-font-size-xs);
        color: var(--ai-chat-text-secondary);
        padding: 0 4px;
      }

      .message-row.user .message-time {
        text-align: right;
      }

      .chat-input-area {
        padding: 12px 16px;
        border-top: 1px solid var(--ai-chat-border);
        background: var(--ai-chat-bg);
      }
      .chat-input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--ai-chat-surface);
        border: 1px solid var(--ai-chat-border);
        border-radius: 22px;
        padding: 6px 8px 6px 14px;
        transition: border-color 0.2s;
      }

      .chat-input {
        flex: 1;
        width: 100%;
        min-height: 22px;
        max-height: 80px;
        border: none;
        outline: none;
        font-size: var(--ai-chat-font-size);
        color: var(--ai-chat-text);
        background: transparent;
        font-family: inherit;
        line-height: 1.4;
        overflow-y: hidden;
        display: block;
        scrollbar-width: thin;
        scrollbar-color: var(--ai-chat-scrollbar-thumb) var(--ai-chat-scrollbar-track);
      }

      textarea {
        resize: none;
        padding: 0;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
      }

      textarea::placeholder {
        color: var(--ai-chat-text-secondary);
      }

      .input-send-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--ai-chat-primary);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition:
          background 0.2s,
          transform 0.1s;
      }

      .input-send-btn iconify-icon {
        font-size: 20px;
        color: #ffffff;
      }

      .input-send-btn.disabled {
        background: var(--ai-chat-border);
        cursor: default;
      }

      .input-send-btn.stop iconify-icon {
        font-size: 14px;
      }

      .input-send-btn.stop {
        background: #000000;
      }

      .input-send-btn.stop:hover {
        background: #1a1a1a;
      }

      :host(.dark-theme) .input-send-btn:not(.disabled):not(.stop),
      :host(.dark-theme) .input-send-btn.stop {
        background: #ffffff;
      }

      :host(.dark-theme) .input-send-btn:not(.disabled):not(.stop) iconify-icon,
      :host(.dark-theme) .input-send-btn.stop iconify-icon {
        color: #000000;
      }

      :host(.dark-theme) .chat-fab {
        background: #ffffff;
        color: #000000;
      }

      :host(.dark-theme) .chat-header-logo {
        background: #ffffff;
        color: #000000;
      }

      .markdown-body {
        background-color: transparent !important;
      }

      .markdown-body .code-block-wrapper {
        width: 100%;
        margin: 0.6em 0;
        border-radius: var(--ai-chat-radius-sm);
        border: 1px solid var(--ai-chat-border);
        overflow: hidden;
        background: transparent;
      }

      .markdown-body .code-block-header {
        padding: 6px 12px;
        background: var(--ai-chat-code-block-bg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--ai-chat-border);
        user-select: none;
      }

      .markdown-body .code-block-lang {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        font-weight: 500;
        color: var(--ai-chat-text-secondary);
        text-transform: lowercase;
        letter-spacing: 0.02em;
      }

      .markdown-body .code-block-lang .code-lang-icon {
        font-size: 13px;
        opacity: 0.7;
      }

      .markdown-body .code-copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border: none;
        background: transparent;
        color: var(--ai-chat-text-secondary);
        cursor: pointer;
        font-size: 11px;
        border-radius: 4px;
        opacity: 0;
        transition:
          opacity 0.15s,
          color 0.15s,
          background 0.15s;
      }
      .markdown-body .code-block-wrapper:hover .code-copy-btn {
        opacity: 1;
      }
      .markdown-body .code-copy-btn:hover {
        background: rgba(0, 0, 0, 0.06);
        color: var(--ai-chat-text);
      }
      .markdown-body .code-copy-btn.copied {
        opacity: 1;
        color: #22c55e;
      }
      .markdown-body .code-copy-btn iconify-icon {
        font-size: 13px;
      }

      .markdown-body .code-block-body {
        overflow-x: auto;
      }
      .markdown-body .code-block-body pre {
        margin: 0;
        padding: 12px 14px;
        border-radius: 0;
        background: var(--ai-chat-code-block-bg);
      }

      :host(.dark-theme) .markdown-body .code-copy-btn:hover {
        background: rgba(255, 255, 255, 0.08);
      }
    `,
    unsafeCSS(katexCss),
    unsafeCSS(githubMarkdownLightCss),
    unsafeCSS(scopeCss(githubMarkdownDarkCss, ':host(.dark-theme)')),
    unsafeCSS(hljsLightCss),
    unsafeCSS(scopeCss(hljsDarkCss, ':host(.dark-theme)')),
    // 适配样式
    unsafeCSS(markdownAdaptCssText),
    unsafeCSS(scopeCss(markdownAdaptCssText, ':host(.dark-theme)')),
  ];

  // 主题
  @property()
  theme: 'light' | 'dark' = 'light';

  private applyTheme() {
    this.classList.toggle('dark-theme', this.theme === 'dark');
  }

  private toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
  }

  @property()
  title = 'OneChat';

  @property()
  placeholder = '有问题，尽管问';

  @property({ type: Boolean })
  isOpen = false;

  private readonly roleClassMap = {
    user: 'user',
    assistant: 'ai',
    system: 'ai',
  } as const;

  @state()
  messages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: '你好，请帮我介绍一下 TypeScript 。',
    },
    {
      id: '2',
      role: 'assistant',
      content:
        'TypeScript 是 JavaScript 的超集，为代码提供了静态类型检查，能在编译时发现潜在的错误。',
    },
    {
      id: '3',
      role: 'user',
      content: 'TypeScript 的主要特点有哪些？',
    },
    {
      id: '4',
      role: 'assistant',
      content:
        'TypeScript 的主要特点包括：\n1. 静态类型检查：在编译时检查类型错误，减少运行时错误。\n2. 类型注解：可以为变量、函数参数和返回值添加类型注解。\n3. 接口和类：支持面向对象编程，提供接口和类的概念。\n4. 模块化：支持 ES6 模块化语法，便于代码组织和复用。\n5. 丰富的工具支持：与主流编辑器和 IDE 集成，提供智能提示和重构功能。',
    },
    {
      id: '5',
      role: 'user',
      content: 'TypeScript 与 JavaScript 有什么区别？',
    },
    {
      id: '6',
      role: 'assistant',
      content:
        'TypeScript 是 JavaScript 的超集，主要区别在于：\n1. 类型系统：TypeScript 提供了静态类型检查，而 JavaScript 是动态类型语言。\n2. 编译过程：TypeScript 需要编译为 JavaScript 才能运行，而 JavaScript 可以直接在浏览器中运行。\n3. 语法扩展：TypeScript 引入了接口、枚举、泛型等语法特性，而这些在 JavaScript 中并不存在。',
    },
  ];

  @state()
  inputMessage: string = '';

  @query('.chat-input')
  private inputElement?: HTMLTextAreaElement;

  protected willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('theme')) {
      this.applyTheme();
    }
  }

  protected firstUpdated() {
    this.resizeInput();
  }

  private resizeInput(textarea: HTMLTextAreaElement | undefined = this.inputElement) {
    if (!textarea) return;
    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight) || 80;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }

  private handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.inputMessage = target.value;
    this.resizeInput(target);
  }

  private async scrollToBottom(smooth = true) {
    await this.updateComplete;
    const container = this.shadowRoot?.querySelector('.chat-messages-container') as HTMLElement;
    if (!container) return;
    this.isAutoScroll = true;
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      // 平滑滚动动画约 600ms，延迟清除守卫
      setTimeout(() => {
        this.isAutoScroll = false;
      }, 600);
    } else {
      // 等待浏览器完成布局后再读取 scrollHeight，避免读到旧值
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
            resolve();
          });
        });
      });
      // 清除守卫
      requestAnimationFrame(() => {
        this.isAutoScroll = false;
      });
    }
  }

  private handleScroll(e: Event) {
    const container = e.target as HTMLElement;
    if (!container) return;
    // 自动滚动期间跳过判断，避免误将 isAtBottom 设为 false
    if (this.isAutoScroll) return;
    const threshold = 50;
    this.isAtBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.inputMessage.trim()) return;
      this.sendMessage();
    }
  }

  @state()
  private isSending = false; // 防止重复发送消息
  private isAtBottom = true; // 是否在底部
  private isAutoScroll = false; // 自动滚动守卫
  private abortController: AbortController | null = null; // 中断控制器

  private updateMessageById(id: string, patch: Partial<Message>) {
    this.messages = this.messages.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg));
  }

  private async sendMessage() {
    const content = this.inputMessage.trim();
    if (!content || this.isSending) return;
    this.isSending = true;

    const now = Date.now();
    const userMessage: Message = {
      id: `${now}-user`,
      role: 'user',
      content: content,
    };
    const assistantId = `${now}-assistant`;
    const loadingMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '正在思考中...',
      status: 'loading',
    };
    this.messages = [...this.messages, userMessage, loadingMessage];
    this.inputMessage = '';
    await this.updateComplete;
    this.resizeInput();
    this.isAtBottom = true;
    await this.scrollToBottom(false);

    try {
      this.abortController = new AbortController();
      const res = await fetch('http://localhost:3100/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.messages
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            }))
            .filter((_, index) => index !== this.messages.length - 1),
        }),
        signal: this.abortController.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      this.updateMessageById(assistantId, {
        status: 'sending',
        content: '',
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // 用于存储未完整接收的消息片段
      let answer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {
          stream: true,
        });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            if (raw === '[DONE]') {
              this.updateMessageById(assistantId, {
                status: 'success',
              });
            } else {
              try {
                answer += JSON.parse(raw);
              } catch {
                answer += raw;
              }
              const index = this.messages.findIndex((item) => item.id === assistantId);
              if (index !== -1) {
                this.messages = [...this.messages];
                this.messages[index] = {
                  ...this.messages[index],
                  content: answer,
                  status: 'sending',
                };
              }
              if (this.isAtBottom) {
                await this.scrollToBottom(false);
              }
            }
          }
        }
      }
      const target = this.messages.find((item) => item.id === assistantId);
      if (target?.status !== 'success') {
        this.updateMessageById(assistantId, { status: 'success' });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // 用户主动中断，保留已生成的内容
        const target = this.messages.find((item) => item.id === assistantId);
        if (target) {
          this.updateMessageById(assistantId, { status: 'stopped' });
        }
      } else {
        this.updateMessageById(assistantId, {
          status: 'error',
          content: '请求失败，请稍后重试.',
        });
      }
    } finally {
      this.abortController = null;
      this.isSending = false;
      if (this.isAtBottom) {
        await this.scrollToBottom();
        this.isAtBottom = true;
      }
    }
  }

  private stopMessage() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private md = new MarkdownIt({
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

  messageContent(role: 'user' | 'assistant' | 'system', content: string) {
    if (role === 'assistant' || role === 'system') {
      return html`<div class="markdown-body" .innerHTML=${this.md.render(content)}></div>`;
    } else {
      return html`<div>${content}</div>`;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.applyTheme();
    this.shadowRoot?.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('[data-copy]');
      if (!btn) return;
      handleCodeCopy(btn as HTMLElement);
    });
    // 自定义代码块样式
    this.md!.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const [lang, ...attrs] = token.info.trim().split(/\s+/);
      const code = options.highlight
        ? options.highlight(token.content, lang, attrs.join(' '))
        : token.content;
      return codeBlockWrapper(lang, code);
    };
    this.md.use(katex);
  }

  render() {
    return html`
      <div class="chat-wrapper">
        <div class="chat-panel ${this.isOpen ? 'open' : ''}">
          <div class="chat-header">
            <div class="chat-header-left">
              <div class="chat-header-logo">
                <iconify-icon icon="lucide:bot"></iconify-icon>
              </div>
              <span class="chat-header-title">${this.title}</span>
            </div>
            <div class="chat-header-actions">
              <button
                class="chat-header-btn"
                type="button"
                @click=${this.toggleTheme}
                title="切换主题：${this.theme === 'dark' ? '深色' : '浅色'}"
              >
                ${this.theme === 'dark'
                  ? html`<iconify-icon icon="lucide:moon"></iconify-icon>`
                  : html`<iconify-icon icon="lucide:sun"></iconify-icon>`}
              </button>
              <button
                class="chat-header-btn"
                type="button"
                @click=${() => (this.isOpen = false)}
                title="收起"
              >
                <iconify-icon icon="lucide:minus"></iconify-icon>
              </button>
            </div>
          </div>
          <div class="chat-messages-container" @scroll=${this.handleScroll}>
            ${repeat(
              this.messages,
              (message) => message.id,
              (message) => html`
                <div class="message-row ${this.roleClassMap[message.role]}">
                  <div class="message-avatar">
                    ${message.role === 'user'
                      ? html`<iconify-icon icon="lucide:user-round"></iconify-icon>`
                      : html`<iconify-icon icon="lucide:sparkles"></iconify-icon>`}
                  </div>
                  <div class="message-content">
                    <div class="message-bubble ${message.status === 'loading' ? 'loading' : ''}">
                      ${message.status === 'loading'
                        ? html`
                            <div class="loading-indicator" aria-label="AI 正在回复">
                              <iconify-icon
                                class="loading-icon"
                                icon="lucide:loader-circle"
                              ></iconify-icon>
                              <span class="loading-dots" aria-hidden="true">
                                <span></span>
                                <span></span>
                                <span></span>
                              </span>
                            </div>
                          `
                        : this.messageContent(message.role, message.content)}
                    </div>
                  </div>
                </div>
              `,
            )}
          </div>
          <div class="chat-input-area">
            <div class="chat-input-wrapper">
              <textarea
                class="chat-input"
                rows="1"
                placeholder=${this.placeholder}
                .value=${this.inputMessage}
                @input=${this.handleInputChange}
                @keydown=${this.handleKeyDown}
              ></textarea>
              <button
                class="input-send-btn ${this.isSending
                  ? 'stop'
                  : this.inputMessage
                    ? ''
                    : 'disabled'}"
                type="button"
                @click=${this.isSending ? this.stopMessage : this.sendMessage}
              >
                ${this.isSending
                  ? html`<iconify-icon icon="mdi:square"></iconify-icon>`
                  : html`<iconify-icon icon="lucide:arrow-up"></iconify-icon>`}
              </button>
            </div>
          </div>
        </div>

        <button
          class="chat-fab ${this.isOpen ? 'hidden' : ''}"
          type="button"
          @click=${() => (this.isOpen = true)}
        >
          <iconify-icon icon="lucide:message-circle"></iconify-icon>
        </button>
      </div>
    `;
  }
}
