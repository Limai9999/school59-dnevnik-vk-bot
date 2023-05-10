import { Payload } from './Payload';

export interface GIAExamsSchedulePayload extends Payload {
  command: 'GIAExamsSchedule'
  data: {
    action: 'get'
  }
}
