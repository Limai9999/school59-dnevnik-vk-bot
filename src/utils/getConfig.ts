import Config from '../modules/Config';

import {VKConfig} from '../types/Configs/VKConfig';
import {MongoConfig} from '../types/Configs/MongoConfig';
import {MainConfig} from '../types/Configs/MainConfig';
import {EventConfig} from '../types/Configs/EventConfig';

export function getVKConfig(): VKConfig {
  return new Config('vk.json').getData();
};

export function getMongoDBConfig(): MongoConfig {
  return new Config('mongodb.json').getData();
};

export function getMainConfig(): MainConfig {
  return new Config('main.json').getData();
};

export function getEventConfig(): EventConfig {
  return new Config('event.json').getData();
};
