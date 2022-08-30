import {getEventConfig} from '../utils/getConfig';

import getEvents from '../utils/getEvents';

import {MessageContext, ContextDefaultState} from 'vk-io';
import {EventConfig} from '../types/Configs/EventConfig';
import {CommandOutputData} from '../types/Commands';
import {EventInputData, EventOutputData} from '../types/Event/Events';
import VkService from './VK';
import Classes from './Classes';
import MessageStatistics from './MessageStatistics';

class Event {
  config: EventConfig;
  events: EventOutputData[];

  vk: VkService;
  vkUser: VkService;
  classes: Classes;
  commands: CommandOutputData[];
  statistics: MessageStatistics;

  constructor({vk, vkUser, classes, commands, statistics}: EventInputData) {
    this.config = getEventConfig();
    this.events = [];

    this.vk = vk;
    this.vkUser = vkUser;
    this.classes = classes;
    this.commands = commands;
    this.statistics = statistics;
  }

  async init() {
    this.events = await getEvents();
  }

  async executeRandomEvent(message: MessageContext<ContextDefaultState>) {
    if (!this.executeRoulette() || message.isDM) return;

    const random = Math.random();
    const passedEvents = this.events.filter((event) => random < event.executeProbability && !event.disabled);
    if (!passedEvents.length) return;

    const shuffledPassedEvents: EventOutputData[] = this.shuffle(passedEvents);
    const event = shuffledPassedEvents[Math.floor(Math.random() * shuffledPassedEvents.length)];

    try {
      console.log(`Выполняется ивент ${event.name}`);

      await event.execute({
        vk: this.vk,
        vkUser: this.vkUser,
        classes: this.classes,
        commands: this.commands,
        statistics: this.statistics,
        message,
      });

      console.log(`Ивент ${event.name} успешно выполнился.`);
    } catch (error) {
      console.log(`Произошла ошибка при выполнении ивента ${event.name}`, error);
    }
  }

  executeRoulette(): boolean {
    const {enabled, generalRandom} = this.config;

    if (!enabled) return false;

    return Math.random() < generalRandom;
  }

  shuffle(array: any[]) {
    let currentIndex = array.length;
    let randomIndex = 0;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }
}

export default Event;
