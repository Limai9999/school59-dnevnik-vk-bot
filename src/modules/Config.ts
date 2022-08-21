import * as path from 'path';
import {readFileSync, writeFileSync} from 'fs';

export default class Config {
  name: string;
  path: string;

  constructor(fileName: string) {
    this.name = fileName;
    this.path = path.join(__dirname, '../../data', fileName);
  }

  getData(): any {
    const data = readFileSync(this.path, 'utf-8');
    return JSON.parse(data);
  }

  saveData(data: any, log: boolean = true): boolean {
    try {
      const stringifiedData = JSON.stringify(data, null, 2);
      writeFileSync(this.path, stringifiedData);

      if (log) console.log(`Конфиг ${this.name} успешно сохранен.`);

      return true;
    } catch (error) {
      console.log(`Произошла ошибка при сохранении конфига ${this.name}. Ошибка:`, error);
      return false;
    }
  }
}
