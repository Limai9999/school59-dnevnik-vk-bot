import axios from 'axios';

import { GetCookiesResponse } from '../types/Responses/API/netCity/GetCookiesResponse';
import { GetStudentDiaryResponse, GetStudentDiary } from '../types/Responses/API/netCity/GetStudentDiary';
import { InitStudentDiaryResponse, InitStudentDiary } from '../types/Responses/API/netCity/InitStudentDiary';
import { GetAnnouncementsResponse, Attachment } from '../types/Responses/API/netCity/GetAnnouncementsResponse';
import { DownloadAttachmentResponse } from '../types/Responses/API/netCity/DownloadAttachmentResponse';
import { CloseSessionResponse } from '../types/Responses/API/netCity/CloseSessionResponse';
import { GetTotalStudentReport } from '../types/Responses/API/grades/GetTotalStudentReport';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';
import Password from './Password';
import API from './API';
import Subscription from './Subscription';

import { MainConfig } from '../types/Configs/MainConfig';

interface Session extends GetCookiesResponse {
  peerId: number
}

class NetCityAPI {
  sessions: Session[];

  vk: VK;
  classes: Classes;
  utils: Utils;
  api: API;
  subscription: Subscription;

  mainConfig: MainConfig;

  autoUpdatePeerIds: number[];
  autoUpdateCount: number;

  constructor(vk: VK, classes: Classes, utils: Utils, api: API, subscription: Subscription, mainConfig: MainConfig) {
    this.sessions = [];

    this.vk = vk;
    this.classes = classes;
    this.utils = utils;
    this.api = api;
    this.subscription = subscription;

    this.mainConfig = mainConfig;

    this.autoUpdatePeerIds = [];
    this.autoUpdateCount = 0;
  }

  async startSessionAutoCreating(peerId: number) {
    const isDM = this.utils.checkIfPeerIsDM(peerId);

    if (isDM) {
      const subscription = await this.subscription.checkSubscription(peerId);
      if (!subscription.active) return;
    }

    const isAutoUpdateAlreadyActive = this.autoUpdatePeerIds.find((autoUpdatePeerId) => autoUpdatePeerId === peerId);
    if (isAutoUpdateAlreadyActive) return;

    const credentials = await this.getCredentials(peerId);
    if (!credentials) return false;

    const { login, password, className } = credentials;

    const autoUpdateMinutes = this.mainConfig.autoUpdateMin.netcity;
    const autoUpdateTime = 1000 * 60 * (15 + this.autoUpdateCount);

    let autoUpdateInterval: NodeJS.Timer | null = null;

    autoUpdateInterval = setInterval(async () => {
      if (isDM) {
        const subscription = await this.subscription.checkSubscription(peerId);
        if (!subscription.active) {
          console.log('???? ?????????? ???????????????????? ???????????? ???????????????? ????????????, ?? ???????????????????????? ?????????????????????? ????????????????.'.bgCyan.black);

          this.autoUpdatePeerIds = this.autoUpdatePeerIds.filter((autoUpdatePeerId) => autoUpdatePeerId !== peerId);
          return clearInterval(autoUpdateInterval!);
        }
      }

      const session = await this.createSession(peerId, login, password);
      if (!session.status) return console.log(`???? ?????????????? ???????????????? ???????????? ???????????????? ???????????? ?? ???????????? ${peerId} - ${className}. ????????????:`.bgRed.cyan, session.error!);

      await this.classes.setNetCitySessionId(peerId, session.session.id);

      console.log(`?? ???????????? ${peerId} - ${className} ?????????????? ?????????????????? ???????????? ???????????????? ????????????.`.cyan);
    }, autoUpdateTime);

    this.autoUpdatePeerIds.push(peerId);

    console.log(`?? ???????????? ${peerId} - ${className} ???????????? ????????-?????????????????????? ???????????? ???????????????? ????????????. (${autoUpdateMinutes} + ${this.autoUpdateCount})`.cyan);
    this.autoUpdateCount++;

    return true;
  }

  async getCredentials(peerId: number) {
    const { netCityData, className } = await this.classes.getClass(peerId);
    if (!netCityData || !className || !netCityData.login || !netCityData.password) return false;

    const decryptedPassword = new Password(netCityData.password!, true).decrypt();

    return {
      login: netCityData.login,
      password: decryptedPassword,
      className,
    };
  }

  async createSession(peerId: number, login: string, password: string): Promise<Session> {
    const existingSession = this.getSessionByPeerId(peerId);
    if (existingSession) await this.closeSession(existingSession.session.id);

    try {
      const request = await this.api.request({
        url: '/netcity/getCookies',
        data: { login, password },
      });
      if (!request) throw new Error('???? ?????????????? ???????????????????? ?? API.');

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
      console.log('createSession ????????????'.red, error);

      return {
        peerId,
        login,
        password,
        status: false,
        error: `${error}`,
        session: { id: 0, endTime: 0 },
        at: '0',
        cookies: [],
      };
    }
  }

