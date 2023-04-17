import { ContextDefaultState, MessageContext } from 'vk-io';
import Classes from '../../modules/Classes';
import MessageStatistics from '../../modules/MessageStatistics';
import Schedule from '../../modules/Schedule';
import VkService from '../../modules/VK';
import ChatGPT from '../../modules/ChatGPT';
import { CommandOutputData } from '../Commands';

export type EventInputData = {
  vk: VkService
  vkUser: VkService
  classes: Classes
  commands: CommandOutputData[]
  statistics: MessageStatistics
  schedule: Schedule
  chatGPT: ChatGPT
  message?: MessageContext<ContextDefaultState>
};

export type EventOutputData = {
  name: string
  disabled: boolean
  executeProbability: number
  execute: ({ vk, classes, commands, schedule, statistics, vkUser, message }: EventInputData) => Promise<void>
};
