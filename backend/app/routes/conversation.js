import express from 'express';
import ConversationController from '../controllers/ConversationController.js';

const router = express.Router();

router.post(
   '/save-conversation',
   ConversationController.save
);

router.get(
   '/conversations',
   ConversationController.index
);

router.get(
   '/conversations/:requestId',
   ConversationController.show
);
router.post(
   '/conversations/chat',
   ConversationController.chat
);
export default router;