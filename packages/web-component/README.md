# OneChat Web Component

一个开箱即用、框架无关的 AI 聊天 Web Component。一行标签即可接入，内置 SSE 流式输出与富文本渲染，开发者只需关注后端接口。

## 功能特性

**内容渲染**

- Markdown 渲染（markdown-it）
- 代码高亮（highlight.js），带一键复制按钮
- Mermaid 图表渲染
- KaTeX 数学公式

**交互体验**

- SSE 流式逐字输出，支持中途中断（AbortController）
- 自适应输入框高度与自动滚动
- light / dark 主题切换

## 安装

```bash
npm install onechat-web-component
```

## 快速开始

通过 npm 安装后引入（推荐用于工程化项目）：

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import 'onechat-web-component'
  </script>
</head>
<body>
  <ai-chat endpoint="/api/chat"></ai-chat>
</body>
</html>
```

### 通过 CDN 引入（无需构建）

无需安装依赖，直接用 `<script>` 标签引入即可使用，适合快速试用或纯静态页面：

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/onechat-web-component@1"></script>
</head>
<body>
  <ai-chat endpoint="/api/chat"></ai-chat>
</body>
</html>
```

也可使用 ESM 方式，或将 CDN 换成 jsdelivr：

```html
<!-- ESM -->
<script type="module">
  import 'https://unpkg.com/onechat-web-component@1/dist/index.js'
</script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/onechat-web-component@1"></script>
```


## API 属性

| 属性名        | 类型                | 默认值             | 说明              |
| ------------- | ------------------- | ------------------ | ----------------- |
| `endpoint`    | `string`            | `''`               | 后端 SSE 接口地址 |
| `theme`       | `'light' \| 'dark'` | `'light'`          | 主题模式          |
| `title`       | `string`            | `'OneChat'`        | 聊天窗口标题      |
| `placeholder` | `string`            | `'有问题，尽管问'` | 输入框占位文本    |
| `isOpen`      | `boolean`           | `false`            | 聊天面板是否展开  |

## 框架接入

### Vue

在 `vite.config.ts` 中将 `ai-chat` 配置为自定义元素，即可直接在模板中使用：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'ai-chat',
        },
      },
    }),
  ],
})
```

```vue
<template>
  <ai-chat endpoint="/api/chat" />
</template>

<script setup>
import 'onechat-web-component'
</script>
```

### React

React 19+ 原生支持 Custom Element，直接 import 后即可使用：

```tsx
import 'onechat-web-component'

function App() {
  return <ai-chat endpoint="/api/chat" />
}
```

## 后端接口约定

组件通过 `endpoint` 属性指定的地址发起请求，基于 `packages/server/` 的参考实现说明如下：

- **请求方法**：`POST`
- **Content-Type**：`application/json`
- **请求体格式**：

```json
{
  "messages": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "你好！有什么可以帮你的吗？" }
  ]
}
```

- **响应格式**：SSE（Server-Sent Events）
  - 每条消息：`data: <JSON.stringify(内容)>\n\n`
  - 结束标志：`data: [DONE]\n\n`
- **参考实现**：[`packages/server/`](https://github.com/zeyuanHong0/onechat/blob/main/packages/server/index.js) 目录

> 服务端发送内容时须用 `JSON.stringify()` 转义，客户端接收后会用 `JSON.parse()` 还原。这样可避免 Markdown 中的换行符被 SSE 协议截断导致格式丢失。

### 后端代码示例

#### Node.js (Express)

```js
import express from 'express'
import OpenAI from 'openai'
import 'dotenv/config'

const app = express()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // 可替换为 DeepSeek、Mimo 等 OpenAI 兼容接口
})

app.post('/api/chat', express.json(), async (req, res) => {
  const { messages } = req.body

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // 客户端断开检测
  let aborted = false
  res.on('close', () => { aborted = true })

  // 调用 OpenAI 兼容接口（以 OpenAI SDK 为例）
  const completion = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    stream: true,
  })

  for await (const chunk of completion) {
    if (aborted) break
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      res.write(`data: ${JSON.stringify(content)}\n\n`)
    }
  }
  res.write('data: [DONE]\n\n')
  res.end()
})

app.listen(3000)
```

> 其他语言（Python、Java 等）按上方「后端接口约定」的 SSE 格式实现即可。

## 当前版本说明

当前版本聚焦核心对话体验，以下能力仍在规划中：

- 消息持久化：对话暂存于内存，刷新页面后清空
- 多会话管理：暂为单会话模式
- 框架专用封装：React / Vue 专用 wrapper 包规划中，现阶段可直接使用 Web Component

## 许可证

[MIT](https://opensource.org/licenses/MIT) License
