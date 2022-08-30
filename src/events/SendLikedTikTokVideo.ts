import {EventInputData, EventOutputData} from '../types/Event/Events';

import puppeteer from 'puppeteer';
import axios from 'axios';
import request from 'request-promise';

import {getTikTokConfig, getMainConfig} from '../utils/getConfig';

import {TikTokVideoDataResponse} from '../types/Responses/TikTokVideoDataResponse';
import {UploadVideoResponse} from '../types/Responses/UploadVideoResponse';
import {Attachment} from 'vk-io';

async function executeEvent({vk, vkUser, message}: EventInputData) {
  if (!message) return;

  try {
    const {username, cookies} = getTikTokConfig();
    const {rapidApiKey} = getMainConfig();

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null,
    });
    const page = await browser.newPage();

    await page.setCookie(...cookies);

    await page.goto(`https://www.tiktok.com/@${username}`, {
      waitUntil: 'networkidle0',
    });

    // clicking on liked videos page
    await page.click('[data-e2e="liked-tab"]');

    // waiting for liked videos list
    await page.waitForSelector('[data-e2e="user-liked-item-list"]');

    const videoLinks: string[] = await page.evaluate(() => {
      const videos = document.querySelector('[data-e2e="user-liked-item-list"]')?.children!;

      const links = Array.from(videos).map((video) => {
        const userLikedItem = video.children[0];
        const divWrapper = userLikedItem.children[0].children[0];
        const linkElement = divWrapper.children[0] as HTMLAnchorElement;

        const link = linkElement.href;

        return link;
      });

      return links;
    });
    browser.close();

    const randomVideoLink = videoLinks[Math.floor(Math.random() * videoLinks.length)];

    const videoDataResponse = await axios({
      method: 'GET',
      url: 'https://tiktok-videos-without-watermark.p.rapidapi.com/getVideo',
      params: {
        url: randomVideoLink,
      },
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'tiktok-videos-without-watermark.p.rapidapi.com',
      },
    });
    const videoData: TikTokVideoDataResponse = videoDataResponse.data;

    const videoUrl = videoData.video.wihout_watermark.url_list[0];

    const description = videoData.desc.length ? 'видево прикол' : videoData.desc;

    const saveVideoResponse = await vkUser.api.video.save({
      name: description,
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
    });
  } catch (error) {
    console.log('error in sendLikedTikTokVideo event', error);
  }
}

const evt: EventOutputData = {
  name: 'sendLikedTikTokVideo',
  disabled: false,
  executeProbability: 0.3,
  execute: executeEvent,
};

export default evt;
