import {MessageContext, ContextDefaultState} from 'vk-io';

import VKService from '../modules/VK';
import Classes from '../modules/Classes';
import MessageStatisticsService from '../modules/MessageStatistics';
import Event from '../modules/Event';
import Schedule from '../modules/Schedule';
import Utils from '../modules/Utils';
import NetCityAPI from '../modules/NetCityAPI';
import Subscription from '../modules/Subscription';
import API from '../modules/API';

import {Payload} from './VK/Payloads/Payload';

import {MainConfig} from './Configs/MainConfig';

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
  schedule: Schedule
  utils: Utils
  netcityAPI: NetCityAPI
  mainConfig: MainConfig
  subscription: Subscription
  api: API
};

export type CommandOutputData = {
  name: string;
  aliases: string[];
  payload: Payload,
  description: string | null;
  requirements: {
    admin: boolean;
    dmOnly: boolean;
    args: number;
    paidSubscription: boolean;
  };
  showInAdditionalMenu: boolean;
  showInCommandsList: boolean;
  howToUse: string | null;
  execute: ({}: CommandInputData) => Promise<any>;
};
