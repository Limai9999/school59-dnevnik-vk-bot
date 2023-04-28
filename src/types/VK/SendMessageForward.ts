export type SendMessageForward = {
  owner_id?: number
  peer_id: number
  conversation_message_ids?: number | number[]
  message_ids?: number | number[]
  is_reply?: boolean
}