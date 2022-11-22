import { Payload } from './Payload';

export interface HomeworkPayload extends Payload {
  command: 'homework'
  data: {
    action: 'get'
  }
}
