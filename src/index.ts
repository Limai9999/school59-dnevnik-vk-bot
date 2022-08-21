import mongoose from 'mongoose';

import handleMessage from './handlers/handleMessage';

import Classes from './modules/Classes';
import VK from './modules/VK';

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

const vkConfig = getVKConfig();
const vk = new VK({
  config: vkConfig,
  classes,
});

async function start() {
  const bot = await vk.init();

  const commands = await getCommands();

  bot.updates.on('message_new', (message) => {
    handleMessage({message, vk: bot, classes, args: [], commands});
  });
}

start();
