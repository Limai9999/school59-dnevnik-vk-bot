import {EventInputData, EventOutputData} from '../types/Event/Events';

async function executeEvent({statistics, vk, message}: EventInputData) {
  const {peerId, senderId} = message!;

  const messages = await statistics.getTextMessagesWithoutPayload(peerId);
  const senderMessages = messages.filter((message) => message.userId === senderId);

  const useSenderMessages = Math.random() < 0.2 && senderMessages.length;

  let usingMessages = useSenderMessages ? senderMessages : messages;
  usingMessages = usingMessages.filter((message) => {
    const {text, args} = message!;

    return text!.length >= 10 && args!.length;
  });
  if (!usingMessages.length) return console.log('existingWordsSentence - no usingMessages');

  const randomMessage = usingMessages[Math.floor(Math.random() * usingMessages.length)];

  const words = randomMessage.text!.split(' ');

  let sendingMessage = '';

  const returnOnlyOneWord = Math.random() < 0.1;
  if (returnOnlyOneWord) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    sendingMessage = randomWord;
  } else {
    const randomWords = words.filter(() => Math.random() < 0.8);
    sendingMessage = randomWords.join(' ');
  }

  vk.sendMessage({
    peerId,
    message: sendingMessage,
    priority: 'high',
    skipLastSentCheck: true,
  });
}

const evt: EventOutputData = {
  name: 'existingWordsSentence',
  executeProbability: 0.5,
  execute: executeEvent,
};

export default evt;
