import Password from '../modules/Password';
import {CommandInputData, CommandOutputData} from '../types/Commands';

async function command({message, args, vk, classes, netcityAPI}: CommandInputData) {
  const [login, inputPassword, className] = args;

  if (login.length < 4 || inputPassword.length < 4 || (inputPassword.length < 35 && !message.isDM)) {
    let resultMessage = 'Введите корректные данные.\nЛогин и пароль должны быть больше 4 символов';

    if (!message.isDM) {
      resultMessage += ', причем пароль должен быть зашифрован командой "зашифровать пароль".';
    }

    return vk.sendMessage({
      message: resultMessage,
      peerId: message.peerId,
      priority: 'low',
    });
  }

  if (inputPassword.length >= 35 && message.isDM) {
    return vk.sendMessage({
      message: 'Для изменения данных Сетевого Города в личных сообщениях вам не нужно зашифровывать пароль.',
      peerId: message.peerId,
    });
  }

  const [classNumber, classLetter] = className.split('');
  if (!parseInt(classNumber) || parseInt(classLetter) || !classLetter) {
    return vk.sendMessage({
      message: 'Класс введён некорректно.\nПример: 9б',
      peerId: message.peerId,
      priority: 'low',
    });
  }

  const password = message.isDM ?
        new Password(inputPassword, false).encrypt() :
        inputPassword;

  await classes.setNetCityData(message.peerId, {
    login,
    password,
  });
  await classes.setClassName(message.peerId, className);

  await netcityAPI.startSessionAutoCreating(message.peerId);

  vk.sendMessage({
    message: 'Данные для Сетевого Города успешно сохранены.',
    peerId: message.peerId,
    priority: 'medium',
  });
}

const cmd: CommandOutputData = {
  name: 'сетевой город',
  aliases: ['сетевой', 'netcity', 'дневник'],
  description: 'ввести данные для входа в Сетевой Город',
  payload: {
    command: 'netcity',
    data: {action: 'netcity'},
  },
  requirements: {
    admin: false,
    dmOnly: false,
    args: 3,
    paidSubscription: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: '[логин] [пароль] [класс (напр: 9б)]',
  execute: command,
};

export default cmd;
