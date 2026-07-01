import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

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

app.listen(3100, () => {
  console.log('启动了');
});
