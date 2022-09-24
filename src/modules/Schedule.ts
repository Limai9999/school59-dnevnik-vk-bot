import axios from 'axios';

import VK from './VK';
import Classes from './Classes';
import Password from './Password';

import {GetScheduleResponse} from '../types/Responses/API/schedule/GetScheduleResponse';
import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';
import {SaveFileResponse} from '../types/Responses/API/schedule/SaveFileResponse';

type UpdateSchedule = {
  status: boolean
  message: string | ParseScheduleResponse[]
}

export default class Schedule {
  vk: VK;
  classes: Classes;

  constructor(vk: VK, classes: Classes) {
    this.vk = vk;
    this.classes = classes;
  }

  async update(peerId: number): Promise<UpdateSchedule> {
    const {netCityData, className} = await this.classes.getClass(peerId);
    if (!netCityData || !className) {
      return {
        status: false,
        message: 'Не введены данные для Сетевого Города или название класса.',
      };
    }

    const password = new Password(netCityData.password!, true);

    const getScheduleResponse = await axios({
      url: `${this.vk.config.APIUrl}/api/netcity/schedule/get`,
      data: {
        login: netCityData.login,
        password: password.decrypt(),
      },
    });

    const getScheduleData: GetScheduleResponse = getScheduleResponse.data;
    if (!getScheduleData.status) {
      return {
        status: false,
        message: `При получении расписания произошла ошибка:\n${getScheduleData.message}`,
      };
    }

    await this.classes.setLastUpdatedScheduleDate(peerId, Date.now());

    if (!getScheduleData.files.length) {
      await this.classes.setSchedule(peerId, []);

      return {
        status: false,
        message: `В Сетевом Городе нет файлов с расписанием.`,
      };
    }

    const parsedSchedule = await Promise.all(getScheduleData.files.map(async (file) => {
      const parseSchedule = await this.parse(file.filename, className);
      return parseSchedule;
    }));

    await this.classes.setSchedule(peerId, parsedSchedule);

    return {
      status: true,
      message: parsedSchedule,
    };
  }

  async parse(filename: string, className: string) {
    const parseScheduleResponse = await axios({
      url: `${this.vk.config.APIUrl}/api/netcity/schedule/parse`,
      data: {
        filename,
        className,
      },
    });
    const parseScheduleData: ParseScheduleResponse = parseScheduleResponse.data;

    return parseScheduleData;
  }

  async get(peerId: number) {
    const classData = await this.classes.getClass(peerId);
    const lastUpdatedScheduleDate = classData.lastUpdatedScheduleDate!;

    const maxLastUpdateDifference = 1000 * 60 * 30;

    const lastUpdateDifference = Date.now() - lastUpdatedScheduleDate;

    if (lastUpdateDifference > maxLastUpdateDifference) {
      const schedule = await this.update(peerId);
      return {
        netcitySchedule: schedule,
        manualSchedule: classData.manualSchedule as ParseScheduleResponse[],
      };
    } else {
      const schedule: UpdateSchedule = {
        status: true,
        message: classData.schedule as ParseScheduleResponse[],
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
      url: `${this.vk.config.APIUrl}/api/netcity/schedule/saveFile`,
      data: {filename, url},
    });
    const saveFileResponse: SaveFileResponse = response.data;

    return saveFileResponse.status;
  }
}
