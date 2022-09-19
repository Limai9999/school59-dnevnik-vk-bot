import {CommandInputData, CommandOutputData} from '../types/Commands';

import axios from 'axios';

import {Keyboard} from 'vk-io';

import PasswordService from '../modules/Password';

import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';
import {GetScheduleResponse} from '../types/Responses/API/schedule/GetScheduleResponse';
import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';

export async function command({message, vk, classes, payload}: CommandInputData) {
  const sendError = (errorMessage: string) => {
    return vk.sendMessage({
      message: errorMessage,
      peerId: message.peerId,
      priority: 'medium',
    });
  };

  const APIUrl = vk.config.APIUrl;

  try {
    const schedulePayload = payload as SchedulePayload;

    switch (schedulePayload.data.action) {
      case 'get':
        const {netCityData, className} = await classes.getClass(message.peerId);
        if (!netCityData || !className) {
          return sendError('Не введены данные для Сетевого Города или название класса.');
        }

        const password = new PasswordService(netCityData.password!, true);

        const getScheduleResponse = await axios({
          url: `${APIUrl}/api/netcity/schedule/get`,
          data: {
            login: netCityData.login,
            password: password.decrypt(),
          },
        });

        const getScheduleData: GetScheduleResponse = getScheduleResponse.data;
        if (!getScheduleData.status) {
          return sendError(`При получении расписания произошла ошибка:\n${getScheduleData.message}`);
        }

        if (!getScheduleData.files.length) {
          return sendError('В Сетевом Городе нет файлов с расписанием.');
        }

        const parsedSchedule = await Promise.all(getScheduleData.files.map(async (file) => {
          const parseScheduleResponse = await axios({
            url: `${APIUrl}/api/netcity/schedule/parse`,
            data: {
              filename: file.filename,
              className,
            },
          });
          const parseScheduleData: ParseScheduleResponse = parseScheduleResponse.data;

          return parseScheduleData;
        }));

        await classes.setSchedule(message.peerId, parsedSchedule);

        console.log(parsedSchedule);

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

        vk.sendMessage({
          message: `Получено ${totalFiles} файлов с расписанием.\n\n${filesString.join('\n')}`,
          peerId: message.peerId,
          priority: 'low',
          keyboard,
        });
        break;
      case 'choose':
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
        break;
    }
  } catch (error) {
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
