import moment from 'moment';
import {Attachment} from 'vk-io';

import {GradesKeyboard} from '../keyboards/GradesKeyboard';
import {CommandInputData, CommandOutputData} from '../types/Commands';

import {GradesPayload} from '../types/VK/Payloads/GradesPayload';

async function command({message, classes, vk, payload, grades}: CommandInputData) {
  const peerId = message.peerId;

  const gradesPayload = payload as GradesPayload;
  const action = gradesPayload.data.action;

  let loadingMessageID = 0;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  loadingMessageID = await vk.sendMessage({
    message: 'Идёт загрузка отчёта с оценками...',
    peerId,
  });

  const report = await grades.getTotalStudentReport(peerId, !!gradesPayload.data.forceUpdate);
  removeLoadingMessage();

  if (action === 'update') {
    const classData = await classes.getClass(peerId);

    console.log(report);

    if (!report.status) {
      return vk.sendMessage({
        message: `Не удалось получить отчёт с оценками, ошибка:\n${report.error!}`,
        peerId,
      });
    }

    const studentInfo = report.info.join('\n');

    let totalGrades = 0;
    report.result.daysData.map((day) => {
      day.lessonsWithGrades.map((lessonWithGrade) => {
        totalGrades += lessonWithGrade.grades.length;
      });
    });
    const totalGradesString = `Всего оценок: ${totalGrades}`;

    const lastUpdatedString = `Обновлен: ${moment(classData.lastUpdatedTotalStudentReport).fromNow()}`;

    const keyboard = GradesKeyboard;

    await vk.sendMessage({
      peerId,
      message: `Отчёт об оценках:\n${lastUpdatedString}\n\n${studentInfo}\n\n${totalGradesString}\n\nВыберите действие:`,
      keyboard,
    });
  } else if (action === 'average') {
    await vk.sendMessage({
      peerId,
      message: 'Эта команда еще не реализована',
    });
  } else if (action === 'fullReport') {
    const screenshotName = report.screenshot;
    if (!screenshotName) {
      return await vk.sendMessage({
        peerId,
        message: 'Не удалось получить скриншот.\nПопробуйте обновить отчёт.',
      });
    }

    const result = await grades.getScreenshot(screenshotName);
    if (!result.status) {
      return await vk.sendMessage({
        peerId,
        message: result.error!,
      });
    }

    const uploadResponse = await vk.uploadAndGetPhoto({peerId, stream: result.fileStream!});
    if (!uploadResponse) {
      return await vk.sendMessage({
        peerId,
        message: 'Не удалось загрузить картинку.\nПопробуйте обновить отчёт.',
      });
    }

    const attachment = new Attachment({
      api: vk.api,
      type: 'photo',
      payload: uploadResponse,
    });

    await vk.sendMessage({
      peerId,
      attachment,
      message: 'Полный отчёт об оценках из Сетевого Города:',
    });
  } else if (action === 'today') {
    await vk.sendMessage({
      peerId,
      message: 'Эта команда еще не реализована',
    });
  }
};

const cmd: CommandOutputData = {
  name: 'оценки',
  aliases: ['grades'],
  description: null,
  payload: {
    command: 'grades',
    data: {action: 'update', forceUpdate: false},
  } as GradesPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
    paidSubscription: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
