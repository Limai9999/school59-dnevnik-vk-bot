import { EventInputData, EventOutputData } from '../types/Event/Events';

function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function executeEvent({ vk, message }: EventInputData) {
  if (!message || message.messagePayload || !message.text) return;

  const { peerId, chatId } = message;

  const state = vk.state.chats[peerId].events;
  if (state.pendingOriginalTitle) return console.log('не удалось выполнить changeConversationTitle, т.к оригинальный title еще не вернулся'.red);

  const chatData = await vk.getChat(peerId);
  if (!chatData) return console.log('ошибка при получении ChatData в changeConversationTitle'.red);

  if (!chatData.items[0].chat_settings) return;

  const originalTitle = chatData.items[0].chat_settings.title;
  state.originalTitle = originalTitle;

  const args = message.text.split(' ');
  const randomNumber = getRandomArbitrary(2, 5);

  const slicedArgs = args.slice(0, randomNumber);

  vk.api.messages.editChat({
    chat_id: chatId!,
    title: slicedArgs.join(' '),
  });
  state.pendingOriginalTitle = true;

  setTimeout(async () => {
    const sendJokeMessage = Math.random() < 0.5;

    if (sendJokeMessage) {
      const jokeMessages = [
        'ладно простите это шутка',
        'прикол да??',
        'Извените',
        'От лица Рамзана Кадырова прошу прощения',
        'это была текстовая шутка извините меня',
        'вот ето прикол я снимаю',
        'вот ето прикол',
        'как я посмел такое сделать баран',
      ];
      const jokeMessage = jokeMessages[Math.floor(Math.random() * jokeMessages.length)];

      await vk.sendMessage({
        message: jokeMessage,
        peerId,
        priority: 'none',
        skipLastSentCheck: true,
      });
    }

    await vk.api.messages.editChat({
      chat_id: chatId!,
      title: originalTitle,
    });
    state.pendingOriginalTitle = false;
  }, 1000 * 60 * 2);
}

const evt: EventOutputData = {
  name: 'changeConversationTitle',
  disabled: false,
  executeProbability: 0.05,
  execute: executeEvent,
};

export default evt;
