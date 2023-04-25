import { Keyboard } from 'vk-io';

import { CommandInputData, CommandOutputData } from '../types/Commands';
import { AskQuestionPayload } from '../types/VK/Payloads/AskQuestionPayload';

import { DMMainKeyboard } from '../keyboards/DMMainKeyboard';

async function command({ message, vk, utils, chatGPT }: CommandInputData) {
  const payload = message.messagePayload as AskQuestionPayload;
  if (payload && payload.data.action !== 'startSession') return;

  const { peerId } = message;

  const userData = await vk.getUser(peerId);
  const { first_name, last_name, sex } = userData!;

  const session = chatGPT.createChatSession(peerId);
  const username = `${first_name} ${last_name}`;
  let isConversationStopped = false;
  let lastMsgId = 0;

  const sessionKeyboard = Keyboard.builder()
    .textButton({
      label: 'Завершить сессию',
      payload: { command: 'askQuestion', data: { action: 'closeSession' } } as AskQuestionPayload,
      color: Keyboard.NEGATIVE_COLOR,
    });

  const randomMessages = [
    'О чём вы хотите спросить?',
    'Что вам хочется узнать?',
    `О чём хочет узнать ${utils.genderifyWord('наш', sex)} ${first_name}?`,
  ];

  lastMsgId = await vk.sendMessage({
    message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
    peerId,
    keyboard: sessionKeyboard,
  });

  const localWaitForMessage = async (lastMsgId: number) => {
    const waitedMessage = await vk.waitForMessage(peerId, peerId, lastMsgId, 15);
    if (!waitedMessage) {
      await vk.sendMessage({
        message: 'Я не дождался вашего вопроса. Сессия завершена.',
        peerId,
        keyboard: DMMainKeyboard,
      });
      isConversationStopped = true;
      chatGPT.clearChatSession(peerId);
      return;
    }
    if (!waitedMessage.text) {
      await vk.sendMessage({
        message: 'В сообщении нет текста. Попробуйте ещё раз.',
        peerId,
      });
      return;
    }

    return waitedMessage;
  };

  while (!isConversationStopped) {
    const waitedMessage = await localWaitForMessage(lastMsgId);
    if (!waitedMessage) {
      isConversationStopped = true;
      chatGPT.clearChatSession(peerId);
      continue;
    }

    if (waitedMessage.messagePayload) {
      const payload = waitedMessage.messagePayload as AskQuestionPayload;
      if (payload.command === 'askQuestion' && payload.data.action === 'closeSession') {
        await vk.sendMessage({
          message: 'Сессия завершена. Вы возвращены в главное меню.',
          peerId,
          keyboard: DMMainKeyboard,
        });

        isConversationStopped = true;
        chatGPT.clearChatSession(peerId);
        return;
      }
    }

    const randomMessages = [
      'Я думаю...',
      'Думаю над этим...',
      'Размышляю...',
      'Секунду...',
      'Обработка...',
      'Анализирую...',
      'Разбираюсь...',
      'Собираю информацию...',
    ];

    const loadingMsgId = await vk.sendMessage({
      message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
      peerId,
      keyboard: sessionKeyboard,
    });

    const response = await chatGPT.askQuestion(waitedMessage.text!, session, username);
    await vk.removeMessage(loadingMsgId, peerId);

    if (!response.status) {
      lastMsgId = await vk.sendMessage({
        message: `Не удалось обработать ваш вопрос. Попробуйте ещё раз.\n\nОшибка: ${response.error}`,
        peerId,
        keyboard: sessionKeyboard,
      });
      continue;
    }

    lastMsgId = await vk.sendMessage({
      message: response.choice!.message!.content,
      peerId,
      keyboard: sessionKeyboard,
    });
    continue;
  }
}

const cmd: CommandOutputData = {
  name: 'спросить бота',
  aliases: ['askBot'],
  description: 'задать вопрос боту, получив ответ от GPT-3.5',
  payload: {
    command: 'askQuestion',
    data: { action: 'startSession' },
  } as AskQuestionPayload,
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