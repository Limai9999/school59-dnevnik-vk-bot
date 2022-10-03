import axios from 'axios';

import {GetCookiesResponse} from '../types/Responses/API/netCity/GetCookiesResponse';
import {GetStudentDiary} from '../types/Responses/API/netCity/GetStudentDiary';
import {InitStudentDiary} from '../types/Responses/API/netCity/InitStudentDiary';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

interface Session extends GetCookiesResponse {
  peerId: number
}

class NetCityAPI {
  sessions: Session[];

  vk: VK;
  classes: Classes;
  utils: Utils;

  constructor(vk: VK, classes: Classes, utils: Utils) {
    this.sessions = [];

    this.vk = vk;
    this.classes = classes;
    this.utils = utils;
  }

  async createSession(peerId: number, login: string, password: string): Promise<Session> {
    try {
      const request = await axios({
        url: `${this.vk.config.APIUrl}/api/netcity/login/getCookies`,
        data: {login, password},
      });

      const session: Session = {
        peerId,
        ...request.data,
      };

      if (session.status) this.sessions.push(session);

      return session;
    } catch (error) {
      return {
        peerId,
        status: false,
        error: `${error}`,
        session: {id: 0, endTime: 0},
        at: '0',
        cookies: [],
      };
    }
  }

  getSession(sessionId: number) {
    const session = this.sessions.find(({session}) => session.id === sessionId);
    return session;
  }

  async initStudentDiary(sessionId: number) {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        return {
          status: false,
          error: 'Не удалось найти сессию Сетевого Города.',
        };
      }

      const cookie = this.utils.cookieArrayToString(session.cookies);

      const request = await axios({
        method: 'get',
        url: 'https://dnevnik.school59-ekb.ru/webapi/student/diary/init',
        headers: {
          cookie,
          at: session.at,
        },
      });

      const data = request.data as InitStudentDiary;

      return {
        status: true,
        data,
      };
    } catch (error) {
      return {
        status: false,
        error: `${error}`,
      };
    }
  }

  async getStudentDiary(sessionId: number) {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        return {
          status: false,
          error: 'Не удалось найти сессию Сетевого Города.',
        };
      }

      const cookie = this.utils.cookieArrayToString(session.cookies);

      const studentData = await this.initStudentDiary(sessionId);
      if (!studentData.status) return;

      const {students} = studentData.data!;
      const studentId = students[0].studentId;

      const request = await axios({
        method: 'get',
        url: 'https://dnevnik.school59-ekb.ru/webapi/student/diary',
        headers: {
          cookie,
          at: session.at,
        },
        params: {
          studentId,
          vers: '1662641927280',
          weekEnd: '2023-05-31',
          weekStart: '2022-09-01',
          withLaAssigns: true,
          yearId: 2,
        },
      });

      const studentDiary = request.data as GetStudentDiary;

      return {
        status: true,
        studentData,
        studentDiary,
      };
    } catch (error) {
      return {
        status: false,
        error: `${error}`,
      };
    }
  }
}

export default NetCityAPI;
