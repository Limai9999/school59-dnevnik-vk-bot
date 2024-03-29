import { Session } from '../types/Responses/API/netCity/GetCookiesResponse';

type setWordEndingType =
'scheduleFiles' |
'foundFiles' |
'addedLessons' |
'totalGrades' |
'ratedGrades' |
'removedRatedGrades' |
'grades' |
'changes' |
'changesHappened' |
'pastMandatoryTasks' |
'examsCount' |
'subjectsCount' |
'uncertifiedSubjectsCount'

export default class Utils {
  isNowSummer() {
    // Get the current date
    const currentDate = new Date();

    // Get the current month (0-11, where 0 represents January)
    const currentMonth = currentDate.getMonth();

    // Check if the current month is within the summer range
    if (currentMonth >= 5 && currentMonth <= 7) {
      return true;
    } else {
      return false;
    }
  }

  summerStartTime() {
    // Set the start date for summer (June 1st)
    const summerStartDate = new Date();
    // Set month to June (0-11, where 0 represents January)
    summerStartDate.setMonth(5);
    summerStartDate.setDate(1);
    summerStartDate.setHours(0);
    summerStartDate.setMinutes(0);
    summerStartDate.setSeconds(0);

    // Example: Thu Jun 01 2023 00:00:00

    // Get the Unix timestamp in milliseconds
    const timestamp = summerStartDate.getTime();

    return timestamp;
  }

  summerEndTime() {
    // Set the start date for the end of the summer (September 1st)
    const summerEndDate = new Date();
    // Set month to September (0-11, where 0 represents January)
    summerEndDate.setMonth(8);
    summerEndDate.setDate(1);
    summerEndDate.setHours(0);
    summerEndDate.setMinutes(0);
    summerEndDate.setSeconds(0);

    // Example: Thu Sep 01 2023 00:00:00

    // Get the Unix timestamp in milliseconds
    const timestamp = summerEndDate.getTime();

    return timestamp;
  }

  genderifyWord(word: string, sex: number) {
    switch (sex) {
      case 0:
        return `${word}(а)`;
      case 1:
        return `${word}а`;
      case 2:
        return word;
    }
  }

  cookieArrayToString(cookieArray: Session['cookies']) {
    const stringArray = cookieArray.map((cookie) => {
      const { name, value } = cookie;

      return `${name}=${value}`;
    });

    return stringArray.join('; ');
  }

  checkIfPeerIsDM(peerId: number) {
    return peerId < 2000000000;
  }

  setWordEndingBasedOnThingsCount(type: setWordEndingType, things: number): string {
    const thingsStr = String(things);

    if (type === 'scheduleFiles') {
      if (thingsStr.endsWith('1')) return 'Скачан 1 файл';
      if (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4')) return `Скачано ${things} файла`;
      return `Скачано ${things} файлов`;
    }

    if (type === 'foundFiles') {
      if (thingsStr.endsWith('1')) return 'найден 1 файл';
      if (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4')) return `найдено ${things} файла`;
      return `найдено ${things} файлов`;
    }

    if (type === 'addedLessons') {
      if (thingsStr.endsWith('1')) return 'Добавился 1 урок';
      if (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4')) return `Добавилось ${things} урока`;
      return `Добавилось ${things} уроков`;
    }

    if (type === 'totalGrades') {
      if (thingsStr.endsWith('1')) return 'всего 1 оценка';
      if (!thingsStr[0].startsWith('1') && (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4'))) return `всего ${things} оценки`;
      return `всего ${things} оценок`;
    }

    if (type === 'grades') {
      if ((things === 1 || things >= 21) && thingsStr.endsWith('1')) return 'оценка';
      if (!thingsStr[0].startsWith('1') && (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4'))) return 'оценки';
      return 'оценок';
    }

    if (type === 'ratedGrades') {
      const gradeString = this.setWordEndingBasedOnThingsCount('grades', things);

      if (things > 1) return `были выставлены ${gradeString}`;
      return 'была выставлена оценка';
    }

    if (type === 'removedRatedGrades') {
      const gradeString = this.setWordEndingBasedOnThingsCount('grades', things);

      if (things > 1) return `Убраны ${gradeString}`;
      return `Убрана ${gradeString}`;
    }

    if (type === 'changes') {
      if (things > 1) return 'Изменения';
      return 'Изменение';
    }

    if (type === 'changesHappened') {
      if ((things === 1 || things >= 21) && thingsStr.endsWith('1')) return 'изменение';
      if (!thingsStr[0].startsWith('1') && (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4'))) return 'изменения';
      return 'изменений';
    }

    if (type === 'pastMandatoryTasks') {
      if ((things === 1 || things >= 21) && thingsStr.endsWith('1')) return 'просроченное задание';
      if (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4')) return 'просроченных задания';
      return 'просроченных заданий';
    }

    if (type === 'examsCount') {
      if ((things === 1 || things >= 21) && thingsStr.endsWith('1')) return 'экзамен';
      if (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4')) return 'экзамена';
      return 'экзаменов';
    }

    if (type === 'subjectsCount') {
      if ((things === 1 || things >= 21) && thingsStr.endsWith('1')) return 'предмет';
      if (thingsStr.endsWith('2') || thingsStr.endsWith('3') || thingsStr.endsWith('4')) return 'предмета';
      return 'предметов';
    }

    if (type === 'uncertifiedSubjectsCount') {
      if ((things === 1 || things >= 21) && thingsStr.endsWith('1')) return 'предмету';
      return 'предметам';
    }

    return type;
  }

  fixMonthString(month: string) {
    switch (month) {
      case 'январь':
        return 'января';
      case 'февраль':
        return 'февраля';
      case 'март':
        return 'марта';
      case 'апрель':
        return 'апреля';
      case 'май':
        return 'мая';
      case 'июнь':
        return 'июня';
      case 'июль':
        return 'июля';
      case 'август':
        return 'августа';
      case 'сентябрь':
        return 'сентября';
      case 'октябрь':
        return 'октября';
      case 'ноябрь':
        return 'ноября';
      case 'декабрь':
        return 'декабря';
    }

    return month;
  }

  caseInsensitiveReplace(original: string, searchValue: string, replaceValue: string) {
    const regexp = new RegExp('(' + searchValue + ')', 'gi');
    return original.replace(regexp, replaceValue);
  }

  abbreviateLessonTitle(lessonTitle: string) {
    switch (lessonTitle) {
      case 'История России. Всеобщая история':
        return 'История';
      case 'Иностранный язык (английский)':
        return 'Английский язык';
      case 'Основы безопасности жизнедеятельности':
        return 'ОБЖ';
    }

    return lessonTitle;
  }

  formatLinkToUsername(link: string) {
    return link
      .replace('https://', '')
      .replace('vk.com', '')
      .replaceAll('/', '');
  }
}
