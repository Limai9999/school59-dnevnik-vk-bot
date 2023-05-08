import { StartPayload } from '../types/VK/Payloads/StartPayload';

import { CommandInputData, CommandOutputData } from '../types/Commands';

async function command({ message, vk }: CommandInputData) {
  const msg =
  `
Привет!

Этот бот умеет показывать школьное расписание уроков для твоего класса, а также показывать отчёт об оценках и оповещать об обновлениях в них и т.д.
Если вы хотите ознакомиться со всеми командами бота, перейдите в дополнительное меню бота.

Для использования большинства функций, вам необходимо оплатить подписку.
Узнайте больше о ней, воспользовавшись кнопкой "Подписка".
  `;

  return await vk.sendMessage({
    peerId: message.peerId,
    message: msg,
  });
}

const cmd: CommandOutputData = {
  name: 'начать',
  aliases: [],
  description: 'начальная команда',
  payload: {
    command: 'start',
  } as StartPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
    paidSubscription: false,
    payloadOnly: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: false,
  howToUse: null,
  execute: command,
};

export default cmd;
