import Classes from '../../modules/Classes';
import Utils from '../../modules/Utils';

import {VKConfig} from '../Configs/VKConfig';

export type VKSettings = {
  config: VKConfig
  classes: Classes
  utils: Utils
  token: string
  isUser: boolean
};
