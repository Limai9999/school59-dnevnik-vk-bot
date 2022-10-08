import axios from 'axios';

import VK from './VK';
import Classes from './Classes';
import Password from './Password';
import NetCityAPI from './NetCityAPI';

import {Attachment} from '../types/Responses/API/netCity/GetAnnouncementsResponse';
import {GetScheduleResponse} from '../types/Responses/API/schedule/GetScheduleResponse';
import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';
import {SaveFileResponse} from '../types/Responses/API/schedule/SaveFileResponse';

import {MainConfig} from '../types/Configs/MainConfig';

import {getMainConfig} from '../utils/getConfig';

type UpdateSchedule = {
  status: boolean
  schedule?: ParseScheduleResponse[]
  error?: string
}

type GetScheduleWithAPI = {
  status: boolean
  schedule?: ParseScheduleResponse[]
  error?: string
}

export default class Schedule {
  vk: VK;
  classes: Classes;
  netCity: NetCityAPI;

  config: MainConfig;

  constructor(vk: VK, classes: Classes, netCity: NetCityAPI) {
    this.vk = vk;
    this.classes = classes;
    this.netCity = netCity;

    this.config = getMainConfig();
  }

  async update(peerId: number): Promise<UpdateSchedule> {
    const {netCityData, className} = await this.classes.getClass(peerId);
    if (!netCityData || !className) {
      return {
        status: false,
        error: 'Не введены данные для Сетевого Города или название класса.',
      };
    }

    const password = new Password(netCityData.password!, true).decrypt();

    const getScheduleResponse = await axios({
      url: `${this.config.APIUrl}/schedule/get`,
      data: {
        login: netCityData.login,
        password,
      },
    });

    const getScheduleData: GetScheduleResponse = getScheduleResponse.data;
    if (!getScheduleData.status) {
      return {
        status: false,
        error: getScheduleData.message,
      };
    }

    await this.classes.setLastUpdatedScheduleDate(peerId, Date.now());

    if (!getScheduleData.files.length) {
      await this.classes.setSchedule(peerId, []);

      return {
        status: true,
        schedule: [],
      };
    }

    const parsedSchedule = await Promise.all(getScheduleData.files.map(async (file) => {
      const parseSchedule = await this.parse(file.filename, className);
      return parseSchedule;
    }));

    await this.classes.setSchedule(peerId, parsedSchedule);

    return {
      status: true,
      schedule: parsedSchedule,
    };
  }

  async getWithAPI(peerId: number): Promise<GetScheduleWithAPI> {
    const {netCityData, className} = await this.classes.getClass(peerId);
    if (!netCityData || !className) {
      return {
        status: false,
        error: 'Не введены данные для Сетевого Города или название класса.',
      };
    }
    const password = new Password(netCityData.password!, true).decrypt();

    const session = await this.netCity.findOrCreateSession(peerId, netCityData.login!, password!, false);

    const announcementsResponse = await this.netCity.getAnnouncements(session.session.id);

    if (!announcementsResponse.status) {
      return {
        status: false,
        error: announcementsResponse.error!,
      };
    }

    const scheduleFiles: Attachment[] = [];

    announcementsResponse.announcements!.map((announce) => {
      const {attachments} = announce;

      const matchRegexp = /расписание|изменения|расписании/g;

      attachments.map((attachment) => {
        const isAttachmentNameMatch = attachment.name.match(matchRegexp);
        if (isAttachmentNameMatch) scheduleFiles.push(attachment);
      });
    });

    await this.classes.setLastUpdatedScheduleDate(peerId, Date.now());

    if (!scheduleFiles.length) {
      await this.classes.setSchedule(peerId, []);

      return {
        status: true,
        schedule: [],
      };
    }

    const parsedSchedule: ParseScheduleResponse[] = await Promise.all(scheduleFiles.map(async (file) => {
      const downloadStatus = await this.netCity.downloadAttachment(session.session.id, file);

      if (!downloadStatus.status) {
        return {
          status: false,
          error: downloadStatus.error,
          filename: file.name,
        } as ParseScheduleResponse;
      }

      const parseSchedule = await this.parse(file.name, className);
      return parseSchedule;
    }));

    await this.classes.setSchedule(peerId, parsedSchedule);

    return {
      status: true,
      schedule: parsedSchedule,
    };
  }

  async parse(filename: string, className: string) {
    const parseScheduleResponse = await axios({
      url: `${this.config.APIUrl}/schedule/parse`,
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

  async saveFile(url: string, filename: string): Promise<boolean> {
    const response = await axios({
      method: 'post',
      url: `${this.config.APIUrl}/schedule/saveFile`,
      data: {filename, url},
    });
    const saveFileResponse: SaveFileResponse = response.data;

    return saveFileResponse.status;
  }
}
