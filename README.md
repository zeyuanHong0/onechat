# OneChat

> Add AI chat to any web project in minutes.

OneChat 是一个开箱即用、框架无关的 AI 聊天 Web Component。一行标签即可接入，内置 SSE 流式输出与富文本渲染（Markdown / 代码高亮 / Mermaid / KaTeX），你只需要提供一个后端接口。

## 特性一览

- **框架无关**：基于 Web Component（Lit），原生 HTML、Vue、React 均可直接使用
- **流式输出**：SSE 逐字渲染，支持中途中断
- **富文本渲染**：Markdown、代码高亮（含一键复制）、Mermaid 图表、KaTeX 公式
- **主题切换**：内置 light / dark 两种模式

> 组件的完整用法、API 属性、框架接入方式，详见 [`packages/web-component/README.md`](./packages/web-component/README.md)。

## 仓库结构

这是一个基于 npm workspaces 的 monorepo：

| 包 | 目录 | 说明 |
| --- | --- | --- |
| `onechat-web` | [`packages/web-component`](./packages/web-component) | 核心 AI 聊天 Web Component，对外发布的 npm 包 |
| `server` | [`packages/server`](./packages/server) | 后端接口参考实现（Express + OpenAI 兼容接口），演示 SSE 流式响应约定 |

## 本地开发

环境要求：Node.js >= 20，npm >= 10。

```bash
# 安装依赖（根目录执行，自动处理各 workspace）
npm install

# 启动组件开发服务（等价于 web-component 内的 vite dev）
npm run dev

# 构建组件产物
npm run build
```

## 在你的项目中使用

安装 npm 包后，导入即可使用自定义标签：

```bash
npm install onechat-web
```

```html
<script type="module">
  import 'onechat-web'
</script>

<ai-chat endpoint="/api/chat"></ai-chat>
```

或者无需构建，直接通过 CDN 用 `<script>` 标签引入（适合快速试用或纯静态页面）：

```html
<script src="https://unpkg.com/onechat-web@1"></script>

<ai-chat endpoint="/api/chat"></ai-chat>
```

Vue、React 的接入方式，CDN 的更多用法（ESM / jsdelivr / 版本锁定），以及 `endpoint` 等属性说明，见 [组件文档](./packages/web-component/README.md)。

## 后端接口

组件通过 `endpoint` 发起 `POST` 请求并消费 SSE 响应。接口约定与各语言实现示例见组件文档的「后端接口约定」章节，可运行的参考实现见 [`packages/server/index.js`](./packages/server/index.js)。

## 许可证

[MIT](https://opensource.org/licenses/MIT) License
