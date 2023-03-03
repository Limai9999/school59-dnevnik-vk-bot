import { Application, Request } from 'express';

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

export type AppLocals = {
  vk: VK;
  classes: Classes;
  statistics: MessageStatistics;
  event: Event;
  schedule: Schedule;
  grades: Grades;
  utils: Utils;
  netcityAPI: NetCityAPI;
  api: API;
  subscription: Subscription;
}

interface ApplicationLocals extends Application {
  locals: AppLocals
}

export interface DefaultRequestData extends Request {
  app: ApplicationLocals
}