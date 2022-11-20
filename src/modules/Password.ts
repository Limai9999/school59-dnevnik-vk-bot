import CryptoJS from 'crypto-js';

import { MainConfig } from '../types/Configs/MainConfig';
import { getMainConfig } from '../utils/getConfig';

export default class Password {
  password: string;
  isEncrypted: boolean;
  secretKey: MainConfig['secretKey'];

  constructor(password: string, isEncrypted: boolean) {
    this.isEncrypted = isEncrypted;
    this.password = password;
    this.secretKey = getMainConfig().secretKey;
  }

  encrypt() {
    if (this.isEncrypted) return this.password;

    const encrypted = CryptoJS.AES.encrypt(this.password, this.secretKey).toString();
    this.password = encrypted;
    this.isEncrypted = true;

    return encrypted;
  }

  decrypt() {
    if (!this.isEncrypted) return this.password;

    const decrypted = CryptoJS.AES.decrypt(this.password, this.secretKey).toString(CryptoJS.enc.Utf8);
    this.password = decrypted;
    this.isEncrypted = false;

    return decrypted;
  }
}
