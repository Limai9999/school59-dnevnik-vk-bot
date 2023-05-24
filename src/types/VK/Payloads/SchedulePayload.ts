import { Payload } from './Payload';

export interface SchedulePayload extends Payload {
  command: 'schedule'
  data: {
    action: 'get' | 'update' | 'choose'
    filename?: string
    type?: 'netcity' | 'manual'
    isPreview?: boolean
  }
}
