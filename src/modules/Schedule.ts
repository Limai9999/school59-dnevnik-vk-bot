import axios from 'axios';
import {Keyboard} from 'vk-io';

import VK from './VK';
import Classes from './Classes';
import NetCityAPI from './NetCityAPI';
import Utils from './Utils';

import {Attachment} from '../types/Responses/API/netCity/GetAnnouncementsResponse';
import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';
import {SaveFileResponse} from '../types/Responses/API/schedule/SaveFileResponse';
import {CompareResponse} from '../types/Schedule/CompareResponse';

import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';

import {MainConfig} from '../types/Configs/MainConfig';

import {getMainConfig} from '../utils/getConfig';

type GetScheduleWithAPI = {
  status: boolean
  schedule?: ParseScheduleResponse[]
  error?: string
}

export default class Schedule {
  vk: VK;
  classes: Classes;
  netCity: NetCityAPI;
  utils: Utils;

  mainConfig: MainConfig;

  constructor(vk: VK, classes: Classes, netCity: NetCityAPI, utils: Utils) {
    this.vk = vk;
    this.classes = classes;
    this.netCity = netCity;
    this.utils = utils;

    this.mainConfig = getMainConfig();
  }

  async startAutoUpdate(peerId: number, index: number = 1) {
    if (this.utils.checkIfPeerIsDM(peerId)) return false;

    const credentials = await this.netCity.getCredentials(peerId);
    if (!credentials) return false;

    const autoUpdateTime = 1000 * 60 * (30 + index);

    setInterval(async () => {
      const data = await this.getWithAPI(peerId);

      if (data.status) {
        console.log(`В беседе ${peerId} успешно обновлено расписание.`.cyan);
      } else {
        console.log(`Не удалось обновить расписание в беседе ${peerId}.`.cyan);
      }
    }, autoUpdateTime);

    console.log(`Настроено авто-обновление расписания для беседы ${peerId}.`.cyan);

    return true;
  }

  async getWithAPI(peerId: number): Promise<GetScheduleWithAPI> {
    const isTest = this.mainConfig.testMode;

    const classData = await this.classes.getClass(peerId);
    const credentials = await this.netCity.getCredentials(peerId);
    if (!credentials) {
      return {
        status: false,
        error: 'Не введены данные для Сетевого Города или название класса.',
      };
    }

    const {login, password, className} = credentials;

    const session = await this.netCity.findOrCreateSession(peerId, login, password, false);

    if (!session.status) {
      return {
        status: false,
        error: `Не удалось войти в Сетевой Город, ошибка:\n${session.error!}`,
      };
    }

    const scheduleFiles: Attachment[] = [];

    if (isTest) {
      scheduleFiles.push({
        id: 0,
        name: 'расписание на 4 октября.xlsx',
        originalFileName: 'расписание на 4 октября.xlsx',
      });
      scheduleFiles.push({
        id: 1,
        name: 'расписание на 5 октября.xlsx',
        originalFileName: 'расписание на 5 октября.xlsx',
      });
    } else {
      const announcementsResponse = await this.netCity.getAnnouncements(session.session.id);

      if (!announcementsResponse.status) {
        return {
          status: false,
          error: announcementsResponse.error!,
        };
      }

      announcementsResponse.announcements!.map((announce) => {
        const {attachments} = announce;

        const matchRegexp = /расписание|изменения|расписании/g;
        const skipRegexp = /основное|полугодие/g;

        attachments.map((attachment) => {
          const isAttachmentNameMatch = attachment.name.match(matchRegexp);
          const mustSkip = attachment.name.match(skipRegexp);

          if (isAttachmentNameMatch && !mustSkip) scheduleFiles.push(attachment);
        });
      });
    }

    await this.classes.setLastUpdatedScheduleDate(peerId, Date.now());

    if (!scheduleFiles.length) {
      await this.classes.setSchedule(peerId, []);

      return {
        status: true,
        schedule: [],
      };
    }

    const parsedSchedule: ParseScheduleResponse[] = await Promise.all(scheduleFiles.map(async (file) => {
      const downloadStatus = await this.netCity.downloadAttachment(session.session.id, file, isTest);

      if (!downloadStatus.status) {
        return {
          status: false,
          error: downloadStatus.error,
          filename: file.name,
        } as ParseScheduleResponse;
      }

      const parsedSchedule = await this.parse(file.name, className);

      if (parsedSchedule.status) {
        const oldSchedule = classData.schedule.find((schedule) => schedule.filename! === file.name) as ParseScheduleResponse | undefined;
        this.compare(oldSchedule, parsedSchedule, peerId, true, false);
      }

      return parsedSchedule;
    }));

    await this.classes.setSchedule(peerId, parsedSchedule);

    return {
      status: true,
      schedule: parsedSchedule,
    };
  }

