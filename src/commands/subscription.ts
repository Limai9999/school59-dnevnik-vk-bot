import { Keyboard } from 'vk-io';
import moment from 'moment';

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { SubscriptionPayload } from '../types/VK/Payloads/SubscriptionPayload';
import { PreviewCommandPayload } from '../types/VK/Payloads/PreviewCommandPayload';

async function command({ message, vk, subscription, payload }: CommandInputData) {
  if (!payload) return;

  const { peerId } = message;

  const subscriptionPayload = payload as SubscriptionPayload;
  const action = subscriptionPayload.data.action;

  const subscriptionData = await subscription.checkSubscription(peerId);

  const endDate = moment(subscriptionData.endDate).format('LLL');
  const statusString = subscriptionData.active ? `Ваша подписка активна\n\nДействует до ${endDate}` : 'У вас нет активной подписки.';

  if (action === 'status') {
    const keyboard = Keyboard.builder()
      .inline();

    if (!subscriptionData.active) {
      keyboard.textButton({
        label: 'Подписаться',
        color: Keyboard.POSITIVE_COLOR,
        payload: { command: 'subscription', data: { action: 'subscribe' } } as SubscriptionPayload,
      }).row();
    }

    // keyboard.textButton({
    //   label: 'Зачем нужна подписка?',
    //   color: Keyboard.PRIMARY_COLOR,
    //   payload: { command: 'subscription', data: { action: 'whatCanItDo' } } as SubscriptionPayload,
    // });

    await vk.sendMessage({
      peerId,
      message: `${statusString}\n\nВыберите действие:`,
      keyboard,
    });
  } else if (action === 'whatCanItDo') {
    const msg =
  `
Для чего нужна подписка?

С подпиской у вас появляется доступ ко всем функциям этого бота:

• Вход и сохранение сессии Сетевого Города.
Сохранение сессии означает, что вам не нужно постоянно вводить логин и пароль и ждать пока произойдет вход. Все делается автоматически.

• Получение расписания уроков и оповещение об изменениях в нём.

• И самое главное - вы сможете получать точную информацию о всех ваших оценках:
⠀⠀· Бот определяет, будете ли вы аттестованы в четверти.
⠀⠀· Определяет итоговую оценку в четверти по баллу.
⠀⠀· Оповещает о любых изменениях в ваших оценках, с самого первого дня четверти!

Взгляните сами!
Выберите ниже, о чем бы вы хотели узнать поподробнее.
  `;

    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: 'Вход в Сетевой Город',
        color: Keyboard.PRIMARY_COLOR,
        payload: { command: 'previewCommand', data: { action: 'netcityLoginExample' } } as PreviewCommandPayload,
      })
      .row()
      .textButton({
        label: 'Оценки',
        color: Keyboard.POSITIVE_COLOR,
        payload: { command: 'previewCommand', data: { action: 'gradesExample' } } as PreviewCommandPayload,
      })
      .textButton({
        label: 'Расписание',
        color: Keyboard.POSITIVE_COLOR,
        payload: { command: 'previewCommand', data: { action: 'scheduleExample' } } as PreviewCommandPayload,
      });

    return await vk.sendMessage({
      peerId,
      message: msg,
      keyboard,
    });
  } else if (action === 'subscribe') {
    await vk.sendMessage({
      peerId: message.peerId,
      message: 'Эта команда еще не реализована до конца, но если вы хотите оплатить подписку, обратитесь к администратору.\n\nСтоимость подписки: 40 рублей/месяц.',
    });
  }
}

const cmd: CommandOutputData = {
  name: 'подписка',
  aliases: ['подписаться', 'subscription', 'subscribe'],
  description: null,
  payload: {
    command: 'subscription',
    data: { action: 'status' },
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
  showInAdditionalMenu: false,
  showInCommandsList: false,
  howToUse: null,
  execute: command,
};

export default cmd;
