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

import {getVKConfig, getMongoDBConfig} from './utils/getConfig';
import getCommands from './utils/getCommands';

const {url} = getMongoDBConfig();
mongoose.connect(url, {}, (err) => {
  if (err) {
    console.log('Ошибка при подключении к Mongo DB:'.red, err);
    return process.exit(1);
  }

  console.log('Mongo DB подключено.'.green);
});

const classes = new Classes();
const statistics = new MessageStatistics();
const utils = new Utils();

const VKConfig = getVKConfig();

const vkBot = new VK({
  token: VKConfig.bot_token,
  config: VKConfig,
  classes,
  isUser: false,
});
const vkUser = new VK({
  token: VKConfig.user_token,
  config: VKConfig,
  classes,
  isUser: true,
});

const netcityAPI = new NetCityAPI(vkBot, classes, utils);

const schedule = new Schedule(vkBot, classes, netcityAPI);

async function start() {
  await vkBot.init();
  await vkUser.init();

  const allClasses = await classes.getAllClasses();
  await Promise.all(allClasses.map(async ({id}, index) => {
    await classes.setLoading(id, false);

    vkBot.addChatToState(id);

    await netcityAPI.startSessionAutoCreating(id, index + 1);
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
    handleMessage({message, vk: vkBot, vkUser, classes, args: [], commands, statistics, events, schedule, utils, netcityAPI});
  });
}

start();
