import { Response, NextFunction, Request } from 'express';

import { getServerConfig } from '../../utils/getConfig';
const config = getServerConfig();

export const verifyKey = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || authorization !== config.secretKey) {
    return res.json({ status: false, message: 'Неверный секретный ключ.' });
  }

  next();
};
