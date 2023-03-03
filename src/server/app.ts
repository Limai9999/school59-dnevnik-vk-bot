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

import chatRoutes from './routes/chat';
import subscriptionRoutes from './routes/subscription';

import { getServerConfig } from '../utils/getConfig';
const config = getServerConfig();

class Server {
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

  app: Express | null;

  constructor(vk: VK, classes: Classes, utils: Utils, netcityAPI: NetCityAPI, api: API, subscription: Subscription, statistics: MessageStatistics, event: Event, schedule: Schedule, grades: Grades) {
    this.vk = vk;
    this.classes = classes;
    this.statistics = statistics;
    this.event = event;
    this.schedule = schedule;
    this.grades = grades;
    this.utils = utils;
    this.netcityAPI = netcityAPI;
    this.api = api;
    this.subscription = subscription;

    this.app = null;
  }

  async run() {
    const app = express();

    app.locals = {
      vk: this.vk,
      classes: this.classes,
      statistics: this.statistics,
      event: this.event,
      schedule: this.schedule,
      grades: this.grades,
      utils: this.utils,
      netcityAPI: this.netcityAPI,
      api: this.api,
      subscription: this.subscription,
    };

    // Middleware
    app.use(express.json());
    app.use(cors());

    // Routes
    app.use('/api/chat', chatRoutes);
    app.use('/api/subscription', subscriptionRoutes);

    // Start server
    app.listen(config.port, () => {
      console.log(`API бота запущен на порту ${config.port}`);
    });

    return app;
  }
}

export default Server;