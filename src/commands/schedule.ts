import {CommandInputData, CommandOutputData} from '../types/Commands';

import {Keyboard} from 'vk-io';
import moment from 'moment';

moment.locale('ru');

import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';
import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';

export async function command({message, vk, classes, payload, schedule}: CommandInputData) {
  let loadingMessageID = 0;

  const peerId = message.peerId;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  const sendError = async (errorMessage: string) => {
    removeLoadingMessage();

    await classes.setLoading(peerId, false);

    const keyboard = Keyboard.builder()
        .inline()
        .textButton({
          label: 'Обновить расписание',
          color: Keyboard.NEGATIVE_COLOR,
          payload: {
            command: 'schedule',
            data: {action: 'update'},
          } as SchedulePayload,
        });

    return vk.sendMessage({
      message: errorMessage,
      peerId,
      priority: 'medium',
      keyboard,
    });
  };

  await classes.setLoading(peerId, true);

  try {
    const schedulePayload = payload as SchedulePayload;

    const maxFileLifeTime = 1000 * 60 * 60 * 24 * 2;

    if (schedulePayload.data.action === 'get' || schedulePayload.data.action === 'update') {
      const isForceUpdate = schedulePayload.data.action === 'update';

      loadingMessageID = await vk.sendMessage({
        message: 'Поиск расписания начат, подождите...',
        peerId,
        priority: 'low',
      });

      const scheduleData = await schedule.get(peerId, isForceUpdate);
      const {manualSchedule, netcitySchedule} = scheduleData;

      const keyboard = Keyboard.builder()
          .inline();

      let resultMessage = '';

      let totalNetcityFiles = 0;
      let totalManualFiles = 0;

      if (netcitySchedule.status) {
        const netcityFiles = netcitySchedule.message! as ParseScheduleResponse[];

        const netcityFilesStrings = netcityFiles.map((schedule, index) => {
          const isError = typeof schedule.message === 'string';

          let returningString = '';

          if (!isError) {
            const {filename, date} = schedule.message;

            keyboard.textButton({
              label: date,
              color: Keyboard.PRIMARY_COLOR,
              payload: {
                command: 'schedule',
                data: {action: 'choose', filename, type: 'netcity'},
              } as SchedulePayload,
            });

            returningString += `${index + 1} - ${filename}`;
          } else {
            returningString += `${index + 1} - Неизвестное расписание ❌`;

            console.log('Неизвестное расписание, ошибка:', schedule.message);
          }

          return returningString;
        });

        totalNetcityFiles = netcityFiles.length;

        const netcityFilesString = netcityFilesStrings.length ? `Скачано ${totalNetcityFiles} файлов с расписанием из объявлений Сетевого Города:\n${netcityFilesStrings.join('\n')}` : 'В объявлениях Сетевого Города расписания нет.';
        resultMessage += netcityFilesString;

        // const classData = await classes.getClass(message.peerId);
        // const lastUpdatedString = `\nОбновлено: ${moment(classData.lastUpdatedScheduleDate).fromNow()}`;
        // resultMessage += lastUpdatedString;
      } else {
        resultMessage += `При получении расписания из объявлений Сетевого Города произошла ошибка:\n${netcitySchedule.message}`;
      }

      const newestManualFiles = manualSchedule.filter((schedule) => Date.now() - schedule.message.creationTime < maxFileLifeTime);

      totalManualFiles = newestManualFiles.length;

      if (totalManualFiles) {
        keyboard.row();

        const manualFilesStrings = newestManualFiles.map((schedule, index) => {
          const {filename, date} = schedule.message;

          keyboard.textButton({
            label: date,
            color: Keyboard.SECONDARY_COLOR,
            payload: {
              command: 'schedule',
              data: {action: 'choose', filename, type: 'manual'},
            } as SchedulePayload,
          });

          return `${index + 1} - ${filename}`;
        });

        totalManualFiles = newestManualFiles.length;

        const manualFilesString = manualFilesStrings.length ? `\n\nФайлы, добавленные вручную:\n${manualFilesStrings.join('\n')}` : '';

        resultMessage += manualFilesString;
      }

      if (!totalNetcityFiles && !totalManualFiles) {
        if (message.isDM) return sendError('Расписания в Сетевом Городе нет.');
        return sendError('Расписания в Сетевом Городе нет, но вы можете попросить одного из админов этой беседы, чтобы он добавил файл с расписанием через личные сообщения бота.');
      }

      removeLoadingMessage();

      keyboard.row();
      keyboard.textButton({
        label: 'Обновить расписание',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {
          command: 'schedule',
          data: {action: 'update'},
        } as SchedulePayload,
      });

      vk.sendMessage({
        message: resultMessage,
        peerId,
        priority: 'medium',
        keyboard,
      });

      await classes.setLoading(peerId, false);
    } else if (schedulePayload.data.action === 'choose') {
      const classData = await classes.getClass(peerId);

      const arrayWithSchedule = schedulePayload.data.type === 'netcity' ? classData.schedule : classData.manualSchedule;
      const scheduleData = arrayWithSchedule.find((schedule) => schedule.message!.filename! === schedulePayload.data.filename!) as ParseScheduleResponse;

      if (!scheduleData) {
        return sendError('Произошла неизвестная ошибка, либо выбранного расписания нет.');
      }

      const {date, schedule, totalLessons, startTime, filename, creationTime} = scheduleData.message;

      const creationTimeString = (schedulePayload.data.type === 'netcity' ? 'Скачано: ' : 'Добавлено: ') + moment(creationTime).fromNow();

      vk.sendMessage({
        message: `Расписание на ${date}\n\nВсего уроков: ${totalLessons}, начинаются в ${startTime}.\n\n${schedule.join('\n')}\n\n${filename}\n${creationTimeString}`,
        peerId,
        priority: 'high',
      });

      await classes.setLoading(peerId, false);
    } else if (schedulePayload.data.action === 'netCityGetToday') {
      await classes.setLoading(peerId, false);

      await vk.sendMessage({
        peerId: message.peerId,
        message: 'Эта команда еще не реализована.',
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
  payload: {
    command: 'schedule',
    data: {action: 'get'},
  } as SchedulePayload,
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
