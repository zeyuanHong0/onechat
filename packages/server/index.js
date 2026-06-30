import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.post('/chat', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const text =
    '你好，很高兴认识你！这是一个流式输出示例。你好，很高兴认识你！这是一个流式输出示例。你好，很高兴认识你！这是一个流式输出示例。';

  let index = 0;

  const timer = setInterval(() => {
    if (index >= text.length) {
      res.write('data: [DONE]\n\n');
      clearInterval(timer);
      res.end();
      return;
    }
    res.write(`data: ${text[index++]}\n\n`);
  }, 50);

  req.on('close', () => {
    clearInterval(timer);
  });
});

app.listen(3100, () => {
  console.log('启动了');
});
