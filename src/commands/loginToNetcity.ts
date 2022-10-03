import {Keyboard} from 'vk-io';

import {CommandInputData, CommandOutputData} from '../types/Commands';

import Password from '../modules/Password';

import {LoginToNetcityPayload} from '../types/VK/Payloads/LoginToNetcityPayload';
import {GradesPayload} from '../types/VK/Payloads/GradesPayload';
import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';

async function command({vk, classes, message, netcityAPI, payload}: CommandInputData) {
  let loadingMessageID = 0;
  const peerId = message.peerId;
  const loginToNetcityPayload = payload as LoginToNetcityPayload;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  const sendFinalMessage = async (errorMessage: string) => {
    removeLoadingMessage();

    await classes.setLoading(peerId, false);

    return vk.sendMessage({
      message: errorMessage,
      peerId: peerId,
    });
  };

  if (!loginToNetcityPayload || loginToNetcityPayload.data.action === 'login') {
    await classes.setLoading(peerId, true);

    loadingMessageID = await vk.sendMessage({
      message: 'Подождите, идёт вход...',
      peerId,
    });

    const {netCityData, className} = await classes.getClass(peerId);
    if (!netCityData || !className) {
      return sendFinalMessage('Не введены данные для Сетевого Города или название класса.');
    }

    const decryptedPassword = new Password(netCityData.password!, true).decrypt();

    const session = await netcityAPI.createSession(peerId, netCityData.login!, decryptedPassword);
    if (!session.status) return sendFinalMessage(`Не удалось войти в Сетевой Город, ошибка:\n${session.error!}`);

    await classes.setNetCitySessionId(peerId, session.session.id);

    const studentData = await netcityAPI.initStudentDiary(session.session.id);
    if (!studentData.status) return sendFinalMessage(`Не удалось получить информацию о ученике, ошибка:\n${studentData.error!}`);

    const {students} = studentData.data!;
    const {nickName} = students[0];

    const studentString = `Ученик: ${nickName}`;

    removeLoadingMessage();
    await classes.setLoading(peerId, false);

    console.log('studentData', studentData);

    const keyboard = Keyboard.builder()
        .inline()
        .textButton({
          label: 'Расписание на сегодня',
          color: Keyboard.POSITIVE_COLOR,
          payload: {command: 'schedule', data: {action: 'netCityGetToday'}} as SchedulePayload,
        })
        .row()
        .textButton({
          label: 'Оценки за сегодня',
          color: Keyboard.SECONDARY_COLOR,
          payload: {command: 'grades', data: {action: 'today'}} as GradesPayload,
        })
        .textButton({
          label: 'Средний балл',
          color: Keyboard.SECONDARY_COLOR,
          payload: {command: 'grades', data: {action: 'average'}} as GradesPayload,
        })
        .row()
        .textButton({
          label: 'Выйти из Сетевого Города',
          color: Keyboard.NEGATIVE_COLOR,
          payload: {command: 'loginToNetcity', data: {action: 'logout'}} as LoginToNetcityPayload,
        });

    await vk.sendMessage({
      peerId,
      message: `Вы успешно вошли в Сетевой Город.\n\n${studentString}\n\nВыберите действие:`,
      keyboard,
    });
  } else if (loginToNetcityPayload.data.action === 'logout') {
    await classes.setLoading(message.peerId, false);

    await vk.sendMessage({
      peerId: message.peerId,
      message: 'Эта команда еще не реализована.',
    });
  }
}

const cmd: CommandOutputData = {
  name: 'войти в сетевой',
  aliases: ['loginToNetcity'],
  description: 'входит в профиль Сетевого Города, где вы можете посмотреть разные отчёты об оценках',
  payload: {
    command: 'loginToNetcity',
    data: {action: 'login'},
  } as LoginToNetcityPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
