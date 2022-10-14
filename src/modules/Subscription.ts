import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

import {SubscriptionData} from '../types/Subscription/SubscriptionData';

class Subscription {
  vk: VK;
  classes: Classes;
  utils: Utils;

  constructor(vk: VK, classes: Classes, utils: Utils) {
    this.vk = vk;
    this.classes = classes;
    this.utils = utils;
  }

  async checkSubscription(peerId: number): Promise<SubscriptionData> {
    const classData = await this.classes.getClass(peerId);

    if (!classData.subscription) {
      const newData: SubscriptionData = {active: false, endDate: 0};
      await this.updateSubscription(peerId, newData);

      return newData;
    }

    const {active, endDate} = classData.subscription;

    const isExpired = endDate! < Date.now();
    if (active && isExpired) {
      const newData: SubscriptionData = {active: false, endDate: endDate!};
      await this.updateSubscription(peerId, newData);

      await this.vk.sendMessage({
        message: `⚠️ Ваша подписка истекла, продлите её, если хотите пользоваться ботом.`,
        peerId,
      });

      return newData;
    }

    return {active: active!, endDate: endDate!};
  }

  async updateSubscription(peerId: number, subscription: SubscriptionData) {
    await this.classes.setSubscription(peerId, subscription);

    console.log(`Подписка в ${peerId} была обновлена. Теперь она ${subscription.active ? 'активна' : 'неактивна'}.`.yellow);
  }
}

export default Subscription;
