type Media = {
  height: number
  width: number
  uri: string
  url_list: string[]
}

interface VideoWithoutWatermark extends Media {
  data_size: number
  file_cs: string
  file_hash: string
  url_key: string
}

interface VideoWithWatermark extends Media {
  data_size: number
}

export type TikTokVideoDataResponse = {
  author: {
    avatar: {
      avatar_168x168: Media
      avatar_larger: Media
      avatar_medium: Media
      avatar_thumb: Media
    }
    nickname: string
    uid: string
  }
  desc: string
  music: {
    cover: {
      conver_thumb: Media
      cover_hd: Media
      cover_large: Media
      cover_medium: Media
    }
    download_url: Media
    duration: number
    owner_nickname: string
    title: string
  }
  video: {
    animated_cover: {
      uri: string
      url_list: string[]
    }
    cover: Media
    duration: number
    wihout_watermark: VideoWithoutWatermark
    with_watermark: VideoWithWatermark
  }
}
