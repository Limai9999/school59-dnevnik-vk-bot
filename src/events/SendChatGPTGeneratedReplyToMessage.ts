import { EventInputData, EventOutputData } from '../types/Event/Events';

async function executeEvent({ vk, message, chatGPT }: EventInputData) {
  if (!message) return;

  const response = await chatGPT.generateRandomAnswerMessage(message);
  if (!response) return;

  const senderMessageId = message.conversationMessageId;

  await vk.sendMessage({
    peerId: message.peerId,
    message: response,
    priority: 'none',
    skipLastSentCheck: true,
    replyTo: senderMessageId,
  });
}

const evt: EventOutputData = {
  name: 'sendChatGPTGeneratedReplyToMessage',
  disabled: false,
  executeProbability: 0.42,
  execute: executeEvent,
};

export default evt;
