import { CommandInputData, CommandOutputData } from '../types/Commands';

import { HomeworkPayload } from '../types/VK/Payloads/HomeworkPayload';

async function command({ message, vk, classes, netcityAPI, payload }: CommandInputData) {
  const { peerId } = message;

  if (!payload) return;
  const homeworkPayload = payload as HomeworkPayload;

  await homework.startAutoUpdate(peerId);

  if (homeworkPayload.data.action === 'get') {
    await classes.setLoading(peerId, true);

    let loadingMessageID = 0;

    const stopLoading = async () => {
      if (!loadingMessageID) return;
      await classes.setLoading(peerId, false);
      return vk.removeMessage(loadingMessageID, peerId);
    };

    loadingMessageID = await vk.sendMessage({
      message: 'Идёт загрузка домашнего задания...',
      peerId,
    });

    const session = await netcityAPI.findOrCreateSession(peerId, false);
    if (!session) {
      stopLoading();
      return await vk.sendMessage({
        message: 'Вы не ввели данные для Сетевого Города.',
        peerId,
        priority: 'low',
      });
    }

    if (!session.session) {
      stopLoading();
      return await vk.sendMessage({
        message: `При входе в Сетевой Город произошла ошибка:\n${session.error}`,
        peerId,
        priority: 'low',
      });
    }

    const diaryData = await netcityAPI.getStudentDiary(session.session.id);

    stopLoading();

    console.log(diaryData);
  }
}

const cmd: CommandOutputData = {
  name: 'домашнее задание',
  aliases: [],
  description: 'Показывает домашнее задание, заданное на сегодняшний и завтрашний день. Работает только по кнопкам.',
  payload: {
    command: 'homework',
    data: { action: 'get' },
  } as HomeworkPayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;