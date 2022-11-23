import moment from 'moment';
moment.locale('ru');

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { HomeworkPayload } from '../types/VK/Payloads/HomeworkPayload';

async function command({ message, vk, utils, classes, payload, homework }: CommandInputData) {
  const { peerId } = message;

  if (!payload) return;
  const homeworkPayload = payload as HomeworkPayload;

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

    const homeworkData = await homework.getHomework(peerId, false);
    stopLoading();

    if (!homeworkData.status) {
      return await vk.sendMessage({
        message: `При получении домашнего задания произошла ошибка:\n${homeworkData.error}`,
        peerId,
        priority: 'low',
      });
    }

    const formattedHomework = homeworkData.days!.map(day => {
      if (!day) return null;

      const formattedDate = moment(day.date).format('LL');
      const formattedLessons = day.lessons.map((lesson) => {
        const { assignments, subjectName } = lesson;
        if (!assignments || !assignments.length) return null;

        const homework = assignments
          .map((assignment, index) => `⠀${index + 1}. ${assignment.assignmentName}`);

        return {
          homework,
          subjectName,
        };
      }).filter(lesson => lesson) as {homework: string[], subjectName: string}[];

      const resultString = formattedLessons.map((lesson) => {
        let lessonName = utils.abbreviateLessonTitle(lesson.subjectName);
        if (lessonName === 'Английский язык') lessonName += ' [Группа Анны Фёдоровны]';

        return `${lessonName}:\n${lesson.homework.join('\n')}`;
      }).join('\n\n');

      return {
        date: formattedDate,
        resultString,
      };
    });

    let resultHomework = 'Домашнее задание на сегодня и завтра из Сетевого Города:\n\n';

    const resultNetcityString = formattedHomework.map((homework) => {
      if (!homework) return;

      return `${homework.date}:\n${homework.resultString}`;
    })
      .filter(result => result)
      .join('\n\n');

    resultHomework += resultNetcityString;

    const classData = await classes.getClass(peerId);
    const manualHomework = classData.manualHomework;

    const tomorrowDate = moment(Date.now() + 1000 * 60 * 60 * 24).format('L');
    const tomorrowManualHomework = manualHomework.find((homework) => moment(homework.date).format('L') === tomorrowDate);

    if (tomorrowManualHomework) {
      resultHomework += '\n\nДомашнее задание, добавленное вручную:\n\n';
      resultHomework += tomorrowManualHomework.text;
    }

    await vk.sendMessage({
      message: resultHomework,
      peerId,
      priority: 'medium',
    });
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