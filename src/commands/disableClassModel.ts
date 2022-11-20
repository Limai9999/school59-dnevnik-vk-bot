import { CommandInputData, CommandOutputData } from '../types/Commands';
import { Payload } from '../types/VK/Payloads/Payload';

async function command({ message, vk, classes, args }: CommandInputData) {
  const [chosenIdStr] = args;
  const idNum = Number(chosenIdStr);

  if (isNaN(idNum)) {
    return await vk.sendMessage({
      peerId: message.peerId,
      message: 'ты тупой овощ как ты мог ошибиться в такой команде',
    });
  }

  await classes.setDisabledStatus(idNum, true);

  return await vk.sendMessage({
    peerId: message.peerId,
    message: `Класс ${idNum} отключён.\nПерезагрузи бота.`,
  });
}

const cmd: CommandOutputData = {
  name: 'disableClassModel',
  aliases: [],
  description: 'отключить модель определенного класса',
  payload: { command: 'disableClassModel' } as Payload,
  requirements: {
    admin: true,
    dmOnly: false,
    args: 1,
    paidSubscription: false,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: '[peerId класса]',
  execute: command,
};

export default cmd;
