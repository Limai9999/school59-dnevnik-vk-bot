import { Attachment, KeyboardBuilder } from 'vk-io';

export type SendMessageData = {
  message: string
  peerId: number
  keyboard?: KeyboardBuilder
  attachment?: Attachment
  skipLastSentCheck?: boolean
  priority?: 'none' | 'low' | 'medium' | 'high'
  useAll?: boolean
  replyTo?: number
}
