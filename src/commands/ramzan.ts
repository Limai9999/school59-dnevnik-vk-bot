import {CommandInputData, CommandOutputData} from '../types/Commands';

async function command({message, vk}: CommandInputData) {
  const awards = [
    'плитка говна',
    'стакан чечни',
    'Чечня',
    'Чеченская Республика',
    'приложение Чечня на ваш гандондройд',
  ];

  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const answers = [
    'Здравствуйте',
    'Рамзан не придумал ответа',
    'Чечня не дала ответа',
    'Если это написал Артем Рулетов, то пожалуйста извинись.',
    `Рамзан Кадыров награждает вас: ${random(awards)}`,
    'Артем Рулетов отключись',
  ];

  const answer = random(answers);

  vk.sendMessage({
    message: answer,
    peerId: message.peerId,
    priority: 'low',
  });
}

const cmd: CommandOutputData = {
  name: 'рамзан',
  aliases: ['ramzan'],
  description: 'тестовая команда',
  payload: {
    command: 'ramzan',
    data: {action: 'ramzan'},
  },
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
