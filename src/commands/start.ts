import { StartPayload } from '../types/VK/Payloads/StartPayload';

import { CommandInputData, CommandOutputData } from '../types/Commands';

async function command({ message, vk }: CommandInputData) {
  const [name] = (await vk.getRealUserName(message.peerId)).split(' ');

  const msg =
  `
Привет, ${name}!

Этот бот умеет показывать школьное расписание уроков для твоего класса, а также отображать ваш отчёт об оценках и оповещать обо всех обновлениях в них.
Если вы хотите ознакомиться со всеми возможностями бота, перейдите в дополнительное меню бота.

Для использования большинства функций бота, необходимо иметь активную подписку.
Узнайте больше о ней и её возможностях, воспользовавшись кнопкой "Подписка".
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
    chatOnly: false,
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
