import express from 'express';

import { verifyKey } from '../middlewares/verifyKey';

import { GetSessionListResponse } from '../types/Responses/GetSessionListResponse';
import { DefaultRequestData } from '../types/DefaultRequestData';

const router = express.Router();

router.get('/list', verifyKey, async (reqDef, res) => {
  try {
    const req = reqDef as DefaultRequestData;
    const { netcityAPI } = req.app.locals;

    const sessions: GetSessionListResponse = await netcityAPI.getSessions();

    res.json({ status: true, message: 'Список сессий', sessions });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;