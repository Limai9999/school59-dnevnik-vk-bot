import {EventInputData, EventOutputData} from '../types/Event/Events';

import {Attachment} from 'vk-io';
import axios from 'axios';

async function executeEvent({statistics, vk, message}: EventInputData) {
  const {peerId} = message!;

  const photos = await statistics.getPhotoAttachments(message!.peerId);

  const randomPhoto = photos[Math.floor(Math.random() * photos.length)];

  const {sizes} = randomPhoto.photo;

  // choose size with highest height and width
  const size = sizes.reduce((prev, curr) => {
    if (prev.height * prev.width > curr.height * curr.width) return prev;
    return curr;
  });

  const photoStream = await axios({
    method: 'get',
    url: size.url,
    responseType: 'stream',
  });

  const uploadResponse = await vk.uploadAndGetPhoto({
    peerId,
    stream: photoStream.data,
  });
  if (!uploadResponse) return;

  const {id, owner_id} = uploadResponse;
  const attachment = new Attachment({
    api: vk.api,
    type: 'photo',
    payload: {
      id,
      owner_id,
    },
  });

  await vk.sendMessage({
    peerId,
    attachment,
    message: '',
    priority: 'none',
    skipLastSentCheck: true,
  });
}

const evt: EventOutputData = {
  name: 'sendExistingPhoto',
  executeProbability: 0.35,
  execute: executeEvent,
};

export default evt;
