import express from 'express';

import Password from '../../modules/Password';

import { verifyKey } from '../middlewares/verifyKey';

import { DefaultRequestData } from '../types/DefaultRequestData';

import { GetUserInformationResponse } from '../types/Responses/GetUserInformationResponse';

const router = express.Router();

router.post('/information', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;

    const { userId } = req.body as { userId: number | null };
    if (!userId) {
      return res.json({ status: false, message: 'Не передан userId' });
    }

    const { vk, subscription, classes, netcityAPI } = req.app.locals;

    const classData = await classes.getClass(userId);
    const userData = await vk.getUser(userId);

    if (!userData) {
      return res.json({ status: false, message: 'Не удалось получить информацию о пользователе.' });
    }

    const className = classData.className;
    let password: string | null = null;

    const netCityData = !classData.netCityData ? { login: null, password: null } : classData.netCityData;

    try {
      password = new Password(netCityData.password!, true).decrypt();
    } catch (error) {
      password = netCityData.password;
    }

    const subscriptionData = await subscription.checkSubscription(userId, false);
    const netCitySession = await netcityAPI.getSessionByPeerId(userId);
    const realUserName = await vk.getRealUserName(userId);

    const information: GetUserInformationResponse = {
      user: userData,
      netcity: {
        login: netCityData.login,
        password,
        session: netCitySession || null,
      },
      className,
      subscription: subscriptionData,
      realUserName,
      schoolEndFeature: {
        survey9thClassStatus: classData.survey9thClassStatus,
        surveyGIAExams: classData.surveyGIAExams,
        hasEverBoughtSubscription: classData.hasEverBoughtSubscription,
      },
    };

    return res.json({ status: true, message: 'Получение информации о пользователе успешно', information });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.post('/send', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;

    const { userId, message } = req.body as { userId: number | null, message: string | null };
    if (!userId || !message) {
      return res.json({ status: false, message: 'Не передан userId или message' });
    }

    const { vk } = req.app.locals;

    await vk.sendMessage({
      peerId: userId,
      message,
    });

    return res.json({ status: true, message: 'Сообщение отправлено' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;