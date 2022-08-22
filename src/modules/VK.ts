import {VK, KeyboardBuilder} from 'vk-io';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

import Classes from './Classes';

import {Settings} from '../types/VK/Settings';
import {SendMessageData} from '../types/VK/SendMessageData';
import {VKConfig} from '../types/Configs/VKConfig';

import {MessagesSendResponse} from '../types/VK/Responses/MessagesSendResponse';
import {GetUserResponse} from '../types/VK/Responses/GetUserResponse';
import {PhotoUploadResponse} from '../types/Responses/PhotoUploadResponse';

import {MainKeyboard} from '../keyboards/MainKeyboard';

class VkService extends VK {
  id: number;
  classes: Classes;
  config: VKConfig;
  savedKeyboards: {
    [peerId: number]: KeyboardBuilder;
  };

  constructor({config, classes}: Settings) {
    const {token, id} = config;

    super({
      token,
      language: 'ru',
    });

    this.id = id;
    this.classes = classes;
    this.config = config;
    this.savedKeyboards = {};
  }

  async init() {
    await this.updates.start();

    const {id, name} = await this.getMe();

    console.log(`VK бот успешно запущен как ${name} - ${id}.`);

    return this;
  }

  async getMe() {
    const response = await this.api.groups.getById({
      group_id: this.id,
    });

    return response[0];
  }

  async removeAllLastSentMessages(peerId: number) {
    const classData = await this.classes.getClass(peerId);
    const lastSentMessages = classData.lastSentMessages;

    await Promise.all(lastSentMessages.map(async (messageId) => {
      await this.removeMessage(messageId, peerId);
    }));
  };

  async removeMessage(messageId: number, peerId: number) {
    try {
      await this.classes.removeLastSentMessage(peerId, messageId);

      const response = await this.api.messages.delete({
        cmids: messageId,
        peer_id: peerId,
        delete_for_all: true,
      });
      return response;
    } catch (error) {
      console.log('Произошла ошибка при удалении сообщения:', error);
      return false;
    }
  };

  setTimeoutForMessageRemove(messageId: number, peerId: number, priority: SendMessageData['priority']) {
    if (priority === 'none') return;

    const {low, medium, high} = this.config.messagePrioritiesTimeoutMinutes;

    let timeoutMs = 1000 * 60;

    switch (priority) {
      case 'low':
        timeoutMs *= low;
        break;
      case 'medium':
        timeoutMs *= medium;
        break;
      case 'high':
        timeoutMs *= high;
        break;
    }

    setTimeout(async () => {
      await this.removeMessage(messageId, peerId);
    }, timeoutMs);
  }

  async sendMessage({message, peerId, keyboard, attachment, priority = 'none', skipLastSentCheck = false}: SendMessageData) {
    const isPrivateMessages = peerId <= 2000000000;

    const classData = await this.classes.getClass(peerId);

    const lastSentMessages = classData.lastSentMessages;
    const {maxLastSentMessages} = this.config;

    if (lastSentMessages.length > maxLastSentMessages && !skipLastSentCheck && !isPrivateMessages) {
      this.sendMessage({
        message: 'Подождите, идёт удаление предыдущих сообщений...',
        peerId,
        priority: 'low',
        skipLastSentCheck: true,
      });

      await this.classes.setMessagesHandlingStatus(peerId, false);
      await this.removeAllLastSentMessages(peerId);
      await this.classes.setMessagesHandlingStatus(peerId, true);

      await this.sendMessage({
        message: `За короткий промежуток времени было отправлено больше ${maxLastSentMessages} сообщений.\nВсе предыдущие сообщения бота были удалены.`,
        peerId,
        priority: 'low',
        skipLastSentCheck: true,
      });
    }

    const savedKeyboard = this.savedKeyboards[peerId];
    let usingKeyboard = null;

    if (keyboard) {
      usingKeyboard = keyboard;
      this.savedKeyboards[peerId] = keyboard;
    } else if (savedKeyboard) {
      usingKeyboard = savedKeyboard;
    } else {
      this.savedKeyboards[peerId] = MainKeyboard;
      usingKeyboard = MainKeyboard;
    }

    try {
      const response = await this.api.messages.send({
        message,
        peer_ids: peerId,
        random_id: Math.floor(Math.random() * 10000) * Date.now(),
        attachment,
        dont_parse_links: true,
        keyboard: usingKeyboard,
      }) as unknown as MessagesSendResponse;

      const messageId = response[0].conversation_message_id;

      if (!skipLastSentCheck) this.classes.addLastSentMessage(peerId, messageId);
      if (!isPrivateMessages) this.setTimeoutForMessageRemove(messageId, peerId, priority);
    } catch (error) {
      console.log('Произошла ошибка при отправке сообщения:', error);
    }
  }

  async getUser(userId: number): Promise<GetUserResponse | null> {
    const response = await this.api.users.get({
      user_ids: [userId],
      fields: ['bdate', 'screen_name', 'city'],
    });
    if (!response.length) return null;

    return response[0];
  }

  async uploadAndGetPhoto({photoPath, peerId, stream}: {photoPath?: string, peerId: number, stream?: any}) {
    const {upload_url} = await this.api.photos.getMessagesUploadServer({
      peer_id: peerId,
    });

    const formData = new FormData();

    if (stream) {
      formData.append('photo', stream);
    } else {
      if (!photoPath) return console.log('no photo path');
      formData.append('photo', fs.createReadStream(photoPath));
    }

    const uploadResponse = await axios({
      method: 'post',
      url: upload_url,
      data: formData,
      headers: formData.getHeaders(),
    });

    const {server, hash, photo}: PhotoUploadResponse = uploadResponse.data;

    const saved = await this.api.photos.saveMessagesPhoto({
      photo,
      server,
      hash,
    });

    return saved[0];
  }
}

export default VkService;
