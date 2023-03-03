import { GetUserResponse } from './GetUserResponse';

interface IChatItem {
  can_write: {
    allowed: boolean
  }
  chat_settings?: {
    acl: {
      can_call: boolean
      can_change_info: boolean
      can_change_invite_link: boolean
      can_change_pin: boolean
      can_change_style: boolean
      can_copy_chat: boolean
      can_invite: boolean
      can_moderate: boolean
      can_promote_users: boolean
      can_see_invite_link: boolean
      can_use_mass_mentions: boolean
    }
    active_ids: number[]
    admin_ids: number[]
    is_disappearing: boolean
    is_group_channel: boolean
    is_service: boolean
    members_count: number
    owner_id: number
    state: string
    title: string
    photo?: {
      photo_50: string
      photo_100: string
      photo_200: string
      is_default_photo: false
      is_default_call_photo: false
    }
  }
  current_keyboard: {
    author_id: number
    buttons: [
      [{
        action: {label: string, type: string, payload: object}
        color: string
      }]
    ]
    inline: boolean
    one_time: boolean
  }
  important: boolean
  in_read: number
  in_read_cmid: number
  is_marked_unread: boolean
  last_conversation_message_id: number
  last_message_id: number
  out_read: number
  out_read_cmid: number
  peer: {
    id: number
    local_id: number
    type: string
  }
  sort_id: {
    major_id: number
    minor_id: number
  }
}

interface IChatGroup {
  id: number
  is_closed: number
  name: string
  photo_max_orig: string
  screen_name: string
  type: string
}

export type GetChatResponse = {
  items: IChatItem[]
  groups: IChatGroup[]
  profiles: GetUserResponse
}
