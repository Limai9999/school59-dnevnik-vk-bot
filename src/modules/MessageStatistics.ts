import MessagesDB from '../models/MessageStatistics';
import {MessageStatisticsData} from '../types/MessageStatisticsData';
import {PhotoAttachment} from '../types/VK/Attachments/PhotoAttachment';

class MessageStatistics {
  async saveMessage(message: MessageStatisticsData) {
    return await MessagesDB.create(message);
  }

  async getTextMessagesWithoutPayload(peerId: number) {
    const messages = await MessagesDB.find({peerId, payload: undefined, text: {$ne: null}});
    return Array.from(messages);
  }

  async getPhotoAttachments(peerId: number) {
    const messages = await MessagesDB.find({peerId});

    const photoMessages: PhotoAttachment[] = [];

    messages.map((message) => {
      const {attachments} = message;
      if (!attachments || !attachments.length) return;

      const filteredAttachments: PhotoAttachment[] = attachments.filter((attachment) => attachment.type === 'photo');
      photoMessages.push(...filteredAttachments);
    });

    return photoMessages;
  }
}

export default MessageStatistics;
