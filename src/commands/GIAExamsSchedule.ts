import moment from 'moment';
import { CommandInputData, CommandOutputData } from '../types/Commands';

import { GIAExam } from '../types/SchoolEndFeature/GIASubjects';
import { GIAExamsSchedulePayload } from '../types/VK/Payloads/GIAExamsSchedulePayload';

import { getGIAExamsDataConfig } from '../utils/getConfig';

async function command({ message, vk, classes, payload, utils }: CommandInputData) {
  const schedulePayload = payload as GIAExamsSchedulePayload;
  const action = schedulePayload.data.action;

  const peerId = message.peerId;
  const isDM = message.isDM;

  const examsUnsorted = getGIAExamsDataConfig();
  const examsUnchecked = examsUnsorted.sort((a, b) => Number(b.isMain) - Number(a.isMain));

  let exams: GIAExam[] = [];

  examsUnchecked.map((exam) => {
    let isPassed = false;

    exam.startTime.map((startTime) => {
      startTime > Date.now() ?
        isPassed = true :
        isPassed = false;
    });

    if (isPassed) exams.push(exam);
  });

  let examIndex = 0;

  const stringifyExams = (exams: GIAExam[], useIndex = true, useEmoji = false) => {
    return exams.map((exam) => {
      examIndex++;

      const { subject, startTime, isMain, duration } = exam;

      const startTimeStringified = startTime.map((time) => {
        return moment(time).calendar();
      });
      const indexString = useIndex ? `${examIndex}. ` : '';
      const emojiString = useEmoji ?
        isMain ? '❗ ' : '✍️ '
        : '';

      return `${emojiString}${indexString}${subject} (${duration})\nНачало: ${startTimeStringified.join(', ')}`;
    });
  };

  if (action === 'get') {
    const classData = await classes.getClass(peerId);

    if (isDM) {
      const chosenExams = classData.surveyGIAExams;
      if (!chosenExams.length) {
        return await vk.sendMessage({
          message: `Вы не выбрали экзамены, которые вы собираетесь сдавать.\n\nПопросите ${vk.getAdminLinkString('администратора')}, чтобы он дал вам возможность выбрать предметы.`,
          peerId,
        });
      }

      let chosenOriginal: GIAExam[] = [];

      chosenExams.map((exam) => {
        const originalData = exams.find((originalExam) => originalExam.subject === exam.subject);
        if (originalData) chosenOriginal.push(originalData);
      });

      const closestExamStartTime = Math.min(...chosenOriginal.map((exam) => Math.min(...exam.startTime)));
      const closestExam = chosenOriginal.find((exam) => Math.min(...exam.startTime) === closestExamStartTime)!;
      chosenOriginal = chosenOriginal.filter((exam) => exam.subject !== closestExam.subject);

      const examsStringified = stringifyExams(chosenOriginal);
      const closestStringified = stringifyExams([closestExam]);

      const examsFinal = examsStringified.length ? `\n\n${examsStringified.join('\n\n')}` : null;
      const closestFinal = closestStringified.length ? `\n\n🕒 Ближайшие экзамены:\n${closestStringified.join('\n\n')}` : null;

      const examCountString = utils.setWordEndingBasedOnThingsCount('examsCount', examIndex);
      const finalMessage = examsFinal || closestFinal ? `У вас ${examIndex} ${examCountString} впереди:${examsFinal}${closestFinal}` : 'Всё экзамены завершены.';

      await vk.sendMessage({
        message: finalMessage,
        peerId,
      });
    } else {
      const mainExams = exams.filter((exam) => exam.isMain);

      const closestExamStartTime = Math.min(...exams.map((exam) => Math.min(...exam.startTime)));
      const closestExam = exams.find((exam) => Math.min(...exam.startTime) === closestExamStartTime)!;
      exams = exams.filter((exam) => exam.subject !== closestExam.subject);
      exams = exams.filter((exam) => !exam.isMain);

      const mainStringified = stringifyExams(mainExams);
      const otherStringified = stringifyExams(exams);
      const closestStringified = stringifyExams([closestExam]);

      const mainFinal = mainStringified.length ? `\n\n❗ Основные экзамены:\n${mainStringified.join('\n\n')}` : '';
      const otherFinal = otherStringified.length ? `\n\n✍️ Остальные экзамены:\n${otherStringified.join('\n\n')}` : '';
      const closestFinal = closestStringified.length ? `\n\n🕒 Ближайшие экзамены:\n${closestStringified.join('\n\n')}` : '';

      const examCountString = utils.setWordEndingBasedOnThingsCount('examsCount', examIndex);
      const finalMessage = mainFinal.length || otherFinal.length || closestFinal.length ? `Впереди ${examIndex} ${examCountString}:${mainFinal}${otherFinal}${closestFinal}` : 'Всё экзамены завершены.';

      await vk.sendMessage({
        message: finalMessage,
        peerId,
      });
    }
  }
}

const cmd: CommandOutputData = {
  name: 'расписание экзаменов',
  aliases: ['GIAExamsSchedule', 'ExamsSchedule'],
  description: 'Получить расписание экзаменов',
  payload: { command: 'GIAExamsSchedule', data: { action: 'get' } } as GIAExamsSchedulePayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
    payloadOnly: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
