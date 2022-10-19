import {Payload} from './Payload';

export interface ManageChatsPayload extends Payload {
  command: 'manageChats'
  data: {
    action: 'getchats' | 'choosechat' | 'postschedule' | 'makeannouncement'
    chatTitle?: string,
    chatId?: number,
  }
};
