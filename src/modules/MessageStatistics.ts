import MessagesDB from '../models/MessageStatistics';
import { MessageStatisticsData } from '../types/MessageStatisticsData';
import { PhotoAttachment } from '../types/VK/Attachments/PhotoAttachment';

class MessageStatistics {
  async saveMessage(message: MessageStatisticsData) {
    return await MessagesDB.create(message);
  }

  async getTextMessagesWithoutPayload(peerId: number) {
    const messages = await MessagesDB.find({ peerId, payload: undefined, text: { $ne: null } });
    return Array.from(messages);
  }

  async getPhotoAttachments(peerId: number) {
    const messages = await MessagesDB.find({ peerId });

    const photoMessages: PhotoAttachment[] = [];

    messages.map((message) => {
      const { attachments } = message;
      if (!attachments || !attachments.length) return;

      const filteredAttachments: PhotoAttachment[] = attachments.filter((attachment) => attachment.type === 'photo');
      photoMessages.push(...filteredAttachments);
    });

    return photoMessages;
  }

  async getMessagesCount(peerId: number) {
    const messages = await MessagesDB.find({ peerId });
    return messages.length;
  }

  async getLastMessageText(peerId: number): Promise<{id: number, text: string}> {
    const newestMessage = await MessagesDB.findOne({ peerId }, {}, { sort: { 'created_at': -1 } });
    if (!newestMessage) return { id: 0, text: '<< неизвестно >>' };

    const text = newestMessage.text ? newestMessage.text : '<< вложение >>';
    return { id: newestMessage.messageId, text };
  }
}

export default MessageStatistics;
