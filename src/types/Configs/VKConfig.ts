export type VKConfig = {
  testMode: boolean
  bot_token: string
  test_bot_token: string
  user_token: string
  id: number
  test_id: number
  adminUserIDs: number[]
  adminChatID: number
  maxLastSentMessages: number
  messagePrioritiesTimeoutMinutes: {
    low: number
    medium: number
    high: number
  }
}
