import { Payload } from './Payload';

export interface PreviewCommandPayload extends Payload {
  command: 'previewCommand'
  data: {
    action: 'start' | 'netcityLoginExample' | 'scheduleExample' | 'gradesExample'
  }
}
