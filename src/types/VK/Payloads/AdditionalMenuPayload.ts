import { Payload } from './Payload';

export interface AdditionalMenuPayload extends Payload {
  command: 'additionalMenu'
  data: {
    action: 'enable' | 'disable';
  }
}
