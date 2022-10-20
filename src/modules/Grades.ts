import API from './API';
import Classes from './Classes';
import NetCityAPI from './NetCityAPI';
import Utils from './Utils';
import VK from './VK';

import {GetTotalStudentReport} from '../types/Responses/API/grades/GetTotalStudentReport';
import {Readable} from 'stream';

class Grades {
  vk: VK;
  classes: Classes;
  utils: Utils;
  netcityAPI: NetCityAPI;
  api: API;

  constructor(vk: VK, classes: Classes, utils: Utils, netcityAPI: NetCityAPI, api: API) {
    this.vk = vk;
    this.classes = classes;
    this.utils = utils;
    this.netcityAPI = netcityAPI;
    this.api = api;
  }

  async getTotalStudentReport(peerId: number, forceUpdate: boolean) {
    const classData = await this.classes.getClass(peerId);

    const lastUpdatedDate = classData.lastUpdatedTotalStudentReport;

    const maxLastUpdateDifference = 1000 * 60 * 60;
    const lastUpdateDifference = Date.now() - lastUpdatedDate;

    if (lastUpdateDifference > maxLastUpdateDifference || !classData.totalStudentReport!.status || forceUpdate) {
      const report = await this.netcityAPI.getTotalStudentReport(peerId);

      await this.classes.setLastUpdatedTotalStudentReportDate(peerId, Date.now());
      await this.classes.setTotalStudentReport(peerId, report);

      return report;
    } else {
      return classData.totalStudentReport! as unknown as GetTotalStudentReport;
    }
  }

  async getScreenshot(screenshotName: string) {
    try {
      const response = await this.api.request({
        method: 'get',
        url: '/grades/getReportScreenshot',
        data: {screenshotName},
        responseType: 'stream',
      });
      if (!response) throw new Error('Не удалось обратиться к API.');

      const data = response.data as Readable;

      if (response.status === 400) {
        return {
          status: false,
          error: 'Не удалось получить скриншот с сервера.',
        };
      } else {
        return {
          status: true,
          fileStream: data,
        };
      }
    } catch (error) {
      return {
        status: false,
        error: `${error}`,
      };
    }
  }
}

export default Grades;
