import { getEventConfig } from '../utils/getConfig';

import getEvents from '../utils/getEvents';

import { MessageContext, ContextDefaultState } from 'vk-io';
import { EventConfig } from '../types/Configs/EventConfig';
import { CommandOutputData } from '../types/Commands';
import { EventInputData, EventOutputData } from '../types/Event/Events';

import VkService from './VK';
import Classes from './Classes';
import MessageStatistics from './MessageStatistics';
import Schedule from './Schedule';
import ChatGPT from './ChatGPT';

class Event {
  config: EventConfig;
  events: EventOutputData[];

  vk: VkService;
  vkUser: VkService;
  classes: Classes;
  commands: CommandOutputData[];
  statistics: MessageStatistics;
  schedule: Schedule;
  chatGPT: ChatGPT;

  state: {
    lastExecutedDate: number
    lastExecutedEvent: EventOutputData | null
    receivedMessagesCountWithoutEventReply: number
  };

  constructor({ vk, vkUser, classes, commands, statistics, schedule, chatGPT }: EventInputData) {
    this.config = getEventConfig();
    this.events = [];

    this.vk = vk;
    this.vkUser = vkUser;
    this.classes = classes;
    this.commands = commands;
    this.statistics = statistics;
    this.schedule = schedule;
    this.chatGPT = chatGPT;

    this.state = {
      lastExecutedDate: 0,
      lastExecutedEvent: null,
      receivedMessagesCountWithoutEventReply: 0,
    };
  }

  async init() {
    this.events = await getEvents();
  }

  async executeEventByName(message: MessageContext<ContextDefaultState>, eventName: string): Promise<boolean> {
    const event = this.events.find((evt) => evt.name === eventName);
    if (!event) return false;

    console.log(`Выполняется ивент ${event.name} (запущено вручную)`.yellow);

    try {
      await event.execute({
        vk: this.vk,
        vkUser: this.vkUser,
        classes: this.classes,
        commands: this.commands,
        statistics: this.statistics,
        schedule: this.schedule,
        chatGPT: this.chatGPT,
        message,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async executeRandomEvent(message: MessageContext<ContextDefaultState>) {
    if (message.isDM) return;

    // console.log('event state', this.state.lastExecutedDate, this.state.lastExecutedEvent, this.state.receivedMessagesCountWithoutEventReply);

    if (!this.executeRoulette()) return;

    const lastExecutedEvent = this.state.lastExecutedEvent;

    const random = this.state.receivedMessagesCountWithoutEventReply >= 20 ? 0 : Math.random();
    const passedEvents = this.events.filter((event) => random < event.executeProbability && !event.disabled && event.name !== lastExecutedEvent?.name);

    if (!passedEvents.length) {
      this.state.receivedMessagesCountWithoutEventReply++;
      return;
    }

    const shuffledPassedEvents: EventOutputData[] = this.shuffle(passedEvents);
    const event = shuffledPassedEvents[Math.floor(Math.random() * shuffledPassedEvents.length)];

    try {
      console.log(`Выполняется ивент ${event.name}`.yellow);

      this.state.lastExecutedDate = Date.now();
      this.state.lastExecutedEvent = event;
      this.state.receivedMessagesCountWithoutEventReply = 0;

      await event.execute({
        vk: this.vk,
        vkUser: this.vkUser,
        classes: this.classes,
        commands: this.commands,
        statistics: this.statistics,
        schedule: this.schedule,
        chatGPT: this.chatGPT,
        message,
      });

      console.log(`Ивент ${event.name} успешно выполнился.`.green);
    } catch (error) {
      console.log(`Произошла ошибка при выполнении ивента ${event.name}`.red, error);
    }
  }

  executeRoulette(): boolean {
    const { enabled, generalRandom } = this.config;
    if (!enabled) return false;

    const lastExecutedDifference = Date.now() - this.state.lastExecutedDate;
    if (lastExecutedDifference < 1000 * 30) return false;

    let willBeExecuted = Math.random() < generalRandom;

    if (!willBeExecuted) {
      this.state.receivedMessagesCountWithoutEventReply++;

      if (this.state.receivedMessagesCountWithoutEventReply >= 20) willBeExecuted = true;
    }

    return willBeExecuted;
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
