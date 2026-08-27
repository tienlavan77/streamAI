import express from 'express';

import conversationRouter from './conversation.js';
import browserRouter from './browser.js';

const router = express.Router();

router.get('/', (req, res) => {
   res.json({
      status: 'ok',
      message: 'uniSteamAi server đang hoạt động'
   });
});

router.use('/api', conversationRouter);
router.use('/browser', browserRouter);

export default router;