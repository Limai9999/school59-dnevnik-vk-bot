export type VKConfig = {
  bot_token: string
  user_token: string
  id: number
  adminUserIDs: number[]
  adminChatID: number
  maxLastSentMessages: number
  messagePrioritiesTimeoutMinutes: {
    low: number
    medium: number
    high: number
  }
}
