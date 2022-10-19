import {Payload} from './Payload';

export interface LoginToNetcityPayload extends Payload {
  command: 'loginToNetcity'
  data: {
    action: 'login' | 'logout'
  }
};

