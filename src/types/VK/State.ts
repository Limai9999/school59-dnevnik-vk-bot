export type State = {
  chats: {
    [chatId: number]: {
      events: {
        pendingOriginalTitle: boolean
        pendingOriginalPhoto: boolean
        originalTitle: string
      }
    }
  }
}
