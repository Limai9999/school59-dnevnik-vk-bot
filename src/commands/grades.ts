import {CommandInputData, CommandOutputData} from '../types/Commands';

import {GradesPayload} from '../types/VK/Payloads/GradesPayload';

async function command({message, classes, vk, payload, grades}: CommandInputData) {
  const peerId = message.peerId;

  const gradesPayload = payload as GradesPayload;

  let loadingMessageID = 0;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  loadingMessageID = await vk.sendMessage({
    message: 'Идёт загрузка отчёта с оценками...',
    peerId,
  });

  if (gradesPayload.data.action === 'chooseMenu') {
    const report = await grades.getTotalStudentReport(peerId);

    console.log('report', report);

    removeLoadingMessage();
    await vk.sendMessage({
      message: 'done',
      peerId,
    });
  }

  await vk.sendMessage({
    peerId,
    message: 'Эта команда еще не реализована.',
  });
};

const cmd: CommandOutputData = {
  name: 'оценки',
  aliases: ['grades'],
  description: null,
  payload: {
    command: 'grades',
    data: {action: 'chooseMenu'},
  } as GradesPayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
