
import {Readable} from 'stream';

import API from './API';
import Classes from './Classes';
import NetCityAPI from './NetCityAPI';
import Utils from './Utils';
import VK from './VK';
import Subscription from './Subscription';

import {GetTotalStudentReport} from '../types/Responses/API/grades/GetTotalStudentReport';

import {getGradesDebugData} from '../utils/getConfig';

class Grades {
  vk: VK;
  classes: Classes;
  utils: Utils;
  netcityAPI: NetCityAPI;
  api: API;
  subscription: Subscription;

  autoUpdatePeerIds: number[];

  isDebug: boolean;

  constructor(vk: VK, classes: Classes, utils: Utils, netcityAPI: NetCityAPI, api: API, subscription: Subscription) {
    this.vk = vk;
    this.classes = classes;
    this.utils = utils;
    this.netcityAPI = netcityAPI;
    this.api = api;
    this.subscription = subscription;

    this.autoUpdatePeerIds = [];

    this.isDebug = this.vk.mainConfig.testMode;
  }

  async startAutoUpdate(peerId: number, index: number = 1) {
    const isDM = this.utils.checkIfPeerIsDM(peerId);
    if (!isDM) return;

    const subscription = await this.subscription.checkSubscription(peerId);
    if (!subscription.active) return;

    const credentials = await this.netcityAPI.getCredentials(peerId);
    if (!credentials) return;

    const isAutoUpdateAlreadyActive = this.autoUpdatePeerIds.find((autoUpdatePeerId) => autoUpdatePeerId === peerId);
    if (isAutoUpdateAlreadyActive) return;

    const autoUpdateTime = 1000 * 60 * (35 + index);

    let autoUpdateInterval: NodeJS.Timer | null = null;

    autoUpdateInterval = setInterval(async () => {
      const subscription = await this.subscription.checkSubscription(peerId);
      if (!subscription.active) {
        console.log('Во время обновления оценок, у пользователя закончилась подписка.'.bgRed.black);

        this.autoUpdatePeerIds = this.autoUpdatePeerIds.filter((autoUpdatePeerId) => autoUpdatePeerId !== peerId);
        return clearInterval(autoUpdateInterval!);
      }

      const report = await this.getTotalStudentReport(peerId, true);

      if (report.status) {
        console.log(`В ${peerId} успешно обновлен отчёт с оценками.`.magenta);
      } else {
        console.log(`В ${peerId} не удалось обновить отчёт с оценками.`.bgMagenta.black);
      }
    }, autoUpdateTime);

    this.autoUpdatePeerIds.push(peerId);

    console.log(`Настроено авто-обновление отчёта с оценками для пользователя ${peerId}.`.magenta);
  }

  async getTotalStudentReport(peerId: number, forceUpdate: boolean) {
    const classData = await this.classes.getClass(peerId);

    const lastUpdatedDate = classData.lastUpdatedTotalStudentReport;

    const maxLastUpdateDifference = 1000 * 60 * 30;
    const lastUpdateDifference = Date.now() - lastUpdatedDate;

    if (lastUpdateDifference > maxLastUpdateDifference || !classData.totalStudentReport!.status || forceUpdate) {
      const previousReport = classData.totalStudentReport! as unknown as GetTotalStudentReport;
      const report = this.isDebug ?
                      getGradesDebugData() :
                      await this.netcityAPI.getTotalStudentReport(peerId);

      await this.classes.setLastUpdatedTotalStudentReportDate(peerId, Date.now());
      await this.classes.setTotalStudentReport(peerId, report);

      await this.compare(peerId, previousReport, report);

      return report;
    } else {
      return classData.totalStudentReport! as unknown as GetTotalStudentReport;
    }
  }

  async compare(peerId: number, oldReport: GetTotalStudentReport, newReport: GetTotalStudentReport) {
    try {
      const changesList: string[] = [];

      const oldAverage = oldReport.result.averageGrades;
      const newAverage = newReport.result.averageGrades;

      // проверка изменений в среднем балле
      if (oldAverage.length !== newAverage.length) {
        changesList.push(`Количество предметов в отчёте изменилось.\nБыло: "${oldAverage.length}", стало: "${newAverage.length}".`);
      }

      oldAverage.map((oldGrade) => {
        const newGrade = newAverage.find(({lesson}) => lesson === oldGrade.lesson);

        // непонятно зачем это сделано, но так было в прошлой версии бота, который работал идеально
        if (!newGrade) {
          return changesList.push(`Предмет "${oldGrade.lesson}" был убран из отчёта.`);
        } else if (!oldGrade && newGrade) {
          return changesList.push(`Появился предмет "${newGrade.lesson}".`);
        }

        if (oldGrade.average !== newGrade.average) {
          changesList.push(`Средний балл предмета "${newGrade.lesson}" изменился.\nБыл: "${oldGrade.average}", стал: "${newGrade.average}".`);
        }
      });

      const oldDaysData = oldReport.result.daysData;
      const newDaysData = newReport.result.daysData;

      // проверка изменений во всех днях
      oldDaysData.map((oldDayData) => {
        const newDayData = newDaysData.find(({month, day}) => month === oldDayData.month && day === oldDayData.day);

        if (!newDayData) return changesList.push(`День "${oldDayData.day} ${oldDayData.month}" пропал из отчёта с оценками.`);

        const oldLessonsWithGrades = oldDayData.lessonsWithGrades;
        const newLessonsWithGrades = newDayData.lessonsWithGrades;

        const changes: string[] = [];

        oldLessonsWithGrades.map((oldLesson) => {
          const newLesson = newLessonsWithGrades.find(({lesson}) => lesson === oldLesson.lesson);
          if (!newLesson) return;

          const oldGradesString = oldLesson.grades.join(', ');
          const newGradesString = newLesson.grades.join(', ');

          if (oldGradesString !== newGradesString) {
            if (oldGradesString === '') {
              changes.push(`По предмету "${newLesson.lesson}" были выставлены оценки: "${newGradesString}".`);
            } else if (newGradesString === '') {
              changes.push(`Убраны оценки "${oldGradesString}" по предмету "${newLesson.lesson}".`);
            } else {
              changes.push(`Оценки по предмету "${newLesson.lesson}" изменились.\nБыло: "${oldLesson.grades.length ? oldGradesString : 'без оценок'}", стало: "${newLesson.grades.length ? newGradesString : 'неизвестно'}".`);
            }
          }
        });

        if (changes.length) {
          const changesMessage = changes.map((change, index) => `${index + 1}. ${change}`).join('\n');
          const message = `Изменения на "${newDayData.day} ${newDayData.month}":\n${changesMessage}`;
          changesList.push(message);
        }
      });

      if (changesList.length) {
        const changesMessage = changesList.map((change, index) => `${index + 1}) ${change}`).join('\n\n');

        await this.vk.sendMessage({
          message: `В отчёте об оценках произошло ${changesList.length} изменений:\n\n${changesMessage}`,
          peerId,
        });
      }
    } catch (error) {
      console.log('ошибка в сравнении оценок'.red, error);
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
