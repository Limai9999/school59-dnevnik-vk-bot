import { CommandInputData, CommandOutputData } from '../types/Commands';

async function command({ message, vk, utils, chatGPT }: CommandInputData) {
  const { peerId } = message;

  const userData = await vk.getUser(peerId);
  const { first_name, last_name, sex } = userData!;

  const randomMessages = [
    'О чём вы хотите спросить?',
    'Что вам хочется узнать?',
    `О чём хочет узнать ${utils.genderifyWord('наш', sex)} ${first_name}?`,
  ];

  const lastMsgId = await vk.sendMessage({
    message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
    peerId,
  });

  const waitedMessage = await vk.waitForMessage(peerId, peerId, lastMsgId);
  if (!waitedMessage) {
    return await vk.sendMessage({
      message: 'Я не дождался вашего вопроса. Попробуйте ещё раз.',
      peerId,
    });
  }
  if (!waitedMessage.text) {
    return await vk.sendMessage({
      message: 'В сообщении нет текста. Попробуйте ещё раз.',
      peerId,
    });
  }

  const loadingMsgId = await vk.sendMessage({
    message: 'Я думаю...',
    peerId,
  });

  const response = await chatGPT.askQuestion(waitedMessage.text, `${first_name} ${last_name}`);
  await vk.removeMessage(loadingMsgId, peerId);

  if (!response) {
    return await vk.sendMessage({
      message: 'Не удалось обработать ваш вопрос. Попробуйте ещё раз.',
      peerId,
    });
  }

  return await vk.sendMessage({
    message: response,
    peerId,
  });
}

const cmd: CommandOutputData = {
  name: 'спросить бота',
  aliases: ['askBot'],
  description: 'задать вопрос боту, получив ответ от GPT-3.5',
  payload: {
    command: 'askQuestion',
    data: { action: 'askQuestion' },
  },
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
    paidSubscription: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;