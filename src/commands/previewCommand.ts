import path from 'path';

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { PreviewCommandPayload } from '../types/VK/Payloads/PreviewCommandPayload';

async function command({ message, vk, payload }: CommandInputData) {
  const { peerId } = message;

  const previewCommandPayload = payload as PreviewCommandPayload;
  const action = previewCommandPayload.data.action;

  const previewAssets = path.resolve(__dirname, '../../assets/commandPreviews/');

  if (action === 'netcityLoginExample') {
    const netcityLoginPreviewImage = path.join(previewAssets, 'netcityLoginPreview.png');

    const uploadResponse = await vk.uploadAndGetPhoto({ photoPath: netcityLoginPreviewImage, peerId });
    if (!uploadResponse) return;

    const attachment = vk.createPhotoAttachment(uploadResponse);

    const msg =
    `
Когда вы добавляете свои данные для входа в Сетевой Город, бот сразу же запускает авто-обновление вашей сессии.

Это означает что вам не нужно будет каждый раз ждать, пока Сетевой Город загрузится, а сразу получить всю нужную вам информацию.

Вот как это работает:
    `;

    return await vk.sendMessage({
      peerId,
      message: msg,
      attachment,
    });
  } else if (action === 'gradesExample') {

  } else if (action === 'scheduleExample') {

  }
}

const cmd: CommandOutputData = {
  name: 'previewCommand',
  aliases: [],
  description: null,
  payload: {
    command: 'previewCommand',
    data: { action: 'start' },
  } as PreviewCommandPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
    paidSubscription: false,
  },
  showInAdditionalMenu: false,
  showInCommandsList: false,
  howToUse: null,
  execute: command,
};

export default cmd;
