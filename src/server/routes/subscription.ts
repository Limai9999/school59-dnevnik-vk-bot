import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';
import { DefaultRequestData } from '../types/DefaultRequestData';

const router = express.Router();

router.get('/list', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { vk, subscription } = req.app.locals;

    const subscriptions = await subscription.getSubscriptions();

    const chatsDataWithSubscription = await Promise.all(subscriptions.map(async (subscription) => {
      const chat = await vk.getChat(subscription.peerId);

      return { chat, subscription };
    }));

    return res.json({ status: true, message: 'Получен список подписок', chats: chatsDataWithSubscription });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;