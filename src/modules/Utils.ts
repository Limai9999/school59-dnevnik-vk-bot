import {GetCookiesResponse} from '../types/Responses/API/netCity/GetCookiesResponse';

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
}
