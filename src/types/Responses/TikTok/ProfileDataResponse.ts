import {LikedVideo} from './LikedVideosResponse';

export type ProfileDataResponse = {
  user: {
    login_name: string
    name: string
    followers: number
    following: number
    likes: number
    avatar: string
    sid: string
    secret: number
    total_video: number
  }
  posts: LikedVideo[]
  error: any
}
