import {ContextDefaultState, MessageContext} from 'vk-io';
import Classes from '../../modules/Classes';
import MessageStatistics from '../../modules/MessageStatistics';
import VkService from '../../modules/VK';
import {CommandOutputData} from '../Commands';

export type EventInputData = {
  vk: VkService;
  classes: Classes;
  commands: CommandOutputData[];
  statistics: MessageStatistics;
  message?: MessageContext<ContextDefaultState>;
};

export type EventOutputData = {
  name: string;
  executeProbability: number;
  execute: ({}: EventInputData) => Promise<void>;
};
