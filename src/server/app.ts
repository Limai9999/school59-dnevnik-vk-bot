import express, { Express } from 'express';
import cors from 'cors';

import Classes from '../modules/Classes';
import Utils from '../modules/Utils';
import NetCityAPI from '../modules/NetCityAPI';
import Subscription from '../modules/Subscription';
import VK from '../modules/VK';
import API from '../modules/API';
import MessageStatistics from '../modules/MessageStatistics';
import Event from '../modules/Event';
import Schedule from '../modules/Schedule';
import Grades from '../modules/Grades';
import ChatGPT from '../modules/ChatGPT';
import { CommandOutputData } from '../types/Commands';
import SchoolEndFeature from '../modules/SchoolEndFeature';

import chatRoutes from './routes/chat';
import subscriptionRoutes from './routes/subscription';
import userRoutes from './routes/user';
import schoolEndFeatureRoutes from './routes/schoolEndFeature';
import utilsRoutes from './routes/utils';

import { AppLocals, ApplicationLocals } from './types/DefaultRequestData';

import { getServerConfig } from '../utils/getConfig';
const config = getServerConfig();

class Server {
  vk: VK;
  classes: Classes;
  statistics: MessageStatistics;
  events: Event;
  schedule: Schedule;
  grades: Grades;
  utils: Utils;
  netcityAPI: NetCityAPI;
  api: API;
  subscription: Subscription;
  chatGPT: ChatGPT;
  commands: CommandOutputData[];
  schoolEndFeature: SchoolEndFeature;

  app: Express | null;

  constructor({ vk, classes, utils, netcityAPI, api, subscription, statistics, events, schedule, grades, chatGPT, commands, schoolEndFeature }: AppLocals) {
    this.vk = vk;
    this.classes = classes;
    this.statistics = statistics;
    this.events = events;
    this.schedule = schedule;
    this.grades = grades;
    this.utils = utils;
    this.netcityAPI = netcityAPI;
    this.api = api;
    this.subscription = subscription;
    this.chatGPT = chatGPT;
    this.commands = commands;
    this.schoolEndFeature = schoolEndFeature;

    this.app = null;
  }

  async run() {
    const app = express() as unknown as ApplicationLocals;

    app.locals = {
      vk: this.vk,
      classes: this.classes,
      statistics: this.statistics,
      events: this.events,
      schedule: this.schedule,
      grades: this.grades,
      utils: this.utils,
      netcityAPI: this.netcityAPI,
      api: this.api,
      subscription: this.subscription,
      chatGPT: this.chatGPT,
      commands: this.commands,
      schoolEndFeature: this.schoolEndFeature,
    };

    // Middleware
    app.use(express.json());
    app.use(cors());

    // Routes
    app.use('/api/chat', chatRoutes);
    app.use('/api/subscription', subscriptionRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/schoolEndFeature', schoolEndFeatureRoutes);
    app.use('/api/utils', utilsRoutes);

    // Start server
    app.listen(config.port, () => {
      console.log(`API бота запущен на порту ${config.port}`);
    });

    return app;
  }
}

export default Server;