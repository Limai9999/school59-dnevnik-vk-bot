import moment from 'moment';
import { Keyboard } from 'vk-io';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

import { SubscriptionData } from '../types/Subscription/SubscriptionData';
import { SubscriptionPayload } from '../types/VK/Payloads/SubscriptionPayload';
import { SubscriptionConfig } from '../types/Configs/SubscriptionConfig';

import { getSubscriptionConfig } from '../utils/getConfig';
class Subscription {
  vk: VK;
  classes: Classes;
  utils: Utils;

  config: SubscriptionConfig;

  setupUserFeatures: (peerId: number) => Promise<void>;

  constructor(vk: VK, classes: Classes, utils: Utils, setupUserFeatures: (peerId: number) => Promise<void>) {
    this.vk = vk;
    this.classes = classes;
    this.utils = utils;

    this.config = getSubscriptionConfig();

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

  async addDays(peerId: number, daysToAdd: number | string): Promise<SubscriptionData> {
    const currentSubscription = await this.checkSubscription(peerId);

    const oldEndDate = currentSubscription.endDate === 0 ? Date.now() : currentSubscription.endDate;
    const newEndDate = moment(oldEndDate).add(daysToAdd, 'days').valueOf();

    const newSubscription: SubscriptionData = { peerId, active: true, endDate: newEndDate };

    await this.updateSubscription(peerId, newSubscription, true);

    return newSubscription;
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
      const usedFreeTrial = classData.usedFreeTrial;

      if (subscription.active) {
        // TODO: *
        return true;
      } else {
        let msg = '';

        const endingMessage = usedFreeTrial
          ? `Подключи ежемесячную подписку всего за ${this.config.price} рублей и получай автоматически обновляемую информацию об оценках и расписании.`
          : 'Кстати, у тебя есть возможность получить бесплатный 14-дневный пробный период. Только не используй его просто так, это одноразовая возможность :)';

        if (wasSubscribed) {
          msg =
          `
Привет, ${name}!

Неужели ты забыл про меня и мои возможности?
Ты и вправду стал пользоваться Сетевым Городом для получения расписания и оценок? Это же слишком долго и не удобно!

К тому же, он не оповещает тебя об изменениях расписания или оценок.

${endingMessage}
          `;
        } else {
          msg =
          `
Привет, ${name}!

Неужели ты пользуешься Сетевым Городом для получения расписания и оценок? Это же слишком долго и не удобно!

К тому же, он не оповещает тебя об изменениях расписания или оценок.

${endingMessage}
          `;
        }

        const keyboard = Keyboard.builder()
          .inline();

        if (usedFreeTrial) {
          keyboard.textButton({
            label: 'Подписаться',
            color: Keyboard.POSITIVE_COLOR,
            payload: { command: 'subscription', data: { action: 'subscribe' } } as SubscriptionPayload,
          });
        } else {
          keyboard.textButton({
            label: 'Активировать пробный период',
            color: Keyboard.POSITIVE_COLOR,
            payload: { command: 'subscription', data: { action: 'activateFreeTrial' } } as SubscriptionPayload,
          });
        }

        keyboard
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
