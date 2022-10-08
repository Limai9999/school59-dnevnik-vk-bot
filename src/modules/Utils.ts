import {GetCookiesResponse} from '../types/Responses/API/netCity/GetCookiesResponse';
import {Declination, WordGender} from '../types/Utils/SetWordEnding';

export default class Utils {
  types = {
    Declination,
    WordGender,
  };

  constructor() {
    this.types = {
      Declination,
      WordGender,
    };
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

  setWordEndingBasedOnThingsCount(unformattedWord: string, declination: Declination, wordGender: WordGender, things: number): string {
    const thingsStr = String(things);

    if (declination === Declination.Second) {
      if (wordGender === WordGender.Masculine) {
        if (thingsStr.endsWith('0') || (things >= 10 && !thingsStr.endsWith('1') && !thingsStr.endsWith('2'))) return unformattedWord + 'ов';
        if (thingsStr.endsWith('1')) return unformattedWord;
        if (thingsStr.endsWith('2')) return unformattedWord + 'а';
      }
    }

    return unformattedWord;
  }
}
