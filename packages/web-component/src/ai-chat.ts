import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ai-chat')
export class AiChat extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .container {
      width: 360px;
      height: 600px;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 16px;
      box-sizing: border-box;
    }
  `;

  @property({ type: String }) name = '哲理源';

  render() {
    return html` <div class="container">
      <h2>OneChat</h2>
      <p>Hello, ${this.name}</p>
    </div>`;
  }
}
