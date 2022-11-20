import { Payload } from './Payload';

export interface HandleHomeworkPayload extends Payload {
  command: 'handleHomework'
  data: {
    action: 'pin',
    choice: 'agree' | 'disagree'
  }
}
