import { Payload } from './Payload';

export interface StartPayload extends Payload {
  command: 'start'
}
