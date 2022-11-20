export type PhotoAttachment = {
  type: 'photo'
  photo: {
    album_id: number
    date: number
    id: number
    owner_id: number
    access_key?: string
    sizes: [
      {
        height: number
        width: number
        type: string
        url: string
      }
    ];
    text: string
    has_tags: boolean
  }
}
