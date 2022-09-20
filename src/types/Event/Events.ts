import {ContextDefaultState, MessageContext} from 'vk-io';
import Classes from '../../modules/Classes';
import MessageStatistics from '../../modules/MessageStatistics';
import Schedule from '../../modules/Schedule';
import VkService from '../../modules/VK';
import {CommandOutputData} from '../Commands';

export type EventInputData = {
  vk: VkService
  vkUser: VkService
  classes: Classes
  commands: CommandOutputData[]
  statistics: MessageStatistics
  schedule: Schedule
  message?: MessageContext<ContextDefaultState>
};

export type EventOutputData = {
  name: string
  disabled: boolean
  executeProbability: number
  execute: ({}: EventInputData) => Promise<void>
};
