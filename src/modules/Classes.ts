import Class from '../models/Class';

import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';

export default class Classes {
  async getClass(peerId: number) {
    let data = await Class.findOne({id: peerId});

    if (!data) {
      data = await Class.create({id: peerId});
      console.log(`Создан класс ${peerId}`.bgYellow);
    }

    return data;
  }

  async getAllClasses() {
    const classes = await Class.find();
    return Array.from(classes);
  }

  async addLastSentMessage(peerId: number, messageId: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $push: {lastSentMessages: messageId},
    });
  }

  async removeLastSentMessage(peerId: number, messageId: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $pull: {lastSentMessages: messageId},
    });
  }

  async setMessagesHandlingStatus(peerId: number, status: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {handleMessages: status},
    });
  }

  async setNetCityData(peerId: number, credentials: {login: string, password: string}) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {netCityData: credentials},
    });
  }

  async setClassName(peerId: number, className: string) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {className},
    });
  }

  async setSchedule(peerId: number, schedule: ParseScheduleResponse[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {schedule},
    });
  }

  async setLastUpdatedScheduleDate(peerId: number, lastUpdatedScheduleDate: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {lastUpdatedScheduleDate},
    });
  }

  async setLoading(peerId: number, isLoading: boolean) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {isLoading},
    });
  }

  async setConnectedProfiles(peerId: number, connectedProfiles: number[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {connectedProfiles},
    });
  }

  async setManualSchedule(peerId: number, manualSchedule: ParseScheduleResponse[]) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {manualSchedule},
    });
  }

  async setNetCitySessionId(peerId: number, netcitySessionId: number) {
    const classData = await this.getClass(peerId);
    await classData.updateOne({
      $set: {netcitySessionId},
    });
  }
};