  async parse(filename: string, className: string) {
    const parseScheduleResponse = await axios({
      url: `${this.mainConfig.APIUrl}/schedule/parse`,
      data: {
        filename,
        className,
      },
    });
    const parseScheduleData: ParseScheduleResponse = parseScheduleResponse.data;

    return parseScheduleData;
  }

  async get(peerId: number, forceUpdate: boolean) {
    const classData = await this.classes.getClass(peerId);
    const lastUpdatedScheduleDate = classData.lastUpdatedScheduleDate!;

    const maxLastUpdateDifference = 1000 * 60 * 60;

    const lastUpdateDifference = Date.now() - lastUpdatedScheduleDate;

    if (forceUpdate || lastUpdateDifference > maxLastUpdateDifference) {
      const schedule = await this.getWithAPI(peerId);

      return {
        netcitySchedule: schedule,
        manualSchedule: classData.manualSchedule as ParseScheduleResponse[],
      };
    } else {
      const schedule: GetScheduleWithAPI = {
        status: true,
        schedule: classData.schedule as ParseScheduleResponse[],
      };

      return {
        netcitySchedule: schedule,
        manualSchedule: classData.manualSchedule as ParseScheduleResponse[],
      };
    }
  }

  async compare(oldSchedule: ParseScheduleResponse | undefined, newSchedule: ParseScheduleResponse, peerId: number, announce: boolean, isManual: boolean): Promise<CompareResponse> {
    const testMode = this.mainConfig.testMode;
    const announceChat = testMode ? this.vk.config.adminChatID : peerId;

    if (!newSchedule.status) return {isChanged: false};

    const keyboard = Keyboard.builder()
        .inline()
        .textButton({
          label: newSchedule.schedule!.date || 'Открыть',
          color: isManual ? Keyboard.SECONDARY_COLOR : Keyboard.PRIMARY_COLOR,
          payload: {
            command: 'schedule',
            data: {action: 'choose', filename: newSchedule.filename, type: isManual ? 'manual' : 'netcity'},
          } as SchedulePayload,
        });

    if (!oldSchedule || !oldSchedule.status) {
      if (announce) {
        const dateString = newSchedule.schedule!.date ? `с расписанием на ${newSchedule.schedule!.date}` : 'с неизвестным расписанием';

        this.vk.sendMessage({
          message: `Добавился новый файл ${dateString}.`,
          peerId: announceChat,
          keyboard,
        });
      }

      return {isChanged: false, keyboard};
    };

    const oldData = oldSchedule.schedule!;
    const newData = newSchedule.schedule!;

    const stringifiedOldSchedule = oldData.schedule.join('\n');
    const stringifiedNewSchedule = newData.schedule.join('\n');

    if (stringifiedOldSchedule === stringifiedNewSchedule) return {isChanged: false, keyboard};

    console.log(`Расписание на ${newData.date} изменилось - ${peerId}`.cyan.bgYellow);

    // console.log('old', oldSchedule);
    // console.log('new', newSchedule);

    const changesList: string[] = [];

    if (oldData.totalLessons !== newData.totalLessons) {
      const isAdded = newData.totalLessons > oldData.totalLessons;

      if (isAdded) {
        const addedLessonsCount = newData.totalLessons - oldData.totalLessons;
        const addedLessonsCountString = this.utils.setWordEndingBasedOnThingsCount('addedLessons', addedLessonsCount);

        const addedLessons: string[] = newData.objectedSchedule.map((lessonObj) => {
          const {lesson} = lessonObj;
          if (!lesson) return false;

          const isExistsInOld = oldData.objectedSchedule.find((schedule) => schedule.lesson === lesson);
          if (isExistsInOld) return false;

          return lesson;
        }).filter((lesson) => lesson) as string[];

        const addedLessonsString = addedLessons.join(', ');

        // console.log(1111, {addedLessonsCount, addedLessonsCountString, addedLessonsString});

        changesList.push(`${addedLessonsCountString}: ${addedLessonsString}`);
      }
    }

    if (announce) {
      const changesStrings = changesList.map((change, index) => {
        return `${index + 1} - ${change}`;
      });

      let resultMessage = `Расписание на ${newSchedule.schedule!.date} изменилось.`;

      if (changesStrings.length) {
        resultMessage += `\n\nИзменения:\n${changesStrings.join('\n')}`;
      }

      this.vk.sendMessage({
        message: resultMessage,
        peerId: announceChat,
        keyboard,
        useAll: true,
      });
    }

    const result = {isChanged: true, keyboard, changesList};
    return result;
  }

  async saveFile(url: string, filename: string): Promise<boolean> {
    const response = await axios({
      method: 'post',
      url: `${this.mainConfig.APIUrl}/schedule/saveFile`,
      data: {filename, url},
    });
    const saveFileResponse: SaveFileResponse = response.data;

    return saveFileResponse.status;
  }
}
