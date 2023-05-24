import moment from 'moment';

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { PastMandatoryTasksPayload } from '../types/VK/Payloads/PastMandatoryTasksPayload';
import { PastMandatoryTasksKeyboard } from '../keyboards/PastMandatoryTasksKeyboard';

async function command({ message, vk, payload, utils, netcityAPI }: CommandInputData) {
  const peerId = message.peerId;
  const manageChatsPayload = payload as PastMandatoryTasksPayload;
  const action = manageChatsPayload.data.action;

  if (action === 'choice') {
    const keyboard = PastMandatoryTasksKeyboard;

    return vk.sendMessage({
      message: 'За какой период вы хотите просмотреть просроченные задания?',
      keyboard,
      peerId,
    });
  } else {
    let loadingMessageID = 0;

    const removeLoadingMessage = () => {
      if (!loadingMessageID) return;
      return vk.removeMessage(loadingMessageID, peerId);
    };

    loadingMessageID = await vk.sendMessage({
      message: 'Идёт загрузка просроченных заданий...',
      peerId,
    });

    const session = await netcityAPI.findOrCreateSession(peerId, false);
    if (!session || !session.status) {
      removeLoadingMessage();
      return vk.sendMessage({
        message: `Не удалось войти в сетевой город, ошибка: ${session?.error || 'неизвестно.'}`,
        peerId,
      });
    }

    const isCurrentQuarter = action === 'currentQuarter';
    const pastMandatoryResponse = await netcityAPI.getPastMandatory(session.session.id, isCurrentQuarter);
    const assignmentTypesResponse = await netcityAPI.getAssignmentTypes(session.session.id);

    removeLoadingMessage();

    if (!pastMandatoryResponse.status) {
      return vk.sendMessage({
        message: `Не удалось получить список просроченных заданий, ошибка: ${pastMandatoryResponse?.error || 'неизвестно.'}`,
        peerId,
      });
    }

    if (!assignmentTypesResponse.status) {
      return vk.sendMessage({
        message: `Не удалось получить список определений работ, ошибка: ${assignmentTypesResponse?.error || 'неизвестно.'}`,
        peerId,
      });
    }

    const { pastMandatory } = pastMandatoryResponse;

    const taskListTypeString = isCurrentQuarter ? 'за эту четверть' : 'за всё время';

    if (pastMandatory!.length) {
      const count = pastMandatory!.length;

      const lessonsString = await Promise.all(pastMandatory!.map(async (lesson, index) => {
        const { dueDate, subjectName, assignmentName, typeId, id } = lesson;

        const date = moment(dueDate).format('DD.MM.YYYY');
        const assignmentType = assignmentTypesResponse.assignmentTypes!.find((type) => type.id === typeId);
        const assignmentTypeString = assignmentType ? assignmentType.name : 'тип работы неизвестен';

        const assignDataResponse = await netcityAPI.getAssignData(session.session.id, id);
        const assignWeight = assignDataResponse.status ? assignDataResponse.assignData!.weight : 'неизвестно';

        return `${index + 1}. ${subjectName} — ${assignmentTypeString}. ${date}\n${assignmentName}\nВес оценки: ${assignWeight}`;
      }));

      const fixedTasksCountString = utils.setWordEndingBasedOnThingsCount('pastMandatoryTasks', count);

      return vk.sendMessage({
        message: `⚠️ У вас ${count} ${fixedTasksCountString} ${taskListTypeString}:\n\n${lessonsString.join('\n\n')}`,
        peerId,
      });
    } else {
      return vk.sendMessage({
        message: `✅ У вас нет просроченных заданий ${taskListTypeString}.`,
        peerId,
      });
    }
  }
}

const cmd: CommandOutputData = {
  name: 'просроченные задания',
  aliases: ['pastMandatoryTasks', 'точки'],
  description: 'показывает все невыполненные обязательные задания',
  payload: {
    command: 'pastMandatoryTasks',
    data: { action: 'choice' },
  } as PastMandatoryTasksPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    chatOnly: false,
    args: 0,
    paidSubscription: true,
    payloadOnly: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;