import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const providers = {
  mimo: {
    apiKey: process.env.MIMO_API_KEY,
    baseURL: process.env.MIMO_BASE_URL,
    model: process.env.MIMO_MODEL,
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL,
    model: process.env.DEEPSEEK_MODEL,
  },
};

const clients = {};
for (const [name, cfg] of Object.entries(providers)) {
  if (cfg.apiKey && cfg.baseURL) {
    clients[name] = new OpenAI({
      apiKey: cfg.apiKey,
      baseURL: cfg.baseURL,
    });
  }
}

// 读取 ./markdown下面的test.md文件内容
const markdownPath = path.join(__dirname, './markdown/test.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

app.post('/chat', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const text = markdownContent;
  const STEP = 20;
  let index = 0;

  const timer = setInterval(() => {
    if (index >= text.length) {
      res.write('data: [DONE]\n\n');
      clearInterval(timer);
      res.end();
      return;
    }
    const chunk = text.slice(index, index + STEP);
    index += STEP;
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }, 50);

  req.on('close', () => {
    clearInterval(timer);
  });
});

app.post('/aichat', express.json(), async (req, res) => {
  const { ai, messages } = req.body;

  if (!ai || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: '缺少必要参数: ai 或 messages' });
    return;
  }

  const client = clients[ai];
  if (!client) {
    res.status(400).json({ error: 'Model not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 客户端断开检测
  let aborted = false;
  res.on('close', () => {
    aborted = true;
  });

  // 超时
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const completion = await client.chat.completions.create(
      {
        model: providers[ai].model,
        messages,
        stream: true,
      },
      { signal: controller.signal },
    );

    for await (const chunk of completion) {
      if (aborted) break;
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify(content)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('AI 请求失败:', err.message);
    if (!aborted) {
      console.error('AI 请求失败:', err.message);
      res.write(`data: ${JSON.stringify('[错误] ' + err.message)}\n\n`);
      res.write('data: [DONE]\n\n');
    }
  } finally {
    clearTimeout(timeout);
    res.end();
  }
});

app.listen(3100, () => {
  console.log('启动了');
});
