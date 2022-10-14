import {CommandInputData, CommandOutputData} from '../types/Commands';

async function command({message, args, vk, classes}: CommandInputData) {
  const [login, password, className] = args;

  if (login.length < 4 || password.length < 35) {
    return vk.sendMessage({
      message: 'Введите корректные данные.\nЛогин должен быть больше 4 символов, а пароль зашифрован командой "шифр".',
      peerId: message.peerId,
      priority: 'low',
    });
  }

  const [classNumber, classLetter] = className.split('');
  if (!parseInt(classNumber) || parseInt(classLetter) || !classLetter) {
    return vk.sendMessage({
      message: 'Класс введён некорректно. Пример: 9б',
      peerId: message.peerId,
      priority: 'low',
    });
  }

  await classes.setNetCityData(message.peerId, {
    login,
    password,
  });
  await classes.setClassName(message.peerId, className);

  vk.sendMessage({
    message: 'Данные для Сетевого Города успешно сохранены.',
    peerId: message.peerId,
    priority: 'medium',
  });
}

const cmd: CommandOutputData = {
  name: 'сетевой город',
  aliases: ['сетевой', 'netcity', 'дневник'],
  description: 'изменить данные для входа в Сетевой Город',
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
  howToUse: '[логин] [пароль] [класс (напр: 9Б)]',
  execute: command,
};

export default cmd;
