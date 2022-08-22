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
  classes: Classes;
  commands: CommandOutputData[];
  statistics: MessageStatistics;

  constructor({vk, classes, commands, statistics}: EventInputData) {
    this.config = getEventConfig();
    this.events = [];

    this.vk = vk;
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
    const passedEvents = this.events.filter((event) => random < event.executeProbability);
    if (!passedEvents.length) return;

    const event = passedEvents[Math.floor(Math.random() * passedEvents.length)];

    event.execute({
      vk: this.vk,
      classes: this.classes,
      commands: this.commands,
      statistics: this.statistics,
      message,
    });
  }

  executeRoulette(): boolean {
    const {enabled, generalRandom} = this.config;

    if (!enabled) return false;

    return Math.random() < generalRandom;
  }
}

export default Event;
