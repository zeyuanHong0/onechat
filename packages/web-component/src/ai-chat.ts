import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { formatTime } from '../utils';

import 'iconify-icon';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createTime: number;
  status?: 'loading' | 'sending' | 'success' | 'error';
}

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
      --ai-chat-fab-size: 56px;
    }

    :host(.dark-theme) {
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
      width: 100%;
      min-height: 22px;
      max-height: 120px;
      border: none;
      outline: none;
      font-size: var(--ai-chat-font-size);
      color: var(--ai-chat-text);
      background: transparent;
      font-family: inherit;
      line-height: 1.4;
      overflow-y: auto;
      display: block;
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
  `;

  @property({ type: Boolean })
  darkTheme: boolean = false;

  private toggleTheme() {
    this.darkTheme = !this.darkTheme;
    if (this.darkTheme) {
      this.classList.add('dark-theme');
    } else {
      this.classList.remove('dark-theme');
    }
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
      createTime: Date.now(),
    },
    {
      id: '2',
      role: 'assistant',
      content:
        'TypeScript 是 JavaScript 的超集，为代码提供了静态类型检查，能在编译时发现潜在的错误。',
      createTime: Date.now(),
    },
    {
      id: '3',
      role: 'user',
      content: 'TypeScript 的主要特点有哪些？',
      createTime: Date.now(),
    },
    {
      id: '4',
      role: 'assistant',
      content:
        'TypeScript 的主要特点包括：\n1. 静态类型检查：在编译时检查类型错误，减少运行时错误。\n2. 类型注解：可以为变量、函数参数和返回值添加类型注解。\n3. 接口和类：支持面向对象编程，提供接口和类的概念。\n4. 模块化：支持 ES6 模块化语法，便于代码组织和复用。\n5. 丰富的工具支持：与主流编辑器和 IDE 集成，提供智能提示和重构功能。',
      createTime: Date.now(),
    },
    {
      id: '5',
      role: 'user',
      content: 'TypeScript 与 JavaScript 有什么区别？',
      createTime: Date.now(),
    },
    {
      id: '6',
      role: 'assistant',
      content:
        'TypeScript 是 JavaScript 的超集，主要区别在于：\n1. 类型系统：TypeScript 提供了静态类型检查，而 JavaScript 是动态类型语言。\n2. 编译过程：TypeScript 需要编译为 JavaScript 才能运行，而 JavaScript 可以直接在浏览器中运行。\n3. 语法扩展：TypeScript 引入了接口、枚举、泛型等语法特性，而这些在 JavaScript 中并不存在。',
      createTime: Date.now(),
    },
  ];

  @state()
  inputMessage: string = '';

  private handleInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.inputMessage = target.value;
  }

  private async scrollToBottom() {
    await this.updateComplete;
    this.shadowRoot?.querySelector('#bottom-anchor')?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.inputMessage.trim()) return;
      this.sendMessage();
    }
  }

  private isSending = false; // 防止重复发送消息

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
      createTime: now,
    };
    const assistantId = `${now}-assistant`;
    const loadingMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '正在思考中...',
      createTime: now + 1,
      status: 'loading',
    };
    this.messages = [...this.messages, userMessage, loadingMessage];
    this.inputMessage = '';
    this.scrollToBottom();

    try {
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
            const text = line.slice(6).trim();
            if (text === '[DONE]') {
              this.updateMessageById(assistantId, {
                status: 'success',
              });
            } else {
              answer += text;
              const index = this.messages.findIndex((item) => item.id === assistantId);
              if (index !== -1) {
                this.messages = [...this.messages];
                this.messages[index] = {
                  ...this.messages[index],
                  content: answer,
                  status: 'sending',
                };
              }
              this.scrollToBottom();
            }
          }
        }
      }
      const target = this.messages.find((item) => item.id === assistantId);
      if (target?.status !== 'success') {
        this.updateMessageById(assistantId, { status: 'success' });
      }
    } catch (error) {
      this.updateMessageById(assistantId, {
        status: 'error',
        content: '请求失败，请稍后重试.',
      });
    } finally {
      this.isSending = false;
      this.scrollToBottom();
    }
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
                title="切换主题"
              >
                ${this.darkTheme
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
          <div class="chat-messages-container">
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
                        : message.content}
                    </div>
                    <span class="message-time">${formatTime(new Date(message.createTime))}</span>
                  </div>
                </div>
              `,
            )}
            <!-- 底部锚点 -->
            <div id="bottom-anchor"></div>
          </div>
          <div class="chat-input-area">
            <div class="chat-input-wrapper">
              <textarea
                class="chat-input"
                placeholder=${this.placeholder}
                .value=${this.inputMessage}
                @input=${this.handleInputChange}
                @keydown=${this.handleKeyDown}
              ></textarea>
              <button
                class="input-send-btn ${this.inputMessage ? '' : 'disabled'}"
                type="button"
                ?disabled=${!this.inputMessage.trim()}
                @click=${this.sendMessage}
              >
                <iconify-icon icon="lucide:arrow-up"></iconify-icon>
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
