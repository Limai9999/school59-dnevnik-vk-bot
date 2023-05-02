import moment from 'moment';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

import { SubscriptionData } from '../types/Subscription/SubscriptionData';

class Subscription {
  vk: VK;
  classes: Classes;
  utils: Utils;

  setupUserFeatures: (peerId: number) => Promise<void>;

  constructor(vk: VK, classes: Classes, utils: Utils, setupUserFeatures: (peerId: number) => Promise<void>) {
    this.vk = vk;
    this.classes = classes;
    this.utils = utils;
    this.setupUserFeatures = setupUserFeatures;
  }

  async checkSubscription(peerId: number, doActions = true): Promise<SubscriptionData> {
    const classData = await this.classes.getClass(peerId);

    if (!classData.subscription) {
      const newData: SubscriptionData = { peerId, active: false, endDate: 0 };
      if (!doActions) return newData;

      await this.updateSubscription(peerId, newData, false);

      return newData;
    }

    const { active, endDate } = classData.subscription;

    const isExpired = endDate! < Date.now();
    if (active && isExpired) {
      const newData: SubscriptionData = { peerId, active: false, endDate: endDate! };
      await this.updateSubscription(peerId, newData, false);

      await this.vk.sendMessage({
        message: '⚠️ Ваша подписка истекла.\nПродлите её, если хотите продолжить пользоваться функциями бота.',
        peerId,
      });

      return newData;
    }

    return { peerId, active: active!, endDate: endDate! };
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

    subscription.active ? await this.setupUserFeatures(peerId) : null;

    return subscription;
  }

  async getSubscriptions(): Promise<SubscriptionData[]> {
    const classes = await this.classes.getAllClasses();

    const onlyDMs: number[] = classes.map((classData) => {
      const isDM = this.utils.checkIfPeerIsDM(classData.id);
      if (isDM) return classData.id;
    }).filter((id) => id);

    const subscriptions = await Promise.all(onlyDMs.map(async (userId) => {
      const subscriptionData = await this.checkSubscription(userId);
      return subscriptionData;
    }));

    return subscriptions;
  }

  async remindForSubscription(peerId: number): Promise<boolean> {
    try {
      const subscription = await this.checkSubscription(peerId);

      if (subscription.active) {
        // TODO: *
        return true;
      } else {
        await this.vk.sendMessage({
          message: 'Привет! Не забыл про меня? Ты и вправду стал пользоваться Сетевым Городом для получения расписания и оценок? Это же слишком долго и не удобно!\n\nПодключи подписку за 40 рублей на месяц и получай автоматическую информацию об обновлениях в оценках и расписании.',
          peerId,
        });

        return true;
      }
    } catch (error) {
      return false;
    }
  }
}

export default Subscription;
