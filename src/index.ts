import 'colors';

import mongoose from 'mongoose';

import 'moment/locale/ru';

import handleMessage from './handlers/handleMessage';

import Classes from './modules/Classes';
import VK from './modules/VK';
import MessageStatistics from './modules/MessageStatistics';
import Event from './modules/Event';
import Schedule from './modules/Schedule';
import Utils from './modules/Utils';
import NetCityAPI from './modules/NetCityAPI';
import Subscription from './modules/Subscription';
import API from './modules/API';
import Grades from './modules/Grades';

import {getVKConfig, getMongoDBConfig, getMainConfig} from './utils/getConfig';
import getCommands from './utils/getCommands';

const {url} = getMongoDBConfig();
mongoose.connect(url, {}, (err) => {
  if (err) {
    console.log('Ошибка при подключении к Mongo DB:'.red, err);
    return process.exit(1);
  }

  console.log('Mongo DB подключено.'.green);
});

const mainConfig = getMainConfig();

const testNotice = mainConfig.testMode ? 'БОТ ЗАПУЩЕН В ТЕСТОВОМ РЕЖИМЕ'.bgRed : '';
console.log(testNotice);

const classes = new Classes();
const statistics = new MessageStatistics();
const utils = new Utils();
const api = new API();

const VKConfig = getVKConfig();

const vkBot = new VK({
  token: VKConfig.bot_token,
  config: VKConfig,
  utils,
  classes,
  isUser: false,
});
const vkUser = new VK({
  token: VKConfig.user_token,
  config: VKConfig,
  utils,
  classes,
  isUser: true,
});

const subscription = new Subscription(vkBot, classes, utils);

const netcityAPI = new NetCityAPI(vkBot, classes, utils, api, subscription);
const schedule = new Schedule(vkBot, classes, netcityAPI, utils, api, subscription);
const grades = new Grades(vkBot, classes, utils, netcityAPI, api, subscription);

async function start() {
  await vkBot.init();
  await vkUser.init();

  const allClasses = await classes.getAllClasses();
  await Promise.all(allClasses.map(async ({id}, index) => {
    await classes.setLoading(id, false);

    vkBot.addChatToState(id);

    await netcityAPI.startSessionAutoCreating(id, index + 1);
    await schedule.startAutoUpdate(id, index + 1);
    await grades.startAutoUpdate(id, index + 1);
  }));

  console.log(`Бот обрабатывает ${allClasses.length} чатов.`);

  const commands = await getCommands();

  const events = new Event({
    vk: vkBot,
    vkUser,
    classes,
    commands,
    statistics,
    schedule,
  });
  await events.init();

  console.log('\nБот запущен!'.green);

  vkBot.updates.on('message_new', (message) => {
    handleMessage({message, vk: vkBot, vkUser, classes, args: [], commands, statistics, events, schedule, utils, netcityAPI, mainConfig, subscription, api, grades});
  });
}

start();
