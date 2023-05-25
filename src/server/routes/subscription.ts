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

    const { link, days, isAddingDays } = req.body as { link: string, days: string, isAddingDays: boolean };

    if (!link || !days) {
      return res.json({ status: false, message: 'Не передан link или days' });
    }

    const { vk, subscription, utils } = req.app.locals;

    const username = utils.formatLinkToUsername(link);

    const user = await vk.getUser(username);
    if (!user) {
      return res.json({ status: false, message: 'Такого пользователя не существует' });
    }

    if (isAddingDays) {
      const newSubscription = await subscription.addDays(user.id, days);

      return res.json({ status: true, message: `Вы успешно добавили ${days} дней к подписке пользователя ${user.first_name} ${user.last_name}.`, subscription: newSubscription, user });
    } else {
      const endDate = Date.now() + 1000 * 60 * 60 * 24 * parseInt(days);
      const subscriptionData: SubscriptionData = { peerId: user.id, active: true, endDate };

      const newSubscription = await subscription.updateSubscription(user.id, subscriptionData, true);

      return res.json({ status: true, message: `Вы успешно выдали подписку пользователю ${user.first_name} ${user.last_name} на ${days} дней`, subscription: newSubscription, user });
    }
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

router.post('/remind', verifyKey, async (reqDef, res) => {
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

    const remindStatus = await subscription.remindForSubscription(peerId);

    return res.json({ status: remindStatus, message: remindStatus ? 'Успешное напоминание.' : 'Не удалось напомнить о продлении подписки.' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});


export default router;