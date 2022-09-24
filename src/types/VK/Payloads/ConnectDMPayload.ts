import {Payload} from './Payload';

export interface ConnectDMPayload extends Payload {
  data: {
    action: 'findgroups' | 'choosegroup'
    chatTitle?: string
    chatId?: number
  }
};
