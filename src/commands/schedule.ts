import {CommandInputData, CommandOutputData} from '../types/Commands';

import {Keyboard} from 'vk-io';

import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';

import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';

export async function command({message, vk, classes, payload, schedule}: CommandInputData) {
  let loadingMessageID = 0;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, message.peerId);
  };

  const sendError = (errorMessage: string) => {
    removeLoadingMessage();
    return vk.sendMessage({
      message: errorMessage,
      peerId: message.peerId,
      priority: 'medium',
    });
  };

  try {
    const schedulePayload = payload as SchedulePayload;

    if (schedulePayload.data.action === 'get') {
      loadingMessageID = await vk.sendMessage({
        message: 'Поиск расписания начат, подождите...',
        peerId: message.peerId,
        priority: 'low',
      });

      const scheduleData = await schedule.get(message.peerId);
      if (!scheduleData.status) {
        return sendError(scheduleData.message! as string);
      }

      const parsedSchedule = scheduleData.message! as ParseScheduleResponse[];

      const totalFiles = parsedSchedule.length;

      const keyboard = Keyboard.builder()
          .inline();

      const filesString = parsedSchedule.map((schedule, index) => {
        const {filename, date} = schedule.message;

        keyboard.textButton({
          label: date,
          color: 'primary',
          payload: {
            command: 'schedule',
            data: {action: 'choose', scheduleIndex: index},
          } as SchedulePayload,
        });

        return `${index + 1} - ${filename}`;
      });

      removeLoadingMessage();
      vk.sendMessage({
        message: `Получено ${totalFiles} файлов с расписанием.\n\n${filesString.join('\n')}`,
        peerId: message.peerId,
        priority: 'low',
        keyboard,
      });
    } else if (schedulePayload.data.action === 'choose') {
      const index = schedulePayload.data.scheduleIndex!;

      const classData = await classes.getClass(message.peerId);
      const scheduleData: ParseScheduleResponse = classData.schedule[index] as ParseScheduleResponse;

      if (!scheduleData) {
        return sendError('Произошла неизвестная ошибка, либо выбранного расписания нет.');
      }

      const {date, schedule, totalLessons, startTime, filename} = scheduleData.message;

      vk.sendMessage({
        message: `Расписание на ${date}\n\nВсего уроков: ${totalLessons}, начинаются в ${startTime}.\n\n${schedule.join('\n')}\n\n${filename}`,
        peerId: message.peerId,
        priority: 'medium',
      });
    }
  } catch (error) {
    console.log('Ошибка при отправке расписания', error);
    sendError(`При получении расписания произошла ошибка:\n${error}`);
  }
};

const cmd: CommandOutputData = {
  name: 'расписание',
  aliases: ['получить расписание', 'schedule', 'рсп'],
  description: 'получить расписание уроков',
  payload: 'schedule',
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
