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

    const { vk, subscription, classes } = req.app.locals;

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

    const netcity: GetUserInformationResponse['netcity'] = {
      login: netCityData.login,
      password,
    };

    const subscriptionData = await subscription.checkSubscription(userId, false);

    const information: GetUserInformationResponse = {
      user: userData,
      netcity,
      className,
      subscription: subscriptionData,
    };

    return res.json({ status: true, message: 'Получение информации о пользователе успешно', information });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;