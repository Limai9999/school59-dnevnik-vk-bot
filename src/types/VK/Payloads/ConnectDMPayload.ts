import { Payload } from './Payload';

export interface ConnectDMPayload extends Payload {
  command: 'connectDMWithChat'
  data: {
    action: 'findgroups' | 'chooseGroup'
    chatTitle?: string
    chatId?: number
  }
}
