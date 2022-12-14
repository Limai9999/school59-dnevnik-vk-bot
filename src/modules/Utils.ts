import { GetCookiesResponse } from '../types/Responses/API/netCity/GetCookiesResponse';

type setWordEndingType = 'scheduleFiles' | 'addedLessons' | 'totalGrades'

export default class Utils {
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

  cookieArrayToString(cookieArray: GetCookiesResponse['cookies']) {
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

    return type;
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
}
