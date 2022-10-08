export type VKConfig = {
  bot_token: string
  user_token: string
  id: number
  adminUserID: number
  adminChatID: number
  maxLastSentMessages: number
  messagePrioritiesTimeoutMinutes: {
    low: number
    medium: number
    high: number
  }
};
