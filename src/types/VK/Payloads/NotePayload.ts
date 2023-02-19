import { Payload } from './Payload';

export interface NotePayload extends Payload {
  command: 'note'
  data: {
    action: 'getSchedule' | 'chooseSchedule'
    scheduleFilename?: string
  }
}
