import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';

import { DefaultRequestData } from '../types/DefaultRequestData';
import { GetChatInformationResponse } from '../types/Responses/GetChatInformationResponse';

import Password from '../../modules/Password';

const router = express.Router();

router.post('/information', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;

    const { chatId } = req.body as { chatId: number | null };
    if (!chatId) {
      return res.json({ status: false, message: 'Не передан chatId' });
    }

    const { vk, statistics, classes } = req.app.locals;

    const chatData = await vk.getChat(chatId);
    if (!chatData || !chatData.items.length || !chatData.items[0].chat_settings) {
      return res.json({ status: false, message: 'Не удалось получить информацию о чате.' });
    }

    const { peer, chat_settings } = chatData.items[0];
    const classData = await classes.getClass(peer.id);

    const savedMessages = await statistics.getMessagesCount(peer.id);
    const lastMessage = await statistics.getLastMessageText(peer.id);
    const owner = await vk.getUser(chat_settings.owner_id);
    const className = classData.className;

    let password: string | null = '';

    const netCityData = !classData.netCityData ? { login: null, password: null } : classData.netCityData;

    try {
      password = new Password(netCityData.password!, true).decrypt();
    } catch (error) {
      password = netCityData.password;
    }

    const netcity: GetChatInformationResponse['netcity'] = {
      login: netCityData.login,
      password,
    };

    const information: GetChatInformationResponse = {
      peerId: peer.id,
      membersCount: chat_settings.members_count,
      savedMessages,
      totalMessages: lastMessage.id,
      lastMessage: lastMessage.text,
      owner: owner!,
      className,
      netcity,
    };

    return res.json({ status: true, message: 'Получение информации о чате успешно', information });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.get('/list', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { vk, classes, utils } = req.app.locals;

    const chats = (await classes.getAllClasses()).filter((cls) => !utils.checkIfPeerIsDM(cls.id));

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