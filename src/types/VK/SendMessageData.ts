import {KeyboardBuilder} from 'vk-io';

export type SendMessageData = {
  message: string;
  peerId: number;
  keyboard?: KeyboardBuilder;
  attachment?: string;
  skipLastSentCheck?: boolean;
  priority: 'none' | 'low' | 'medium' | 'high';
};
