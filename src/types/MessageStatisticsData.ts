import { Payload } from './VK/Payloads/Payload';

export type MessageStatisticsData = {
  peerId: number
  messageId: number
  text?: string
  attachments: object[]
  date: number
  userId: number
  args: string[]
  commandName?: string
  payload?: Payload
}
