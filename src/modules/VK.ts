import {VK, KeyboardBuilder} from 'vk-io';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

import Classes from './Classes';

import {Settings} from '../types/VK/Settings';
import {SendMessageData} from '../types/VK/SendMessageData';
import {VKConfig} from '../types/Configs/VKConfig';
import {State} from '../types/VK/State';

import {MessagesSendResponse} from '../types/VK/Responses/MessagesSendResponse';
import {GetUserResponse} from '../types/VK/Responses/GetUserResponse';
import {GetChatResponse} from '../types/VK/Responses/GetChatResponse';
import {PhotoUploadResponse} from '../types/Responses/PhotoUploadResponse';

import {MainKeyboard} from '../keyboards/MainKeyboard';

import {CommandInputData} from '../types/Commands';

type TempMessage = {
  date: number
  message: CommandInputData['message']
}

class VkService extends VK {
  classes: Classes;
  config: VKConfig;
  savedKeyboards: {
    [peerId: number]: KeyboardBuilder;
  };

  me: {
    name: string;
    id: number;
    isUser: boolean;
  };
  state: State;

  messages: TempMessage[];

  constructor({config, classes, token, isUser}: Settings) {
    super({
      token,
      language: 'ru',
    });

    this.classes = classes;
    this.config = config;
    this.savedKeyboards = {};

    this.me = {name: '', id: 0, isUser};
    this.state = {chats: {}};

    this.messages = [];
  }

  async init() {
    if (!this.me.isUser) await this.updates.start();

    const {id, name} = await this.getMe();
    this.me = {name: name!, id: id!, isUser: this.me.isUser};

    console.log(`VK успешно запущено как ${name} - ${id}.`.blue);

    return this;
  }

  async handleMessage({message}: CommandInputData) {
    this.messages.push({message, date: Date.now()});
  }

  async waitForMessage(fromPeerId: number, fromSenderId: number, searchFromMessageId: number): Promise<CommandInputData['message'] | null> {
    return new Promise((resolve) => {
      // eslint-disable-next-line prefer-const
      let stopTimeout: NodeJS.Timer;

      const findInterval = setInterval(() => {
        const newMessages = this.messages.filter((message) => Date.now() - message.date < 5500 && message.message.conversationMessageId! > searchFromMessageId);
        const message = newMessages.find(({date, message}) => message.peerId === fromPeerId && message.senderId === fromSenderId);

        if (message) {
          resolve(message.message);
          clearInterval(findInterval);
          clearTimeout(stopTimeout);
        }
      }, 2500);

      stopTimeout = setTimeout(() => {
        clearInterval(findInterval);
        resolve(null);
      }, 1000 * 60 * 3);
    });
  }

  async getMe() {
    if (this.me.isUser) {
      const response = await this.api.users.get({});

      const {first_name, last_name, id}: GetUserResponse = response[0];

      return {
        name: `${first_name} ${last_name}`,
        id,
      };
    } else {
      const response = await this.api.groups.getById({
        group_id: this.config.id,
      });

      return response[0];
    }
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
      console.log('Произошла ошибка при удалении сообщения:'.red, error);
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

  async sendMessage({message, peerId, keyboard, attachment, priority = 'none', skipLastSentCheck = false, useAll}: SendMessageData): Promise<number> {
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

      this.setTypingStatus(peerId);

      await this.classes.setMessagesHandlingStatus(peerId, false);
      await this.removeAllLastSentMessages(peerId);
      await this.classes.setMessagesHandlingStatus(peerId, true);

      await this.sendMessage({
        message: `За короткий промежуток времени было отправлено больше ${maxLastSentMessages} сообщений.\nПредыдущие сообщения бота были удалены.`,
        peerId,
        priority: 'low',
        skipLastSentCheck: true,
      });
    }

    const savedKeyboard = this.savedKeyboards[peerId];
    let usingKeyboard = null;

    if (keyboard) {
      usingKeyboard = keyboard;
      if (!keyboard.isInline) this.savedKeyboards[peerId] = keyboard;
    } else if (savedKeyboard) {
      usingKeyboard = savedKeyboard;
    } else {
      this.savedKeyboards[peerId] = MainKeyboard;
      usingKeyboard = MainKeyboard;
    }

    try {
      const response = await this.api.messages.send({
        message: useAll ? message + ' [@all]' : message,
        peer_ids: peerId,
        random_id: Math.floor(Math.random() * 10000) * Date.now(),
        attachment,
        dont_parse_links: true,
        keyboard: usingKeyboard,
      }) as unknown as MessagesSendResponse;

      const messageId = response[0].conversation_message_id;

      if (!skipLastSentCheck) this.classes.addLastSentMessage(peerId, messageId);
      if (!isPrivateMessages) this.setTimeoutForMessageRemove(messageId, peerId, priority);

      return messageId;
    } catch (error) {
      console.log('Произошла ошибка при отправке сообщения:'.red, error);
      return 0;
    }
  }

  addChatToState(peerId: number) {
    this.state.chats[peerId] = {
      events: {
        pendingOriginalPhoto: false,
        pendingOriginalTitle: false,
        originalTitle: 'none',
      },
    };
  };

  async getChatsAdmins() {
    const chats = await this.classes.getAllClasses();

    type GroupAdmins = {
      id: number
      title: string
      admins: number[]
    }

    const admins: GroupAdmins[] = await Promise.all(chats.map(async ({id}) => {
      const chatData = await this.getChat(id);
      if (!chatData || !chatData.chat_settings) return {id, title: 'Неизвестно', admins: []};

      const {chat_settings: {admin_ids, owner_id, title}} = chatData;

      return {id, title, admins: [...admin_ids, owner_id]};
    }));

    return admins;
  }

  async setTypingStatus(peerId: number) {
    return await this.api.messages.setActivity({
      peer_id: peerId,
      type: 'typing',
      group_id: this.me.id,
    });
  };

  async getChat(peerId: number): Promise<GetChatResponse | null> {
    const response = await this.api.messages.getConversationsById({
      peer_ids: peerId,
    });
    if (!response || !response.items || !response.items.length) return null;

    return response.items[0] as unknown as GetChatResponse;
  }

  async getUser(userId: number): Promise<GetUserResponse | null> {
    const response = await this.api.users.get({
      user_ids: [userId],
      fields: ['bdate', 'screen_name', 'city', 'sex'],
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
      if (!photoPath) return console.log('no photo path'.red);
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