  async closeSession(sessionId: number): Promise<CloseSessionResponse> {
    try {
      const request = await this.api.request({
        url: '/netcity/closeSession',
        data: { sessionId },
      });
      if (!request) throw new Error('???? ?????????????? ???????????????????? ?? API.');

      const data = request.data as CloseSessionResponse;

      this.sessions = this.sessions.filter((session) => session.session.id !== sessionId);

      return data;
    } catch (error) {
      console.log('closeSession ????????????'.red, error);

      return {
        status: false,
        message: `${error}`,
      };
    }
  }

  async findOrCreateSession(peerId: number, forceCreate: boolean): Promise<Session | null> {
    const credentials = await this.getCredentials(peerId);
    if (!credentials) return null;

    const { login, password } = credentials;

    const existingSession = this.getSessionByPeerId(peerId);
    if (existingSession && existingSession.status && !forceCreate) {
      const isEnded = existingSession.session.endTime - Date.now() < 0;

      if (isEnded) {
        await this.closeSession(existingSession.session.id);
        return await this.createSession(peerId, login, password);
      }

      console.log('findOrCreateSession', 'found existing session'.green, peerId, forceCreate);

      return existingSession;
    }

    console.log('findOrCreateSession', 'unable to find existing session'.red, peerId, forceCreate);

    return await this.createSession(peerId, login, password);
  }

  getSession(sessionId: number) {
    const session = this.sessions.find(({ session }) => session.id === sessionId);
    return session;
  }

  getSessionByPeerId(peerId: number) {
    const session = this.sessions.find((session) => session.peerId === peerId);
    return session;
  }

  async initStudentDiary(sessionId: number): Promise<InitStudentDiary> {
    const session = this.getSession(sessionId);
    if (!session) {
      return {
        status: false,
        error: '???? ?????????????? ?????????? ???????????? ???????????????? ????????????.',
      };
    }

    const cookie = this.utils.cookieArrayToString(session.cookies);

    try {
      const request = await axios({
        method: 'get',
        url: 'https://dnevnik.school59-ekb.ru/webapi/student/diary/init',
        headers: {
          cookie,
          at: session.at,
        },
      });

      const data = request.data as InitStudentDiaryResponse;

      return {
        status: true,
        data,
      };
    } catch (error) {
      console.log('InitStudentDiary ????????????'.red, error);

      await this.closeSession(session.session.id);

      return {
        status: false,
        error: `${error}`,
      };
    }
  }

  async getStudentDiary(sessionId: number): Promise<GetStudentDiary> {
    try {
      const session = this.getSession(sessionId);
      if (!session) {
        return {
          status: false,
          error: '???? ?????????????? ?????????? ???????????? ???????????????? ????????????.',
        };
      }

      const cookie = this.utils.cookieArrayToString(session.cookies);

      const studentData = await this.initStudentDiary(sessionId);
      if (!studentData.status) {
        return {
          status: false,
          error: `?????? ?????????????????? ???????????????????? ???? ?????????????? ?????????????????? ????????????:\n${studentData.error}`,
        };
      }

      const { students } = studentData.data!;
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

      const studentDiary = request.data as GetStudentDiaryResponse;

      return {
        status: true,
        studentData,
        studentDiary,
      };
    } catch (error) {
      console.log('GetStudentDiary ????????????'.red, error);

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
          error: '???? ?????????????? ?????????? ???????????? ???????????????? ????????????.',
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
      console.log('getAnnouncements ????????????'.red, error);

      this.closeSession(sessionId);

      return {
        status: false,
        error: `${error}`,
      };
    }
  }

  async downloadAttachment(sessionId: number, attachment: Attachment, isTest: boolean): Promise<DownloadAttachmentResponse> {
    const attachmentId = attachment.id;
    const filename = attachment.name;

    try {
      const request = await this.api.request({
        method: 'post',
        url: '/netcity/downloadAttachment',
        data: { sessionId, attachmentId, filename, isTest },
      });
      if (!request) throw new Error('???? ?????????????? ???????????????????? ?? API.');

      const data = request.data as DownloadAttachmentResponse;

      return data;
    } catch (error) {
      console.log('downloadAttachment ????????????'.red, error);

      return {
        status: false,
        error: `${error}`,
        filename,
      };
    }
  }

  async getTotalStudentReport(peerId: number): Promise<GetTotalStudentReport> {
    try {
      const session = await this.findOrCreateSession(peerId, false);

      if (!session) {
        return {
          status: false,
          error: '???? ???? ?????????? ???????????? ?????? ???????????????? ????????????.',
          info: [],
          result: { averageGrades: [], daysData: [] },
        };
      }

      if (!session.status) {
        return {
          status: false,
          error: `?????? ?????????? ?? ?????????????? ?????????? ?????????????????? ????????????:\n${session.error}`,
          info: [],
          result: { averageGrades: [], daysData: [] },
        };
      }

      const response = await this.api.request({
        url: '/grades/getTotalStudentReport',
        data: { sessionId: session.session.id },
      });
      if (!response) throw new Error('???? ?????????????? ???????????????????? ?? API.');

      const data = response.data as GetTotalStudentReport;

      return data;
    } catch (error) {
      return {
        status: false,
        error: `${error}`,
        info: [],
        result: { averageGrades: [], daysData: [] },
      };
    }
  }
}

export default NetCityAPI;
