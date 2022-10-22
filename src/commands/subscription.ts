import {Keyboard} from 'vk-io';
import moment from 'moment';

import {CommandInputData, CommandOutputData} from '../types/Commands';

import {SubscriptionPayload} from '../types/VK/Payloads/SubscriptionPayload';

async function command({message, vk, subscription, payload}: CommandInputData) {
  const {peerId} = message;

  const subscriptionPayload = payload as SubscriptionPayload;
  const action = subscriptionPayload.data.action;

  const subscriptionData = await subscription.checkSubscription(peerId);

  const endDate = moment(subscriptionData.endDate).format('LLL');
  const statusString = subscriptionData.active ? `Ваша подписка активна\n\nДействует до ${endDate}` : 'У вас нет активной подписки.';

  if (action === 'status') {
    const keyboard = Keyboard.builder();

    if (!subscriptionData.active) {
      keyboard.textButton({
        label: 'Подписаться',
        color: Keyboard.POSITIVE_COLOR,
        payload: {command: 'subscription', data: {action: 'subscribe'}} as SubscriptionPayload,
      }).row();
    }

    keyboard.textButton({
      label: 'Зачем нужна подписка?',
      color: Keyboard.PRIMARY_COLOR,
      payload: {command: 'subscription', data: {action: 'whatCanItDo'}} as SubscriptionPayload,
    });

    await vk.sendMessage({
      peerId,
      message: `${statusString}\n\nВыберите действие:`,
      keyboard,
    });
  } else if (action === 'whatCanItDo') {}

  await vk.sendMessage({
    peerId: message.peerId,
    message: 'Эта команда еще не реализована, но если вы хотите оплатить подписку, обратитесь к администратору.',
  });
}

const cmd: CommandOutputData = {
  name: 'подписка',
  aliases: ['подписаться', 'subscription', 'subscribe'],
  description: 'оплатить подписку для дополнительных функций в личных сообщениях, например: получение расписания или оценок',
  payload: {
    command: 'subscription',
    data: {action: 'status'},
  } as SubscriptionPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
    paidSubscription: false,
  },
  keyboardData: {
    color: Keyboard.POSITIVE_COLOR,
    positionSeparatelyFromAllButton: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
