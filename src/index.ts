import mongoose from 'mongoose';

import handleMessage from './handlers/handleMessage';

import Classes from './modules/Classes';
import VK from './modules/VK';
import MessageStatistics from './modules/MessageStatistics';
import Event from './modules/Event';
import Schedule from './modules/Schedule';

import {getVKConfig, getMongoDBConfig} from './utils/getConfig';
import getCommands from './utils/getCommands';

const {url} = getMongoDBConfig();
mongoose.connect(url, {}, (err) => {
  if (err) {
    console.log('Ошибка при подключении к Mongo DB:', err);
    return process.exit(1);
  }

  console.log('Mongo DB подключено.');
});

const classes = new Classes();
const statistics = new MessageStatistics();

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

const schedule = new Schedule(vkBot, classes);

async function start() {
  const bot = await vkBot.init();
  await vkUser.init();

  const allClasses = await classes.getAllClasses();
  allClasses.map(({id}) => {
    vkBot.addChatToState(id);
  });

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

  bot.updates.on('message_new', (message) => {
    handleMessage({message, vk: vkBot, vkUser, classes, args: [], commands, statistics, events, schedule});
  });
}

start();
