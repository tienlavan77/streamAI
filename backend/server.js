import express from 'express';
import cors from 'cors';

import router from './app/routes/index.js';

const app = express();

const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(router);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Server đang chạy tại http://0.0.0.0:${PORT}`);
});