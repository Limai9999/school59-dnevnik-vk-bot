import moment from 'moment';
import { Keyboard } from 'vk-io';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

import { SubscriptionData } from '../types/Subscription/SubscriptionData';
import { SubscriptionPayload } from '../types/VK/Payloads/SubscriptionPayload';

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

    if (subscription.active) {
      await this.setupUserFeatures(peerId);
      await this.classes.setHasEverBoughtSubscription(peerId, true);
    }

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
      const classData = await this.classes.getClass(peerId);
      const [name] = (await this.vk.getRealUserName(peerId)).split(' ');

      const subscription = await this.checkSubscription(peerId);
      const wasSubscribed = classData.hasEverBoughtSubscription;

      if (subscription.active) {
        // TODO: *
        return true;
      } else {
        let msg = '';

        if (wasSubscribed) {
          msg =
          `
Привет, ${name}!

Неужели ты забыл про меня и мои возможности?
Ты и вправду стал пользоваться Сетевым Городом для получения расписания и оценок? Это же слишком долго и не удобно!

К тому же, он не оповещает тебя об изменениях расписания или оценок.

Подключи ежемесячную подписку всего за ${this.vk.mainConfig.subscriptionPrice} рублей и получай автоматически обновляемую информацию об оценках и расписании.
          `;
        } else {
          msg =
          `
Привет, ${name}!

Неужели ты пользуешься Сетевым Городом для получения расписания и оценок? Это же слишком долго и не удобно!

К тому же, он не оповещает тебя об изменениях расписания или оценок.

Узнай подробности и подключи ежемесячную подписку всего за ${this.vk.mainConfig.subscriptionPrice} рублей и получай автоматически обновляемую информацию об оценках и расписании.
          `;
        }

        const keyboard = Keyboard.builder()
          .inline()
          .textButton({
            label: 'Подписаться',
            color: Keyboard.POSITIVE_COLOR,
            payload: { command: 'subscription', data: { action: 'subscribe' } } as SubscriptionPayload,
          })
          .row()
          .textButton({
            label: 'Зачем нужна подписка?',
            color: Keyboard.PRIMARY_COLOR,
            payload: { command: 'subscription', data: { action: 'whatCanItDo' } } as SubscriptionPayload,
          });

        await this.vk.sendMessage({
          message: msg,
          peerId,
          keyboard,
        });

        return true;
      }
    } catch (error) {
      return false;
    }
  }
}

export default Subscription;
