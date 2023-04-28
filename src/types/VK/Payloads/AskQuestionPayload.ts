import { Payload } from './Payload';

import { ClevernessType } from '../../../modules/ChatGPT';

export interface AskQuestionPayload extends Payload {
  command: 'askQuestion'
  data: {
    action: 'startSession' | 'closeSession' | 'chooseCleverness'
    cleverness: ClevernessType
  }
}
