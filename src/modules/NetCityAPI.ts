import axios from 'axios';

import {GetCookiesResponse} from '../types/Responses/API/netCity/GetCookiesResponse';
import {GetStudentDiary} from '../types/Responses/API/netCity/GetStudentDiary';
import {InitStudentDiary} from '../types/Responses/API/netCity/InitStudentDiary';
import {GetAnnouncementsResponse, Attachment} from '../types/Responses/API/netCity/GetAnnouncementsResponse';
import {DownloadAttachmentResponse} from '../types/Responses/API/netCity/DownloadAttachmentResponse';

import {MainConfig} from '../types/Configs/MainConfig';

import {getMainConfig} from '../utils/getConfig';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';
import Password from './Password';

interface Session extends GetCookiesResponse {
  peerId: number
}

class NetCityAPI {
  sessions: Session[];

  vk: VK;
  classes: Classes;
  utils: Utils;

  config: MainConfig;

  constructor(vk: VK, classes: Classes, utils: Utils) {
    this.sessions = [];

    this.vk = vk;
    this.classes = classes;
    this.utils = utils;

    this.config = getMainConfig();
  }

  async startSessionAutoCreating(peerId: number, index: number = 1) {
    if (this.utils.checkIfPeerIsDM(peerId)) return;

    const autoUpdateTime = 1000 * 60 * (25 + index * 1.5);

    const credentials = await this.getCredentials(peerId);
    if (!credentials) return false;

    const {login, password, className} = credentials;

    const update = async () => {
      const session = await this.createSession(peerId, login, password);
      if (!session.status) return console.log(`Не удалось обновить сессию Сетевого Города в классе ${peerId} - ${className}.`.bgRed.cyan);

      await this.classes.setNetCitySessionId(peerId, session.session.id);

      console.log(`В классе ${peerId} - ${className} успешно обновлена сессия Сетевого Города.`.cyan);
    };

    setInterval(update, autoUpdateTime);

    console.log(`В классе ${peerId} - ${className} теперь авто-обновляется сессия Сетевого Города.`.cyan);

    return true;
  }

  async getCredentials(peerId: number) {
    const {netCityData, className} = await this.classes.getClass(peerId);
    if (!netCityData || !className) return false;

    const decryptedPassword = new Password(netCityData.password!, true).decrypt();

    return {
      login: netCityData.login!,
      password: decryptedPassword,
      className,
    };
  }

  async createSession(peerId: number, login: string, password: string): Promise<Session> {
    const existingSession = this.getSessionByPeerId(peerId);
    if (existingSession) await this.closeSession(existingSession.session.id);

    try {
      const request = await axios({
        url: `${this.config.APIUrl}/netcity/getCookies`,
        data: {login, password},
      });

      const session: Session = {
        peerId,
        ...request.data as GetCookiesResponse,
      };

      if (session.status) {
        this.sessions.push(session);

        const endTime = session.session.endTime - Date.now();

        setTimeout(() => {
          this.closeSession(session.session.id);
        }, endTime);
      }

      return session;
    } catch (error) {
      console.log('createSession ошибка'.red, error);

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

  async closeSession(sessionId: number) {
    const request = await axios({
      url: `${this.config.APIUrl}/netcity/closeSession`,
      data: {sessionId},
    });

    const data = request.data as {
      status: boolean
      error?: string
    };

    this.sessions = this.sessions.filter((session) => session.session.id !== sessionId);

    return data;
  }

  async findOrCreateSession(peerId: number, login: string, password: string, forceCreate: boolean): Promise<Session> {
    const existingSession = this.getSessionByPeerId(peerId);
    if (existingSession && !forceCreate) {
      const isEnded = existingSession.session.endTime - Date.now() < 0;

      if (isEnded) {
        await this.closeSession(existingSession.session.id);
        return await this.createSession(peerId, login, password);
      }

      return existingSession;
    }

    return await this.createSession(peerId, login, password);
  }

  getSession(sessionId: number) {
    const session = this.sessions.find(({session}) => session.id === sessionId);
    return session;
  }

  getSessionByPeerId(peerId: number) {
    const session = this.sessions.find((session) => session.peerId === peerId);
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
      console.log('InitStudentDiary ошибка'.red, error);

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
      console.log('GetStudentDiary ошибка'.red, error);

      return {
        status: false,
        error: `${error}`,
      };
    }
  }

  async getAnnouncements(sessionId: number) {
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
        url: 'https://dnevnik.school59-ekb.ru/webapi/announcements',
        headers: {
          cookie,
          at: session.at,
        },
      });

      const data = request.data as GetAnnouncementsResponse;

      return {
        status: true,
        announcements: data,
      };
    } catch (error) {
      console.log('getAnnouncements ошибка'.red, error);

      return {
        status: false,
        error: `${error}`,
      };
    }
  }

  async downloadAttachment(sessionId: number, attachment: Attachment): Promise<DownloadAttachmentResponse> {
    const attachmentId = attachment.id;
    const filename = attachment.name;

    try {
      const request = await axios({
        method: 'post',
        url: `${this.config.APIUrl}/netcity/downloadAttachment`,
        data: {sessionId, attachmentId, filename},
      });

      const data = request.data as DownloadAttachmentResponse;

      return data;
    } catch (error) {
      console.log('downloadAttachment ошибка'.red, error);

      return {
        status: false,
        error: `${error}`,
        filename,
      };
    }
  }
}

export default NetCityAPI;
