import API from './API';
import Classes from './Classes';
import NetCityAPI from './NetCityAPI';
import Utils from './Utils';
import VK from './VK';

import {GetTotalStudentReport} from '../types/Responses/API/grades/GetTotalStudentReport';

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

  async getTotalStudentReport(peerId: number) {
    const classData = await this.classes.getClass(peerId);

    const lastUpdatedDate = classData.lastUpdatedTotalStudentReport;

    const maxLastUpdateDifference = 1000 * 60 * 60;
    const lastUpdateDifference = Date.now() - lastUpdatedDate;

    if (lastUpdateDifference > maxLastUpdateDifference) {
      const report = await this.netcityAPI.getTotalStudentReport(peerId);

      await this.classes.setLastUpdatedTotalStudentReportDate(peerId, Date.now());
      await this.classes.setTotalStudentReport(peerId, report);

      return report;
    } else {
      return classData.totalStudentReport! as unknown as GetTotalStudentReport;
    }
  }
}

export default Grades;
