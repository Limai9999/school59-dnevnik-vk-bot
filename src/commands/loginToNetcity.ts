import { Keyboard } from 'vk-io';

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { LoginToNetcityPayload } from '../types/VK/Payloads/LoginToNetcityPayload';

import { LoginToNetcityKeyboard } from '../keyboards/LoginToNetcityKeyboard';

async function command({ vk, classes, message, netcityAPI, payload, utils }: CommandInputData) {
  let loadingMessageID = 0;
  const peerId = message.peerId;

  const loginToNetcityPayload = payload as LoginToNetcityPayload;
  const action = loginToNetcityPayload.data.action;

  await netcityAPI.startSessionAutoCreating(peerId);

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  const sendFinalMessage = async (message: string, isError = false) => {
    removeLoadingMessage();

    await classes.setLoading(peerId, false);

    const keyboard = Keyboard.builder().inline();

    if (isError) {
      keyboard.textButton({
        label: 'Попробовать снова',
        color: 'secondary',
        payload: { command: 'loginToNetcity', data: { action: 'login' } } as LoginToNetcityPayload,
      });
    }

    return vk.sendMessage({
      message,
      peerId: peerId,
      keyboard,
    });
  };

  if (action === 'login') {
    await classes.setLoading(peerId, true);

    loadingMessageID = await vk.sendMessage({
      message: 'Подождите, идёт вход...',
      peerId,
    });

    const session = await netcityAPI.findOrCreateSession(peerId, !message.isDM);
    if (!session) return sendFinalMessage('Не введены данные для Сетевого Города или название класса.\nПросмотрите список команд, чтобы узнать, как ввести данные.');

    // console.log(`Успешно создана сессия ${netCityData.login!}`, session);
    // console.log('cookie', utils.cookieArrayToString(session.cookies));

    if (!session.status) {
      console.log('loginToNetcity error'.red, session);
      return sendFinalMessage(`Не удалось войти в Сетевой Город, ошибка:\n${session.error!}`, true);
    }

    await classes.setNetCitySessionId(peerId, session.session.id);

    if (!message.isDM) {
      removeLoadingMessage();
      return sendFinalMessage('Сессия Сетевого Города успешно обновлена.');
    }

    const studentData = await netcityAPI.initStudentDiary(session.session.id);
    if (!studentData.status) return sendFinalMessage(`Не удалось получить информацию о ученике, ошибка:\n${studentData.error!}`, true);

    const { students } = studentData.data!;
    const { nickName } = students[0];

    const studentString = `Ученик: ${nickName}\nID сессии: ${session.session.id}`;

    removeLoadingMessage();
    await classes.setLoading(peerId, false);

    const keyboard = LoginToNetcityKeyboard;

    await vk.sendMessage({
      peerId,
      message: `Вы успешно вошли в Сетевой Город.\n\n${studentString}\n\nВыберите действие:`,
      keyboard,
    });
  } else if (action === 'logout') {
    await classes.setLoading(peerId, true);

    const classData = await classes.getClass(peerId);
    const sessionId = classData.netcitySessionId;

    if (!sessionId) {
      await vk.sendMessage({
        peerId,
        message: 'Вы ещё не вошли в Сетевой Город.',
      });
    }

    const closeStatus = await netcityAPI.closeSession(sessionId!);

    const msg = closeStatus.status ? 'Вы успешно вышли из Сетевого Города.' : `Не удалось выйти из Сетевого Города, ошибка:\n${closeStatus.message!}\n\nВ любом случае, сессия уже закрыта полностью, попробуйте войти снова.`;

    await classes.setLoading(peerId, false);

    await vk.sendMessage({
      message: msg,
      peerId,
    });
  }
}

const cmd: CommandOutputData = {
  name: 'войти в Сетевой Город',
  aliases: ['loginToNetcity'],
  description: null,
  payload: {
    command: 'loginToNetcity',
    data: { action: 'login' },
  } as LoginToNetcityPayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: true,
    payloadOnly: true,
  },
  keyboardData: {
    color: Keyboard.POSITIVE_COLOR,
    positionSeparatelyFromAllButton: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
