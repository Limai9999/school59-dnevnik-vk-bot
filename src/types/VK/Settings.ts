import Classes from '../../modules/Classes';

import {VKConfig} from '../Configs/VKConfig';

export type Settings = {
  config: VKConfig
  classes: Classes
  token: string
  isUser: boolean
};
