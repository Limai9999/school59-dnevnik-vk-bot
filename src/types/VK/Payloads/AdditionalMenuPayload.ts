import {Payload} from './Payload';

export interface AdditionalMenuPayload extends Payload {
  data: {
    action: 'enable' | 'disable';
  }
};
