import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';

import {MainConfig} from '../types/Configs/MainConfig';

import {getMainConfig} from '../utils/getConfig';

class API {
  mainConfig: MainConfig;

  instance: AxiosInstance;

  constructor() {
    this.mainConfig = getMainConfig();

    this.instance = axios.create({
      baseURL: this.mainConfig.APIUrl,
      validateStatus: (status) => status >= 200 && status < 500,
    });
  }

  async request(config: AxiosRequestConfig<any>) {
    try {
      const response = await this.instance.request(config);
      return response;
    } catch (error) {
      console.log(`При отправке запроса на ${config.url} произошла ошибка:`, error);
      return false;
    }
  }
}

export default API;
