export type Attachment = {
  id: number
  name: string
  originalFileName: string
  description?: string
}

export type Announcement = {
  description: string
  postDate: string
  deleteDate?: string
  author: {
      id: number
      fio: string
      nickName: string
  }
  em?: any
  recipientInfo: null
  attachments: Attachment[]
  id: number
  name: string
}

export type GetAnnouncementsResponse = Announcement[]
