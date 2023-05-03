import { Payload } from './Payload';

export interface GradesPayload extends Payload {
  command: 'grades'
  data: {
    action: 'update' | 'quarter' | 'recently' | 'fullReport' | 'gradesStats'
    forceUpdate?: boolean
  }
}
