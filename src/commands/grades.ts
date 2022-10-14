import {CommandInputData, CommandOutputData} from '../types/Commands';

import {GradesPayload} from '../types/VK/Payloads/GradesPayload';

async function command({message, classes, args, vk}: CommandInputData) {
  await classes.setLoading(message.peerId, false);

  await vk.sendMessage({
    peerId: message.peerId,
    message: 'Эта команда еще не реализована.',
  });
};

const cmd: CommandOutputData = {
  name: 'оценки',
  aliases: ['grades'],
  description: null,
  payload: {
    command: 'grades',
    data: {action: 'today'},
  } as GradesPayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
