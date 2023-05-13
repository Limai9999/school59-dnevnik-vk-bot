import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';

import { DefaultRequestData } from '../types/DefaultRequestData';
import { Keyboard } from 'vk-io';
import { SchedulePayload } from '../../types/VK/Payloads/SchedulePayload';

const router = express.Router();

router.post('/makeSurveyAbout9thClass', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { schoolEndFeature } = req.app.locals;

    const { peerId } = req.body as { peerId: number | null };
    if (!peerId) {
      return res.json({ status: false, message: 'Не передан peerId' });
    }

    schoolEndFeature.makeSurveyAbout9thClass(peerId);

    return res.json({ status: true, message: 'Опрос создан' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.post('/makeSurveyAboutGIAExams', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { schoolEndFeature } = req.app.locals;

    const { peerId } = req.body as { peerId: number | null };
    if (!peerId) {
      return res.json({ status: false, message: 'Не передан peerId' });
    }

    schoolEndFeature.makeSurveyAboutExams(peerId);

    return res.json({ status: true, message: 'Опрос создан' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.post('/getEndingMessage', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { schoolEndFeature } = req.app.locals;

    const { peerId } = req.body as { peerId: number | null };
    if (!peerId) {
      return res.json({ status: false, message: 'Не передан peerId' });
    }

    const endingMessage = await schoolEndFeature.makeEndingMessage(peerId);
    if (!endingMessage.status) {
      return res.json({ status: false, message: endingMessage.error });
    }

    return res.json({ status: true, message: 'Конечное сообщение успешно создано', endingMessage: endingMessage.message! });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.post('/sendEndingMessage', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { classes, vk } = req.app.locals;

    const { peerId, message } = req.body as { peerId: number | null, message: string | null };
    if (!peerId || !message) {
      return res.json({ status: false, message: 'Не передан peerId или message' });
    }

    await classes.setEndingMessage(peerId, message);

    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: 'Открыть',
        color: Keyboard.POSITIVE_COLOR,
        payload: { command: 'schedule', data: { action: 'choose', filename: 'schoolEndFeature', type: 'manual' } } as SchedulePayload,
      });

    await vk.sendMessage({
      message: 'Добавился новый файл с расписанием на 1 июня.',
      peerId,
      keyboard,
    });

    return res.json({ status: true, message: 'Конечное сообщение успешно отправлено в виде нового файла с расписанием' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.post('/setHasEverBoughtSubscription', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { schoolEndFeature } = req.app.locals;

    const { peerId, hasEverBoughtSubscription } = req.body as { peerId: number | null, hasEverBoughtSubscription: boolean | null | undefined };
    if (!peerId || (typeof hasEverBoughtSubscription !== 'boolean')) {
      return res.json({ status: false, message: 'Не передан peerId или hasEverBoughtSubscription' });
    }

    await schoolEndFeature.setHasEverBoughtSubscription(peerId, hasEverBoughtSubscription);

    return res.json({ status: true, message: 'Статус изменен.' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;