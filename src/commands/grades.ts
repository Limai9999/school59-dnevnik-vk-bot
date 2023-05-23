import moment from 'moment';
import { Attachment, Keyboard } from 'vk-io';

import { GradesKeyboard } from '../keyboards/GradesKeyboard';
import { CommandInputData, CommandOutputData } from '../types/Commands';

import { GradesPayload } from '../types/VK/Payloads/GradesPayload';

async function command({ message, classes, vk, payload, grades, utils }: CommandInputData) {
  const peerId = message.peerId;

  const gradesPayload = payload as GradesPayload;
  const action = gradesPayload.data.action;

  let loadingMessageID = 0;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  await classes.setLoading(peerId, true);

  loadingMessageID = await vk.sendMessage({
    message: 'Идёт загрузка отчёта с оценками...',
    peerId,
  });

  if (action === 'final') {
    const report = await grades.getReportStudentTotalMarks(peerId);
    removeLoadingMessage();

    await classes.setLoading(peerId, false);

    if (!report.status) {
      return vk.sendMessage({
        message: `Не удалось получить итоговые оценки, ошибка:\n\n${report.error!}`,
        peerId,
      });
    }

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

    const uploadResponse = await vk.uploadAndGetPhoto({ peerId, stream: result.fileStream! });
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
      message: 'Отчёт об итоговых оценках из Сетевого Города:',
    });
  } else {
    await grades.startAutoUpdate(peerId);

    const report = await grades.getTotalStudentReport(peerId, !!gradesPayload.data.forceUpdate);
    removeLoadingMessage();

    await classes.setLoading(peerId, false);

    const getGradesByLesson = (lessonTitle: string) => {
      const grades: string[] = [];

      report.result.daysData.map((dayData) => {
        const selectedLesson = dayData.lessonsWithGrades.find((lessonsWithGrade) => lessonsWithGrade.lesson === lessonTitle);
        if (!selectedLesson) return;

        grades.push(...selectedLesson.grades);
      });

      return grades;
    };

    if (action === 'update') {
      const classData = await classes.getClass(peerId);

      if (!report.status) {
        return vk.sendMessage({
          message: `Не удалось получить отчёт с оценками, ошибка:\n\n${report.error!}`,
          peerId,
        });
      }

      const studentInfo = report.info.join('\n');

      type MarksObject = {
        [key: string]: number
      }

      const marks: MarksObject = {
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
      };

      let totalGrades = 0;
      report.result.daysData.map((day) => {
        day.lessonsWithGrades.map((lessonWithGrade) => {
          totalGrades += lessonWithGrade.grades.length;

          lessonWithGrade.grades.map((grade) => {
            marks[grade]++;
          });
        });
      });

      const totalGradesString = `Всего оценок - ${totalGrades}:\nПятёрок: ${marks['5']}, четвёрок: ${marks['4']}, троек: ${marks['3']}, двоек: ${marks['2']}`;
      const lastUpdatedString = `Обновлен: ${moment(classData.lastUpdatedTotalStudentReport).fromNow()}`;

      const keyboard = GradesKeyboard;

      await vk.sendMessage({
        peerId,
        message: `Отчёт об оценках:\n${lastUpdatedString}\n\n${studentInfo}\n\n${totalGradesString}\n\nВыберите действие:`,
        keyboard,
      });
    } else if (action === 'quarter') {
      type MarksObject = {
        [key: string]: number
      }

      const marks: MarksObject = {
        'uncertified': 0,
        'notSure': 0,
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0,
      };

      const averages: number[] = [];

      const lessonsAverages = report.result.averageGrades.map((averageGrade, index) => {
        const { lesson, average } = averageGrade;
        const abbreviatedLessonTitle = utils.abbreviateLessonTitle(lesson);

        const lessonGrades = getGradesByLesson(lesson);
        const isNoGrades = !lessonGrades.length;

        const splittedAverage = average.split(',');
        const integer = Number(splittedAverage[0]);
        const averageNum = Number(average.replace(',', '.'));

        let roundedAverage: string | number | null = null;

        if (splittedAverage.length === 2) {
          const onlyFraction = +(averageNum - integer).toFixed(2);

          if (onlyFraction > 0.60) {
            roundedAverage = integer + 1;
            marks[roundedAverage]++;
          } else if (onlyFraction >= 0.60) {
            roundedAverage = `между ${integer} и ${integer + 1}`;
            marks['notSure']++;
          } else if (onlyFraction < 0.60) {
            roundedAverage = integer;
            marks[roundedAverage]++;
          }
        } else {
          roundedAverage = null;
          marks[splittedAverage[0]]++;
        }

        if (typeof roundedAverage !== 'string' && roundedAverage) {
          averages.push(roundedAverage);
        }

        const isCertified = lessonGrades.length >= 1;
        if (!isCertified) marks['uncertified']++;

        const lessonTotalGradesString = utils.setWordEndingBasedOnThingsCount('totalGrades', lessonGrades.length);

        const isCertifiedString = isCertified ?
          lessonGrades.length < 3 ? `Рекомендуется получить еще ${3 - lessonGrades.length} оценки ⚠️` : 'Аттестован ✅' :
          'Не аттестован ❌' + (isNoGrades ? '' : `, ${lessonTotalGradesString}`);

        const roundedAverageString = roundedAverage && isCertified ? `\nОжидаемая оценка за четверть: ${roundedAverage}` : '';
        const lessonGradesString = utils.setWordEndingBasedOnThingsCount('grades', lessonGrades.length);

        return `${index + 1}. ${abbreviatedLessonTitle}\n${isNoGrades ? 'Нет оценок' : `Балл ${averageNum} — ${lessonGrades.length} ${lessonGradesString}.`}\n${isCertifiedString}${roundedAverageString}`;
      });

      const averageOfAverages = averages.reduce((a, b) => a + b, 0) / averages.length;

      const uncertifiedSubjectsCountFixedString = utils.setWordEndingBasedOnThingsCount('uncertifiedSubjectsCount', marks['uncertified']);
      const summarizedData = `Общий средний балл: ${averageOfAverages.toFixed(2)}\n\nПятёрок: ${marks['5']}, четвёрок: ${marks['4']}, троек: ${marks['3']}, двоек: ${marks['2']}, коллов: ${marks['1']}${marks['notSure'] ? `, нет точных данных: ${marks['notSure']}.` : '.'}\n\n${marks['uncertified'] > 0 ? `Не аттестован по ${marks['uncertified']} ${uncertifiedSubjectsCountFixedString} ❌` : 'Аттестован по всем предметам ✅'}`;

      const resultMessage = `Информация об оценках за четверть:\n\n${summarizedData}\n\n${lessonsAverages.join('\n\n')}`;

      await vk.sendMessage({
        peerId,
        message: resultMessage,
      });
    } else if (action === 'recently') {
      const todayGrades = report.result.daysData.pop();
      if (!todayGrades) {
        return vk.sendMessage({
          message: 'Произошла неизвестная ошибка.',
          peerId,
        });
      }

      const { day, month, lessonsWithGrades } = todayGrades;

      let resultMessage = '';

      if (lessonsWithGrades.length) {
        resultMessage = `Оценки за ${day} ${month.toLowerCase()} — последний доступный день в отчёте:\n\n`;

        lessonsWithGrades.map((lessonWithGrade) => {
          const { lesson, grades } = lessonWithGrade;
          if (!grades.length) return;

          const abbreviatedLessonTitle = utils.abbreviateLessonTitle(lesson);

          resultMessage += `${abbreviatedLessonTitle}: ${grades.join(', ')}\n`;
        });
      } else {
        resultMessage = `У вас нет оценок за ${day} ${month.toLowerCase()}.`;
      }

      await vk.sendMessage({
        peerId,
        message: resultMessage,
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

      const uploadResponse = await vk.uploadAndGetPhoto({ peerId, stream: result.fileStream! });
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
    }
  }
}

const cmd: CommandOutputData = {
  name: 'оценки',
  aliases: ['grades'],
  description: 'Отчёт об оценках из Сетевого Города.',
  payload: {
    command: 'grades',
    data: { action: 'update', forceUpdate: false },
  } as GradesPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
    paidSubscription: true,
    payloadOnly: true,
  },
  keyboardData: {
    color: Keyboard.POSITIVE_COLOR,
    positionSeparatelyFromAllButton: false,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
