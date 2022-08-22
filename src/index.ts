import mongoose from 'mongoose';

import handleMessage from './handlers/handleMessage';

import Classes from './modules/Classes';
import VK from './modules/VK';
import MessageStatistics from './modules/MessageStatistics';
import Event from './modules/Event';

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

const vkConfig = getVKConfig();
const vk = new VK({
  config: vkConfig,
  classes,
});

async function start() {
  const bot = await vk.init();

  const commands = await getCommands();

  const events = new Event({
    vk,
    classes,
    commands,
    statistics,
  });
  await events.init();

  bot.updates.on('message_new', (message) => {
    handleMessage({message, vk, classes, args: [], commands, statistics, events});
  });
}

start();
