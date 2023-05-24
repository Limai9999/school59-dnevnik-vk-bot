import Config from '../modules/Config';

import { VKConfig } from '../types/Configs/VKConfig';
import { MongoConfig } from '../types/Configs/MongoConfig';
import { MainConfig } from '../types/Configs/MainConfig';
import { EventConfig } from '../types/Configs/EventConfig';
import { TikTokConfig } from '../types/Configs/TikTokConfig';
import { ServerConfig } from '../types/Configs/ServerConfig';
import { GIAExamsDataConfig } from '../types/Configs/GIAExamsDataConfig';

import { GetTotalStudentReport } from '../types/Responses/API/grades/GetTotalStudentReport';
import { Attachment } from '../types/Responses/API/netCity/GetAnnouncementsResponse';

export function getVKConfig(): VKConfig {
  return new Config('vk.json').getData();
}

export function getMongoDBConfig(): MongoConfig {
  return new Config('mongodb.json').getData();
}

export function getMainConfig(): MainConfig {
  return new Config('main.json').getData();
}

export function getEventConfig(): EventConfig {
  return new Config('event.json').getData();
}

export function getTikTokConfig(): TikTokConfig {
  return new Config('tiktok.json').getData();
}

export function getGradesDebugData(): GetTotalStudentReport {
  return new Config('gradesDebugData.json').getData();
}

export function getScheduleDebugData(): Attachment[] {
  return new Config('scheduleDebugData.json').getData();
}

export function getServerConfig(): ServerConfig {
  return new Config('server.json').getData();
}

export function getGIAExamsDataConfig(): GIAExamsDataConfig {
  return new Config('GIAExamsData.json').getData();
}

export function getPreviewGradesReport(): GetTotalStudentReport {
  return new Config('previewGradesReport.json').getData();
}

export function getPreviewScheduleData(): Attachment[] {
  return new Config('previewScheduleData.json').getData();
}