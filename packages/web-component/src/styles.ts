import { css, unsafeCSS } from 'lit';
import type { CSSResultGroup } from 'lit';

// 外部 CSS import（原第 8-13 行）
import githubMarkdownLightCss from 'github-markdown-css/github-markdown-light.css?inline';
import githubMarkdownDarkCss from 'github-markdown-css/github-markdown-dark.css?inline';
import hljsLightCss from 'highlight.js/styles/github.css?inline';
import hljsDarkCss from 'highlight.js/styles/github-dark.css?inline';
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

// 导出样式数组
export const aiChatStyles: CSSResultGroup = [
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

      /* mermaid 图表容器 */
      .markdown-body .mermaid-wrapper {
        width: 100%;
        margin: 0.6em 0;
        border-radius: var(--ai-chat-radius-sm);
        border: 1px solid var(--ai-chat-border);
        overflow: hidden;
        background: transparent;
      }
      .markdown-body .mermaid-header {
        padding: 6px 12px;
        background: var(--ai-chat-code-block-bg);
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--ai-chat-border);
        user-select: none;
      }
      .markdown-body .mermaid-label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        font-weight: 500;
        color: var(--ai-chat-text-secondary);
        letter-spacing: 0.02em;
      }
      .markdown-body .mermaid-label .mermaid-icon {
        font-size: 13px;
        opacity: 0.7;
      }
      .markdown-body .mermaid-body {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px 12px;
        overflow-x: auto;
      }
      .markdown-body .mermaid {
        background: transparent;
        display: flex;
        justify-content: center;
      }
      .markdown-body .mermaid svg {
        max-width: 100%;
        height: auto;
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
