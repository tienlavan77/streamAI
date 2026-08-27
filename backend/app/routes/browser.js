import express from 'express';
import { BrowserController } from '../controllers/BrowserController.js';

const router = express.Router();

router.post('/open', BrowserController.open);
router.post('/close', BrowserController.close);
router.get('/launch', BrowserController.launch);
router.get('/status', BrowserController.status);
router.get('/content', BrowserController.content);
router.get('/pages', BrowserController.pages);

export default router;