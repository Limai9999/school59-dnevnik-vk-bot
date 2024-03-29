import { Keyboard } from 'vk-io';

import VK from './VK';
import Classes from './Classes';
import NetCityAPI from './NetCityAPI';
import Utils from './Utils';
import API from './API';
import Subscription from './Subscription';

import { Attachment } from '../types/Responses/API/netCity/GetAnnouncementsResponse';
import { ParseScheduleResponse } from '../types/Responses/API/schedule/ParseScheduleResponse';
import { SaveFileResponse } from '../types/Responses/API/schedule/SaveFileResponse';
import { CompareResponse } from '../types/Schedule/CompareResponse';

import { SchedulePayload } from '../types/VK/Payloads/SchedulePayload';

import { getPreviewScheduleData, getScheduleDebugData } from '../utils/getConfig';

import { MainConfig } from '../types/Configs/MainConfig';

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
  api: API;
  subscription: Subscription;

  mainConfig: MainConfig;

  autoUpdatePeerIds: number[];
  autoUpdateCount: number;

  isDebug: boolean;

  constructor(vk: VK, classes: Classes, netCity: NetCityAPI, utils: Utils, api: API, subscription: Subscription, mainConfig: MainConfig) {
    this.vk = vk;
    this.classes = classes;
    this.netCity = netCity;
    this.utils = utils;
    this.api = api;
    this.subscription = subscription;

    this.mainConfig = mainConfig;

    this.autoUpdatePeerIds = [];
    this.autoUpdateCount = 0;

    this.isDebug = this.mainConfig.testMode;
    // this.isDebug = false;
  }

  async startAutoUpdate(peerId: number) {
    const isDM = this.utils.checkIfPeerIsDM(peerId);

    if (isDM) {
      const subscription = await this.subscription.checkSubscription(peerId);
      if (!subscription.active) return;
    }

    const credentials = await this.netCity.getCredentials(peerId);
    if (!credentials) return false;

    const isAutoUpdateAlreadyActive = this.autoUpdatePeerIds.find((autoUpdatePeerId) => autoUpdatePeerId === peerId);
    if (isAutoUpdateAlreadyActive) return;

    const autoUpdateMinutes = this.mainConfig.autoUpdateMin.schedule;
    const autoUpdateTime = 1000 * 60 * (autoUpdateMinutes + this.autoUpdateCount);

    let autoUpdateInterval: NodeJS.Timer | null = null;

    autoUpdateInterval = setInterval(async () => {
      if (isDM) {
        const subscription = await this.subscription.checkSubscription(peerId);
        if (!subscription.active) {
          console.log('Во время обновления расписания, у пользователя закончилась подписка.'.bgCyan.black);

          this.autoUpdatePeerIds = this.autoUpdatePeerIds.filter((autoUpdatePeerId) => autoUpdatePeerId !== peerId);
          return clearInterval(autoUpdateInterval!);
        }
      }

      const data = await this.getWithAPI(peerId, false);

      const peerType = isDM ? 'у пользователя' : 'в беседе';

      if (data.status) {
        console.log(`${peerType} ${peerId} успешно обновлено расписание.`.cyan);
      } else {
        console.log(`Не удалось обновить расписание ${peerType} ${peerId}. Ошибка:`.cyan, data.error!);
      }
    }, autoUpdateTime);

    this.autoUpdatePeerIds.push(peerId);

    console.log(`Настроено автообновление расписания для ${peerId}. (${autoUpdateMinutes} + ${this.autoUpdateCount})`.cyan);
    this.autoUpdateCount++;

    return true;
  }

  async getWithAPI(peerId: number, isPreview: boolean): Promise<GetScheduleWithAPI> {
    const classData = await this.classes.getClass(peerId);
    let credentials = await this.netCity.getCredentials(peerId);

    isPreview ? credentials = { className: '9б', login: 'preview', password: 'preview' } : null;

    const session = await this.netCity.findOrCreateSession(peerId, false, isPreview);

    if (!session || !credentials) {
      return {
        status: false,
        error: 'Не введены данные для Сетевого Города или название класса.',
      };
    }

    const { className } = credentials;

    if (!session.status) {
      return {
        status: false,
        error: `Не удалось войти в Сетевой Город, ошибка:\n${session.error!}`,
      };
    }

    const scheduleFiles: Attachment[] = [];

    if (this.isDebug || isPreview) {
      if (this.isDebug) {
        const debugAttachments = getScheduleDebugData();

        scheduleFiles.push(...debugAttachments);
      }

      if (isPreview) {
        const previewAttachments = getPreviewScheduleData();

        scheduleFiles.push(...previewAttachments);
      }
    } else {
      const announcementsResponse = await this.netCity.getAnnouncements(session.session.id);

      if (!announcementsResponse.status) {
        return {
          status: false,
          error: announcementsResponse.error!,
        };
      }

      announcementsResponse.announcements!.map((announce) => {
        const { attachments } = announce;

        const matchRegexp = /расписание|изменения|расписании/g;
        const skipRegexp = /основное|полугодие/g;

        attachments.map((attachment) => {
          const isAttachmentNameMatch = attachment.name.match(matchRegexp);
          const mustSkip = attachment.name.match(skipRegexp);

          if (isAttachmentNameMatch && !mustSkip) scheduleFiles.push(attachment);
        });
      });
    }

    // console.log('scheduleFiles', scheduleFiles);

    if (!scheduleFiles.length) {
      return {
        status: true,
        schedule: [],
      };
    } else {
      await this.classes.setLastUpdatedScheduleDate(peerId, Date.now());
    }

    const parsedSchedule: ParseScheduleResponse[] = await Promise.all(scheduleFiles.map(async (file) => {
      const downloadStatus = await this.netCity.downloadAttachment(session.session.id, file, this.isDebug || isPreview);

      if (!downloadStatus.status) {
        const data: ParseScheduleResponse = {
          status: false,
          error: downloadStatus.error,
          filename: downloadStatus.filename,
          isPreview,
        };

        return data;
      }

      const parsedSchedule = await this.parse(downloadStatus.filename, className, isPreview);

      if (parsedSchedule.status) {
        const oldSchedule = classData.schedule.find((schedule) => schedule.filename! === downloadStatus.filename);
        this.compare(oldSchedule, parsedSchedule, peerId, true, false);
      }

      return parsedSchedule;
    }));

    const oldSchedule = classData.schedule;
    const newScheduleArray: ParseScheduleResponse[] = [];

    // console.log('parsedSchedule', parsedSchedule);

    parsedSchedule.map((newSchedule) => {
      if (!newSchedule.filename) return;

      const isExistsInOld = oldSchedule.find((old) => old.filename === newSchedule.filename);
      if (isExistsInOld && !newSchedule.status) return isExistsInOld;

      newScheduleArray.push(newSchedule);
    });

    if (newScheduleArray.length) await this.classes.setSchedule(peerId, newScheduleArray);

    // console.log('newScheduleArray', newScheduleArray);

    return {
      status: true,
      schedule: newScheduleArray,
    };
  }

  async parse(filename: string, className: string, isPreview: boolean) {
    const parseScheduleResponse = await this.api.request({
      url: '/schedule/parse',
      data: {
        filename,
        className,
        isPreview,
      },
    });
    if (!parseScheduleResponse) throw new Error('Не удалось обратиться к API.');

    const parseScheduleData: ParseScheduleResponse = parseScheduleResponse.data;

    return parseScheduleData;
  }

  async get(peerId: number, forceUpdate: boolean, isPreview: boolean) {
    const classData = await this.classes.getClass(peerId);
    const lastUpdatedScheduleDate = classData.lastUpdatedScheduleDate!;

    const maxLastUpdateDifference = 1000 * 60 * 60;

    const lastUpdateDifference = Date.now() - lastUpdatedScheduleDate;

    if (forceUpdate || lastUpdateDifference > maxLastUpdateDifference || isPreview) {
      const schedule = await this.getWithAPI(peerId, isPreview);

      return {
        netcitySchedule: schedule,
        manualSchedule: classData.manualSchedule,
      };
    } else {
      const schedule: GetScheduleWithAPI = {
        status: true,
        schedule: classData.schedule,
      };

      return {
        netcitySchedule: schedule,
        manualSchedule: classData.manualSchedule,
      };
    }
  }

  async compare(oldSchedule: ParseScheduleResponse | undefined, newSchedule: ParseScheduleResponse, peerId: number, announce: boolean, isManual: boolean): Promise<CompareResponse> {
    const testMode = this.mainConfig.testMode;
    const announceChat = peerId;

    if (!newSchedule.status) return { isChanged: false };

    if (newSchedule.isPreview) return { isChanged: false };

    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: newSchedule.schedule!.date || 'Открыть',
        color: isManual ? Keyboard.SECONDARY_COLOR : Keyboard.PRIMARY_COLOR,
        payload: {
          command: 'schedule',
          data: { action: 'choose', filename: newSchedule.filename, type: isManual ? 'manual' : 'netcity' },
        } as SchedulePayload,
      });

    if (!oldSchedule) {
      if (announce) {
        const dateString = newSchedule.schedule!.date ? `с расписанием на ${newSchedule.schedule!.date}` : 'с неизвестным расписанием';

        this.vk.sendMessage({
          message: `Добавился новый файл ${dateString}.`,
          peerId: announceChat,
          keyboard,
        });
      }

      return { isChanged: false, keyboard };
    }

    if (!oldSchedule.status) return { isChanged: false, keyboard };

    if (oldSchedule.isPreview) {
      return { isChanged: false, keyboard };
    }

    const oldData = oldSchedule.schedule;
    const newData = newSchedule.schedule;

    if (!oldData || !newData) return { isChanged: false, keyboard };

    const stringifiedOldSchedule = oldData.schedule.join('\n');
    const stringifiedNewSchedule = newData.schedule.join('\n');

    if (stringifiedOldSchedule === stringifiedNewSchedule) return { isChanged: false, keyboard };

    console.log(`Расписание на ${newData.date} изменилось — ${peerId}`.cyan.bgYellow);

    const changesList: string[] = [];

    if (oldData.totalLessons !== newData.totalLessons) {
      const isAdded = newData.totalLessons > oldData.totalLessons;

      if (isAdded) {
        const addedCount = newData.totalLessons - oldData.totalLessons;
        changesList.push(`Добавилось ${addedCount} уроков.`);
      } else {
        const removedCount = oldData.totalLessons - newData.totalLessons;
        changesList.push(`Убрано ${removedCount} уроков.`);
      }
    }

    if (announce) {
      const changesStrings = changesList.map((change, index) => {
        return `${index + 1}. ${change}`;
      });

      let resultMessage = `Расписание на ${newSchedule.schedule!.date} изменилось.`;

      if (changesStrings.length) {
        const changesFixedString = this.utils.setWordEndingBasedOnThingsCount('changes', changesStrings.length);
        resultMessage += `\n\n${changesFixedString}:\n${changesStrings.join('\n')}`;
      }

      this.vk.sendMessage({
        message: resultMessage,
        peerId: announceChat,
        keyboard,
        useAll: true,
      });
    }

    const result = { isChanged: true, keyboard, changesList };
    return result;
  }

  async saveFile(url: string, filename: string): Promise<boolean> {
    const response = await this.api.request({
      method: 'post',
      url: '/schedule/saveFile',
      data: { filename, url },
    });
    if (!response) throw new Error('Не удалось обратиться к API.');

    const saveFileResponse: SaveFileResponse = response.data;

    return saveFileResponse.status;
  }
}
