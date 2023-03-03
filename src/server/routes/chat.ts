import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';
import { DefaultRequestData } from '../types/DefaultRequestData';

const router = express.Router();

router.get('/information', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;

    const { chatId } = req.body as { chatId: number | null };
    if (!chatId) {
      return res.json({ status: false, message: 'Не передан chatId' });
    }

    const { vk } = req.app.locals;

    const chatData = await vk.getChat(chatId);
    if (!chatData) {
      return res.json({ status: false, message: 'Не удалось получить информацию о чате.' });
    }

    return res.json({ status: true, message: 'Получение информации о чате успешно', chat: chatData });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.get('/list', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { vk, classes } = req.app.locals;

    const chats = await classes.getAllClasses();

    const chatList = await Promise.all(chats.map(async (chat) => {
      const chatData = await vk.getChat(chat.id);
      if (!chatData) return;

      return chatData;
    }));

    return res.json({ status: true, message: 'Получение информации о чатах успешно', chatList });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;