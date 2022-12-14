import moment from 'moment';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

import { SubscriptionData } from '../types/Subscription/SubscriptionData';

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
      const newData: SubscriptionData = { active: false, endDate: 0 };
      await this.updateSubscription(peerId, newData, false);

      return newData;
    }

    const { active, endDate } = classData.subscription;

    const isExpired = endDate! < Date.now();
    if (active && isExpired) {
      const newData: SubscriptionData = { active: false, endDate: endDate! };
      await this.updateSubscription(peerId, newData, false);

      await this.vk.sendMessage({
        message: '⚠️ Ваша подписка истекла.\nПродлите её, если хотите продолжить пользоваться функциями бота.',
        peerId,
      });

      return newData;
    }

    return { active: active!, endDate: endDate! };
  }

  async updateSubscription(peerId: number, subscription: SubscriptionData, notifyUser: boolean) {
    await this.classes.setSubscription(peerId, subscription);

    const endDateString = moment(subscription.endDate).format('LLL');
    const statusString = subscription.active ? `активна, действует до ${endDateString}` : 'неактивна';

    if (notifyUser) {
      await this.vk.sendMessage({
        peerId,
        message: `Ваша подписка была обновлена.\nТеперь она ${statusString}.`,
      });
    }

    console.log(`Подписка в ${peerId} была обновлена. Теперь она ${subscription.active ? 'активна' : 'неактивна'}.`.yellow);
  }
}

export default Subscription;
