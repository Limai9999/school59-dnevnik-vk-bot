import { CommandInputData, CommandOutputData } from '../types/Commands';

import PasswordService from '../modules/Password';

async function command({ message, args, vk }: CommandInputData) {
  const [password] = args;

  if (password.length < 6) {
    return vk.sendMessage({
      message: 'Введите корректные данные.',
      peerId: message.peerId,
      priority: 'low',
    });
  }

  const Password = new PasswordService(password, false);
  const encryptedPassword = Password.encrypt();

  await vk.sendMessage({
    message: 'Ваш зашифрованный пароль:',
    peerId: message.peerId,
    priority: 'high',
  });
  vk.sendMessage({
    message: encryptedPassword,
    peerId: message.peerId,
    priority: 'high',
  });
}

const cmd: CommandOutputData = {
  name: 'зашифровать пароль',
  aliases: ['шифр', 'cipher'],
  description: 'шифрует ваш пароль для Сетевого Города, чтобы ввести данные аккаунта в беседе',
  payload: {
    command: 'cipher',
    data: { action: 'cipher' },
  },
  requirements: {
    admin: false,
    dmOnly: true,
    chatOnly: false,
    args: 1,
    paidSubscription: false,
    payloadOnly: false,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: '[пароль]',
  execute: command,
};

export default cmd;
