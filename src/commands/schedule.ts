import { CommandInputData, CommandOutputData } from '../types/Commands';

import { Keyboard } from 'vk-io';
import moment from 'moment';

moment.locale('ru');

import { SchedulePayload } from '../types/VK/Payloads/SchedulePayload';

export async function command({ message, vk, classes, payload, schedule, utils }: CommandInputData) {
  let loadingMessageID = 0;

  const peerId = message.peerId;
  const classData = await classes.getClass(peerId);

  const schedulePayload = payload as SchedulePayload;
  const action = schedulePayload.data.action;

  const isPreview = !!schedulePayload.data.isPreview;

  if (!isPreview) await schedule.startAutoUpdate(peerId);

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
          data: { action: 'update', isPreview },
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
    if (schedulePayload.data.filename === 'schoolEndFeature') {
      const endingMessage = classData.endingMessage;
      if (!endingMessage) return console.log('НЕ УДАЛОСЬ ОТПРАВИТЬ КОНЕЧНОЕ СООБЩЕНИЕ, Т.К ЕГО НЕТ.'.bgRed);

      await vk.sendMessage({
        message: endingMessage,
        peerId,
      });

      await classes.setLoading(peerId, false);

      return;
    }

    const maxFileLifeTime = 1000 * 60 * 60 * 24 * 2;

    if (action === 'get' || action === 'update') {
      const isForceUpdate = action === 'update';

      loadingMessageID = await vk.sendMessage({
        message: 'Поиск расписания начат, подождите...',
        peerId,
        priority: 'low',
      });

      const scheduleData = await schedule.get(peerId, isForceUpdate, isPreview);
      const { manualSchedule, netcitySchedule } = scheduleData;

      const keyboard = Keyboard.builder()
        .inline();

      let resultMessage = '';

      let totalNetcityFiles = 0;
      let totalManualFiles = 0;

      if (netcitySchedule.status) {
        const netcityFiles = netcitySchedule.schedule!;

        const netcityFilesStrings = netcityFiles.map((file, index) => {
          let returningString = '';

          const { filename } = file;

          let date: string | undefined;
          if (file.status) date = file.schedule!.date;

          keyboard.textButton({
            label: date || String(index + 1),
            color: file.status ? Keyboard.PRIMARY_COLOR : Keyboard.NEGATIVE_COLOR,
            payload: {
              command: 'schedule',
              data: { action: 'choose', filename, type: 'netcity', isPreview },
            } as SchedulePayload,
          });

          returningString += `${index + 1}. ${filename}`;

          if (!file.status) {
            returningString += ' ❌';
            console.log(`${filename}, ошибка:`.red, file.error);
          }

          return returningString;
        });

        totalNetcityFiles = netcityFiles.length;

        const filesCountString = utils.setWordEndingBasedOnThingsCount('scheduleFiles', totalNetcityFiles);

        const netcityFilesString = netcityFilesStrings.length ? `${filesCountString} с расписанием из объявлений Сетевого Города:\n${netcityFilesStrings.join('\n')}` : 'В объявлениях Сетевого Города расписания нет.';
        resultMessage += netcityFilesString;

        // const classData = await classes.getClass(message.peerId);
        // const lastUpdatedString = `\nОбновлено: ${moment(classData.lastUpdatedScheduleDate).fromNow()}`;
        // resultMessage += lastUpdatedString;
      } else {
        resultMessage += `При получении расписания из объявлений Сетевого Города произошла ошибка:\n${netcitySchedule.error!}`;
      }

      const newestManualFiles = manualSchedule.filter((schedule) => Date.now() - schedule.schedule!.creationTime < maxFileLifeTime);

      totalManualFiles = newestManualFiles.length;

      if (totalManualFiles) {
        keyboard.row();

        const manualFilesStrings = newestManualFiles.map((schedule, index) => {
          const { filename, date } = schedule.schedule!;

          keyboard.textButton({
            label: date || String(index + 1),
            color: Keyboard.SECONDARY_COLOR,
            payload: {
              command: 'schedule',
              data: { action: 'choose', filename, type: 'manual', isPreview },
            } as SchedulePayload,
          });

          return `${index + 1}. ${filename}`;
        });

        totalManualFiles = newestManualFiles.length;

        const manualFilesString = manualFilesStrings.length ? `\n\nФайлы, добавленные вручную:\n${manualFilesStrings.join('\n')}` : '';

        resultMessage += manualFilesString;
      }

      if (!totalNetcityFiles && !totalManualFiles && !resultMessage.length) {
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
          data: { action: 'update', isPreview },
        } as SchedulePayload,
      });

      vk.sendMessage({
        message: resultMessage,
        peerId,
        priority: 'medium',
        keyboard,
      });

      await classes.setLoading(peerId, false);
    } else if (action === 'choose') {
      const classData = await classes.getClass(peerId);

      const arrayWithSchedule = schedulePayload.data.type === 'netcity' ? classData.schedule : classData.manualSchedule;
      const scheduleData = arrayWithSchedule.find((schedule) => schedule.filename! === schedulePayload.data.filename!);

      if (!scheduleData) {
        return sendError('Произошла неизвестная ошибка, либо выбранного расписания больше нет.');
      }

      if (scheduleData.status) {
        const { date, schedule, totalLessons, startTime, filename, creationTime } = scheduleData.schedule!;

        const creationTimeString = (schedulePayload.data.type === 'netcity' ? 'Скачано: ' : 'Добавлено: ') + moment(creationTime).fromNow();
        const totalLessonsAndStartTimeString = totalLessons === 1 ? `Всего 1 урок, начинающийся в ${startTime}.` : `Всего уроков: ${totalLessons}, начинаются в ${startTime}.`;
        const dateString = (date ? `Расписание на ${date}` : filename) + ` (${classData.className})`;

        const note = classData.notes.find((notes) => notes.filename === filename);
        const noteString = note ? `⚠️ Заметка: ${note.noteText}\n\n` : '';

        vk.sendMessage({
          message: `${dateString}\n\n${noteString}${totalLessonsAndStartTimeString}\n\n${schedule.join('\n')}\n\n${creationTimeString}`,
          peerId,
          priority: 'high',
        });
      } else {
        vk.sendMessage({
          message: `При обработке файла "${scheduleData.filename}" произошла ошибка:\n\n${scheduleData.error}\n\nПопробуйте обновить расписание.`,
          peerId,
          priority: 'high',
        });
      }

      await classes.setLoading(peerId, false);
    } else if (action === 'netCityGetToday') {
      await classes.setLoading(peerId, false);

      await vk.sendMessage({
        peerId: message.peerId,
        message: 'Эта команда еще не реализована.',
      });
    }
  } catch (error) {
    console.log('Ошибка при отправке расписания'.red, error);
    sendError(`При получении расписания произошла ошибка:\n${error}`);
  }
}

const cmd: CommandOutputData = {
  name: 'расписание',
  aliases: ['получить расписание', 'schedule', 'рсп'],
  description: 'Получить расписание уроков.',
  payload: {
    command: 'schedule',
    data: { action: 'get' },
  } as SchedulePayload,
  requirements: {
    admin: false,
    dmOnly: false,
    chatOnly: false,
    args: 0,
    paidSubscription: true,
    payloadOnly: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
