import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';
import { DefaultRequestData } from '../types/DefaultRequestData';
import { SubscriptionData } from '../../types/Subscription/SubscriptionData';

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

router.post('/add', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;

    const { link, days } = req.body as { link: string, days: string };

    if (!link || !days) {
      return res.json({ status: false, message: 'Не передан link или days' });
    }

    const { vk, subscription, utils } = req.app.locals;

    const username = utils.formatLinkToUsername(link);

    const user = await vk.getUser(username);
    if (!user) {
      return res.json({ status: false, message: 'Такого пользователя не существует' });
    }

    const endDate = Date.now() + 1000 * 60 * 60 * 24 * parseInt(days);
    const subscriptionData: SubscriptionData = { peerId: user.id, active: true, endDate };

    const newSubscription = await subscription.updateSubscription(user.id, subscriptionData, true);

    return res.json({ status: true, message: 'Подписка успешно добавлена', subscription: newSubscription, user });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.post('/remove', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;

    const { peerId } = req.body as { peerId: number };
    if (!peerId) {
      return res.json({ status: false, message: 'Не передан peerId' });
    }

    const { vk, subscription } = req.app.locals;

    const user = await vk.getUser(peerId);
    if (!user) {
      return res.json({ status: false, message: 'Такого пользователя не существует' });
    }

    const subscriptionData: SubscriptionData = { peerId, active: false, endDate: 0 };
    const newSubscription = await subscription.updateSubscription(peerId, subscriptionData, true);

    return res.json({ status: true, message: 'Подписка успешно убрана', subscription: newSubscription, user });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;