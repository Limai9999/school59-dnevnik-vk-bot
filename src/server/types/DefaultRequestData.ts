import { Application, Request } from 'express';

import { CommandOutputData } from '../../types/Commands';

import Classes from '../../modules/Classes';
import Utils from '../../modules/Utils';
import NetCityAPI from '../../modules/NetCityAPI';
import Subscription from '../../modules/Subscription';
import VK from '../../modules/VK';
import API from '../../modules/API';
import MessageStatistics from '../../modules/MessageStatistics';
import Event from '../../modules/Event';
import Schedule from '../../modules/Schedule';
import Grades from '../../modules/Grades';
import ChatGPT from '../../modules/ChatGPT';
import SchoolEndFeature from '../../modules/SchoolEndFeature';

export type AppLocals = {
  vk: VK
  classes: Classes
  statistics: MessageStatistics;
  events: Event
  schedule: Schedule
  grades: Grades
  utils: Utils
  netcityAPI: NetCityAPI
  api: API
  subscription: Subscription
  commands: CommandOutputData[]
  chatGPT: ChatGPT
  schoolEndFeature: SchoolEndFeature
}

export interface ApplicationLocals extends Application {
  locals: AppLocals
}

export interface DefaultRequestData extends Request {
  app: ApplicationLocals
}