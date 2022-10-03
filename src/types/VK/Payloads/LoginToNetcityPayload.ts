import {Payload} from './Payload';

export interface LoginToNetcityPayload extends Payload {
  data: {
    action: 'login' | 'logout'
  }
};

