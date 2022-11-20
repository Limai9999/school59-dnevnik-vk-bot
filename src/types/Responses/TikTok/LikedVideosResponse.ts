export type LikedVideo = {
  cover: string
  animated_cover: string
  aweme_id: number
  description: string
  download_links: string[]
  play_links: string[]
  share_link: string
  web_link: string
  short_link: string
  comment_count: number
  digg_count: number
  download_count: number
  forward_count: number
  lose_comment_count: number
  lose_count: number
  play_count: number
  share_count: number
  whatsapp_share_count: number
  create_time: number
}

export type LikedVideosResponse = {
  posts: LikedVideo[]
}
