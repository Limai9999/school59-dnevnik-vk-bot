import {Keyboard} from 'vk-io';
import moment from 'moment';

import {CommandInputData, CommandOutputData} from '../types/Commands';

import {AdminSubscriptionManagePayload} from '../types/VK/Payloads/AdminSubscriptionManagePayload';

async function command({message, vk, args, payload, subscription}: CommandInputData) {
  const {peerId, senderId} = message;

  const [giveToIdStr] = args;
  const giveToId = Number(giveToIdStr);

  if (payload) return;

  if (!args.length) {
    return vk.sendMessage({
      peerId,
      message: 'Сначала необходимо указать ID пользователя.',
    });
  }

  if (isNaN(giveToId)) {
    return vk.sendMessage({
      peerId,
      message: 'Введённый ID неверен.',
    });
  }

  const userData = await vk.getUser(giveToId);
  if (!userData) {
    return vk.sendMessage({
      peerId,
      message: 'Не удалось найти пользователя по указанному ID.',
    });
  }

  const keyboard = Keyboard.builder()
      .inline()
      .oneTime()
      .textButton({
        label: 'Выдать подписку',
        color: Keyboard.POSITIVE_COLOR,
        payload: {command: 'manageSubscription', data: {action: 'give'}} as AdminSubscriptionManagePayload,
      })
      .row()
      .textButton({
        label: 'Забрать подписку',
        color: Keyboard.NEGATIVE_COLOR,
        payload: {command: 'manageSubscription', data: {action: 'takeAway'}} as AdminSubscriptionManagePayload,
      });

  const {first_name, last_name, id, screen_name} = userData;
  const userDataString = `${first_name} ${last_name} - @${screen_name}\nID: ${id}`;

  const lastMessageId = await vk.sendMessage({
    peerId,
    message: `${userDataString}\n\nВыберите действие:`,
    keyboard,
  });

  const newMessage = await vk.waitForMessage(peerId, senderId, lastMessageId);
  if (!newMessage) {
    return vk.sendMessage({
      peerId,
      message: 'Действия с подпиской пользователя отменены.',
    });
  }

  const newPayload = newMessage.messagePayload as AdminSubscriptionManagePayload;
  const action = newPayload.data.action;

  if (action === 'give') {
    const lastMessageId = await vk.sendMessage({
      peerId,
      message: 'На сколько дней вы хотите выдать подписку?',
    });
    const howManyDaysMessage = await vk.waitForMessage(peerId, senderId, lastMessageId);
    if (!howManyDaysMessage || !howManyDaysMessage.text) {
      return vk.sendMessage({
        peerId,
        message: 'Действия с подпиской пользователя отменены.',
      });
    }

    const setDays = Number(howManyDaysMessage.text);
    if (isNaN(setDays)) {
      return vk.sendMessage({
        peerId,
        message: 'Неверные данные.',
      });
    }

    const endDate = Date.now() + 1000 * 60 * 60 * 24 * setDays;
    await subscription.updateSubscription(id, {active: true, endDate}, true);

    const endDateString = moment(endDate).format('LLL');

    await vk.sendMessage({
      peerId,
      message: `Вы успешно выдали подписку пользователю ${first_name} ${last_name}.\nОна будет действовать до ${endDateString}.`,
    });
  } else {
    await subscription.updateSubscription(id, {active: false, endDate: 0}, true);

    await vk.sendMessage({
      peerId,
      message: `Вы успешно забрали подписку у пользователя ${first_name} ${last_name}.`,
    });
  }
}

const cmd: CommandOutputData = {
  name: 'управлять подпиской',
  aliases: ['manageSubscription'],
  description: 'выдать или забрать подписку',
  payload: {
    command: 'manageSubscription',
    data: {action: 'selectId'},
  } as AdminSubscriptionManagePayload,
  requirements: {
    admin: true,
    dmOnly: false,
    args: 1,
    paidSubscription: false,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: '[ID пользователя]',
  execute: command,
};

export default cmd;
