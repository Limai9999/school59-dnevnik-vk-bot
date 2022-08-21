import Class from '../models/Class';

export default class Classes {
  async getClass(peerId: number) {
    let data = await Class.findOne({id: peerId});

    if (!data) {
      data = await Class.create({id: peerId});
      console.log(`Создан класс ${peerId}`);
    }

    return data;
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
};
