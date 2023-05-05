import express from 'express';
import osu from 'node-os-utils';

import { verifyKey } from '../middlewares/verifyKey';

import { GetServerResourcesResponse } from '../types/Responses/GetServerResourcesResponse';

const router = express.Router();

router.get('/ping', verifyKey, async (reqDef, res) => {
  try {
    res.json({ status: true, message: 'Всё в порядке' });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

router.get('/serverResources', verifyKey, async (reqDef, res) => {
  try {
    const { cpu, mem } = osu;

    const cpuUsage = await cpu.usage();
    const cpuThreads = cpu.count();
    const cpuModel = cpu.model();

    const { totalMemMb, usedMemMb } = await mem.info();

    const resources: GetServerResourcesResponse = {
      cpu: {
        usage: cpuUsage,
        threads: cpuThreads,
        model: cpuModel,
      },
      memory: {
        total: totalMemMb,
        usage: usedMemMb,
      },
    };

    res.json({ status: true, message: 'Информация о сервере', resources });
  } catch (error) {
    console.log(error);
    return res.json({ status: false, message: 'Ошибка сервера' });
  }
});

export default router;