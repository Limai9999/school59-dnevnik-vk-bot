import {MessageContext, ContextDefaultState} from 'vk-io';

import VKService from '../modules/VK';
import Classes from '../modules/Classes';

import {Payload} from './VK/Payloads/Payload';
import MessageStatisticsService from '../modules/MessageStatistics';
import Event from '../modules/Event';

export type CommandInputData = {
  vk: VKService;
  vkUser: VKService;
  classes: Classes;
  message: MessageContext<ContextDefaultState>;
  commands: CommandOutputData[];
  args: string[];
  payload?: Payload;
  statistics: MessageStatisticsService;
  events: Event;
};

export type CommandOutputData = {
  name: string;
  aliases: string[];
  payload: string,
  description: string | null;
  requirements: {
    admin: boolean;
    dmOnly: boolean;
    args: number;
  };
  showInAdditionalMenu: boolean;
  showInCommandsList: boolean;
  howToUse: string | null;
  execute: ({}: CommandInputData) => Promise<void>;
};
