import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import 'iconify-icon';
import type { Message } from './types';
import { aiChatStyles } from './styles';
import { handleCodeCopy, createMarkdownIt, initMermaid, renderMermaidNodes } from './markdown';

@customElement('ai-chat')
export class AiChat extends LitElement {
  static styles = aiChatStyles;

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

  protected willUpdate(changedProperties: PropertyValues) {
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

      const finalTarget = this.messages.find((item) => item.id === assistantId);
      if (finalTarget && finalTarget.status !== 'success' && finalTarget.status !== 'stopped') {
        this.updateMessageById(assistantId, { status: 'success' });
      }

      await this.updateComplete;
      await renderMermaidNodes(this.shadowRoot);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // 用户主动中断，保留已生成的内容
        const target = this.messages.find((item) => item.id === assistantId);
        if (target) {
          this.updateMessageById(assistantId, { status: 'stopped' });
        }
      } else {
        console.error(error);
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

  private md = createMarkdownIt();

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
    initMermaid(this.theme === 'dark' ? 'dark' : 'light');
  }

  private renderHeader() {
    return html`
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
    `;
  }

  private renderMessages() {
    return html`
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
    `;
  }

  private renderInputArea() {
    return html`
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
            class="input-send-btn ${this.isSending ? 'stop' : this.inputMessage ? '' : 'disabled'}"
            type="button"
            @click=${this.isSending ? this.stopMessage : this.sendMessage}
          >
            ${this.isSending
              ? html`<iconify-icon icon="mdi:square"></iconify-icon>`
              : html`<iconify-icon icon="lucide:arrow-up"></iconify-icon>`}
          </button>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="chat-wrapper">
        <div class="chat-panel ${this.isOpen ? 'open' : ''}">
          ${this.renderHeader()} ${this.renderMessages()} ${this.renderInputArea()}
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
