import { Payload } from './Payload';

export interface PastMandatoryTasksPayload extends Payload {
  command: 'pastMandatoryTasks'
  data: {
    action: 'choice' | 'all' | 'currentQuarter'
  }
}
