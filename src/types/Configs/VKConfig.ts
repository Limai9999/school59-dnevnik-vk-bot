export type VKConfig = {
  token: string;
  id: number;
  adminUserID: number;
  adminChatID: number;
  maxLastSentMessages: number;
  messagePrioritiesTimeoutMinutes: {
    low: number;
    medium: number;
    high: number;
  }
};
