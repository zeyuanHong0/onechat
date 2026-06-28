import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import 'iconify-icon';

@customElement('ai-chat')
export class AiChat extends LitElement {
  static styles = css`
    :host {
      --ai-chat-primary: #6366f1;
      --ai-chat-primary-hover: #4f46e5;
      --ai-chat-bg: #ffffff;
      --ai-chat-surface: #f8f9fa;
      --ai-chat-border: #e5e7eb;
      --ai-chat-text: #1f2937;
      --ai-chat-text-secondary: #6b7280;
      --ai-chat-user-bubble: linear-gradient(135deg, #6366f1, #8b5cf6);
      --ai-chat-ai-bubble: #f3f4f6;
      --ai-chat-ai-text: #1f2937;
      --ai-chat-code-bg: #1e1e2e;
      --ai-chat-code-text: #cdd6f4;
      --ai-chat-radius: 12px;
      --ai-chat-radius-sm: 8px;
      --ai-chat-font-size: 14px;
      --ai-chat-font-size-sm: 12px;
      --ai-chat-font-size-xs: 11px;
      --ai-chat-spacing: 16px;
      --ai-chat-spacing-sm: 8px;
      --ai-chat-spacing-xs: 4px;
      --ai-chat-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08);
      --ai-chat-container-width: 400px;
      --ai-chat-container-height: 600px;
    }

    .dark-theme {
      --ai-chat-bg: #0f0f14;
      --ai-chat-surface: #1a1a24;
      --ai-chat-border: #2a2a3a;
      --ai-chat-text: #e4e4e7;
      --ai-chat-text-secondary: #71717a;
      --ai-chat-user-bubble: linear-gradient(135deg, #6366f1, #7c3aed);
      --ai-chat-ai-bubble: #1e1e2e;
      --ai-chat-ai-text: #e4e4e7;
      --ai-chat-code-bg: #11111b;
      --ai-chat-code-text: #cdd6f4;
      --ai-chat-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.3);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .chat-widget {
      width: var(--ai-chat-container-width);
      height: var(--ai-chat-container-height);
      background: var(--ai-chat-bg);
      border-radius: 16px;
      box-shadow: var(--ai-chat-shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--ai-chat-border);
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

    .chat-header-toggle {
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
    }

    .chat-messsages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--ai-chat-surface);
    }

    .message-row {
      display: flex;
      gap: 10px;
      max-width: 100%;
    }

    .message-row.user {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .message-row.user .message-avatar {
      background: #e0e7ff;
      color: #4338ca;
    }

    .message-row.ai .message-avatar {
      background: var(--ai-chat-primary);
      color: #ffffff;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 78%;
    }

    .message-bubble {
      padding: 10px 14px;
      border-radius: var(--ai-chat-radius);
      font-size: var(--ai-chat-font-size);
      line-height: 1.55;
      word-break: break-word;
    }

    .message-row.user .message-bubble {
      background: var(--ai-chat-user-bubble);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-row.ai .message-bubble {
      background: var(--ai-chat-ai-bubble);
      color: var(--ai-chat-ai-text);
      border-bottom-left-radius: 4px;
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
      border: none;
      outline: none;
      font-size: var(--ai-chat-font-size);
      color: var(--ai-chat-text);
      background: transparent;
      font-family: inherit;
      line-height: 1.4;
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
      color: #ffffff;
    }
  `;

  render() {
    return html`
      <div class="chat-widget">
        <div class="chat-header">
          <div class="chat-header-left">
            <div class="chat-header-logo">
              <iconify-icon icon="lucide:bot"></iconify-icon>
            </div>
            <span class="chat-header-title">Ai Chat</span>
          </div>
          <div class="chat-header-toggle">
            <iconify-icon icon="lucide:sun"></iconify-icon>
          </div>
        </div>
        <div class="chat-messsages-container">
          <div class="message-row user">
            <div class="message-avatar">U</div>
            <div class="message-content">
              <div class="message-bubble">你好，请帮我介绍一下 TypeScript 。</div>
              <span class="message-time">09:00</span>
            </div>
          </div>
          <div class="message-row ai">
            <div class="message-avatar">A</div>
            <div class="message-content">
              <div class="message-bubble">
                TypeScript 是 JavaScript
                的超集，为代码提供了静态类型检查，能在编译时发现潜在的错误。
              </div>
              <span class="message-time">09:01</span>
            </div>
          </div>
          <div class="message-row user">
            <div class="message-avatar">U</div>
            <div class="message-content">
              <div class="message-bubble">你好，请帮我介绍一下 TypeScript 。</div>
              <span class="message-time">09:00</span>
            </div>
          </div>
          <div class="message-row ai">
            <div class="message-avatar">A</div>
            <div class="message-content">
              <div class="message-bubble">
                TypeScript 是 JavaScript
                的超集，为代码提供了静态类型检查，能在编译时发现潜在的错误。
              </div>
              <span class="message-time">09:01</span>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <input type="text" class="chat-input" placeholder="输入消息..." />
            <button class="input-send-btn">
              <iconify-icon icon="lucide:send-horizontal"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
