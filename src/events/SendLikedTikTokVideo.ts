import {EventInputData, EventOutputData} from '../types/Event/Events';

import axios from 'axios';
import request from 'request-promise';

import {getTikTokConfig, getMainConfig} from '../utils/getConfig';

import {UploadVideoResponse} from '../types/VK/Responses/UploadVideoResponse';
import {Attachment} from 'vk-io';
import {ProfileDataResponse} from '../types/Responses/TikTok/ProfileDataResponse';
import {LikedVideosResponse} from '../types/Responses/TikTok/LikedVideosResponse';

import waitMs from '../utils/waitMs';

async function executeEvent({vk, vkUser, message}: EventInputData) {
  if (!message) return;

  const tiktokRapidHOST = 'tiktok-unauthorized-api-scraper-no-watermark-analytics-feed.p.rapidapi.com';
  const tiktokRapidAPIUrl = `https://${tiktokRapidHOST}`;

  const {username} = getTikTokConfig();
  const {rapidApiKey} = getMainConfig();

  try {
    const userResponse = await axios({
      url: `${tiktokRapidAPIUrl}/api/search_full`,
      method: 'POST',
      data: {username, amount_of_posts: 0},
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': tiktokRapidHOST,
      },
    });

    const userData: ProfileDataResponse = userResponse.data;

    const {user: {sid}} = userData;

    await waitMs(3500, 4000, true, 'ожидание перед вторым запросом');

    const likedVideosResponse = await axios({
      url: `${tiktokRapidAPIUrl}/api/liked`,
      method: 'POST',
      data: {sid, amount_of_posts: 20},
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': tiktokRapidHOST,
      },
    });

    const likedVideosData: LikedVideosResponse = likedVideosResponse.data;

    const randomVideo = likedVideosData.posts[Math.floor(Math.random() * likedVideosData.posts.length)];
    const {description, play_links} = randomVideo;

    const videoUrl = play_links[Math.floor(Math.random() * play_links.length)];
    const descr = description.length ? description : 'видео прикол';

    const saveVideoResponse = await vkUser.api.video.save({
      name: descr,
      description,
      is_private: true,
      group_id: vk.me.id,
    });

    const videoStream = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream',
    });

    const uploadResponse = await request({
      method: 'POST',
      url: saveVideoResponse.upload_url,
      formData: {
        video_file: {
          value: videoStream.data,
          options: {
            filename: 'video-tiktok.mp4',
            contentType: null,
          },
        },
      },
    });

    const uploadResult: UploadVideoResponse = JSON.parse(uploadResponse);

    const videoAttachment = new Attachment({
      type: 'video',
      payload: {
        access_key: saveVideoResponse.access_key!,
        owner_id: uploadResult.owner_id!,
        id: saveVideoResponse.video_id!,
      },
      api: vk.api,
    });

    vk.sendMessage({
      message: '',
      peerId: message.peerId,
      attachment: videoAttachment,
      priority: 'none',
      skipLastSentCheck: true,
    });
  } catch (error) {
    console.log('error in sendLikedTikTokVideo event'.red, error);
  }
}

const evt: EventOutputData = {
  name: 'sendLikedTikTokVideo',
  disabled: false,
  executeProbability: 0.4,
  execute: executeEvent,
};

export default evt;
