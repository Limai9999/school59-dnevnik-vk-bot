import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';

import { DefaultRequestData } from '../types/DefaultRequestData';

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

export default router;