import { Payload } from './Payload';

export interface GradesPayload extends Payload {
  command: 'grades'
  data: {
    action: 'update' | 'average' | 'today' | 'fullReport'
    forceUpdate?: boolean
  }
}
