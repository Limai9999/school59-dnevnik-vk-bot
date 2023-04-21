import { Payload } from './Payload';

export interface AskQuestionPayload extends Payload {
  command: 'askQuestion'
  data: {
    action: 'startSession' | 'closeSession'
  }
}
