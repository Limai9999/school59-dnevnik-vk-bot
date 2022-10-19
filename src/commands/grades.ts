import moment from 'moment';

import {GradesKeyboard} from '../keyboards/GradesKeyboard';
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

  if (gradesPayload.data.action === 'update') {
    const report = await grades.getTotalStudentReport(peerId, !!gradesPayload.data.forceUpdate);
    removeLoadingMessage();

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
  } else if (gradesPayload.data.action === 'average') {
    await vk.sendMessage({
      peerId,
      message: 'Эта команда еще не реализована',
    });
  } else if (gradesPayload.data.action === 'fullReport') {
    await vk.sendMessage({
      peerId,
      message: 'Эта команда еще не реализована',
    });
  } else if (gradesPayload.data.action === 'today') {
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
