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
}
