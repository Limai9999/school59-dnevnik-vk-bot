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
          console.log('???? ?????????? ???????????????????? ????????????????????, ?? ???????????????????????? ?????????????????????? ????????????????.'.bgCyan.black);

          this.autoUpdatePeerIds = this.autoUpdatePeerIds.filter((autoUpdatePeerId) => autoUpdatePeerId !== peerId);
          return clearInterval(autoUpdateInterval!);
        }
      }

      const data = await this.getWithAPI(peerId);

      const peerType = isDM ? '?? ????????????????????????' : '?? ????????????';

      if (data.status) {
        console.log(`${peerType} ${peerId} ?????????????? ?????????????????? ????????????????????.`.cyan);
      } else {
        console.log(`???? ?????????????? ???????????????? ???????????????????? ${peerType} ${peerId}. ????????????:`.cyan, data.error!);
      }
    }, autoUpdateTime);

    this.autoUpdatePeerIds.push(peerId);

    console.log(`?????????????????? ????????-???????????????????? ???????????????????? ?????? ${peerId}. (${autoUpdateMinutes} + ${this.autoUpdateCount})`.cyan);
    this.autoUpdateCount++;

    return true;
  }

  async getWithAPI(peerId: number): Promise<GetScheduleWithAPI> {
    const isTest = this.mainConfig.testMode;

    const classData = await this.classes.getClass(peerId);
    const credentials = await this.netCity.getCredentials(peerId);

    const session = await this.netCity.findOrCreateSession(peerId, false);

    if (!session || !credentials) {
      return {
        status: false,
        error: '???? ?????????????? ???????????? ?????? ???????????????? ???????????? ?????? ???????????????? ????????????.',
      };
    }

    const { className } = credentials;

    if (!session.status) {
      return {
        status: false,
        error: `???? ?????????????? ?????????? ?? ?????????????? ??????????, ????????????:\n${session.error!}`,
      };
    }

    const scheduleFiles: Attachment[] = [];

    if (isTest) {
      scheduleFiles.push({
        id: 0,
        name: '???????????????????? ???? 4 ??????????????.xlsx',
        originalFileName: '???????????????????? ???? 4 ??????????????.xlsx',
      });
      scheduleFiles.push({
        id: 1,
        name: '???????????????????? ???? 5 ??????????????.xlsx',
        originalFileName: '???????????????????? ???? 5 ??????????????.xlsx',
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
        const { attachments } = announce;

        const matchRegexp = /????????????????????|??????????????????|????????????????????/g;
        const skipRegexp = /????????????????|??????????????????/g;

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
    const parseScheduleResponse = await this.api.request({
      url: '/schedule/parse',
      data: {
        filename,
        className,
      },
    });
    if (!parseScheduleResponse) throw new Error('???? ?????????????? ???????????????????? ?? API.');

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

    if (!newSchedule.status) return { isChanged: false };

    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: newSchedule.schedule!.date || '??????????????',
        color: isManual ? Keyboard.SECONDARY_COLOR : Keyboard.PRIMARY_COLOR,
        payload: {
          command: 'schedule',
          data: { action: 'choose', filename: newSchedule.filename, type: isManual ? 'manual' : 'netcity' },
        } as SchedulePayload,
      });

    if (!oldSchedule || !oldSchedule.status) {
      if (announce) {
        const dateString = newSchedule.schedule!.date ? `?? ?????????????????????? ???? ${newSchedule.schedule!.date}` : '?? ?????????????????????? ??????????????????????';

        this.vk.sendMessage({
          message: `?????????????????? ?????????? ???????? ${dateString}.`,
          peerId: announceChat,
          keyboard,
        });
      }

      return { isChanged: false, keyboard };
    }

    const oldData = oldSchedule.schedule!;
    const newData = newSchedule.schedule!;

    const stringifiedOldSchedule = oldData.schedule.join('\n');
    const stringifiedNewSchedule = newData.schedule.join('\n');

    if (stringifiedOldSchedule === stringifiedNewSchedule) return { isChanged: false, keyboard };

    console.log(`???????????????????? ???? ${newData.date} ???????????????????? - ${peerId}`.cyan.bgYellow);

    // console.log('old', oldSchedule);
    // console.log('new', newSchedule);

    const changesList: string[] = [];

    if (oldData.totalLessons !== newData.totalLessons) {
      const isAdded = newData.totalLessons > oldData.totalLessons;

      if (isAdded) {
        const addedLessonsCount = newData.totalLessons - oldData.totalLessons;
        const addedLessonsCountString = this.utils.setWordEndingBasedOnThingsCount('addedLessons', addedLessonsCount);

        const addedLessons: string[] = newData.objectedSchedule.map((lessonObj) => {
          const { lesson } = lessonObj;
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

      let resultMessage = `???????????????????? ???? ${newSchedule.schedule!.date} ????????????????????.`;

      if (changesStrings.length) {
        resultMessage += `\n\n??????????????????:\n${changesStrings.join('\n')}`;
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
    if (!response) throw new Error('???? ?????????????? ???????????????????? ?? API.');

    const saveFileResponse: SaveFileResponse = response.data;

    return saveFileResponse.status;
  }
}
