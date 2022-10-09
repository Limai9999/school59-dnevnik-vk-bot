import {GetCookiesResponse} from '../types/Responses/API/netCity/GetCookiesResponse';

type setWordEndingType = 'scheduleFiles' | 'addedLessons'

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
      const {name, value} = cookie;

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

    return type;
  }
}
