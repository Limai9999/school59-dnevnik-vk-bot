import {CommandInputData, CommandOutputData} from '../types/Commands';

import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';

export async function command({message, vk, classes, payload}: CommandInputData) {
  const schedulePayload = payload as SchedulePayload;

  vk.sendMessage({
    message: `Извини, получить расписание сейчас не получится. ${schedulePayload.data.action}`,
    peerId: message.peerId,
    priority: 'low',
  });
};

const cmd: CommandOutputData = {
  name: 'расписание',
  aliases: ['получить расписание', 'get schedule'],
  description: 'получить расписание уроков',
  payload: 'schedule',
  requirements: {
    admin: false,
    args: 0,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
