import { Keyboard } from 'vk-io';

import { CommandInputData, CommandOutputData } from '../types/Commands';
import { AskQuestionPayload } from '../types/VK/Payloads/AskQuestionPayload';

import { DMMainKeyboard } from '../keyboards/DMMainKeyboard';

async function command({ message, vk, utils, chatGPT }: CommandInputData) {
  const payload = message.messagePayload as AskQuestionPayload;
  if (payload && payload.data.action !== 'startSession') return;

  const { peerId, senderId } = message;

  const userData = await vk.getUser(peerId);
  const { sex } = userData!;

  const askForClevernessKeyboard = Keyboard.builder()
    .inline()
    .textButton({
      label: 'Умный',
      color: Keyboard.POSITIVE_COLOR,
      payload: { command: 'askQuestion', data: { action: 'chooseCleverness', cleverness: 'max' } } as AskQuestionPayload,
    })
    .textButton({
      label: 'Неуверенный',
      color: Keyboard.SECONDARY_COLOR,
      payload: { command: 'askQuestion', data: { action: 'chooseCleverness', cleverness: 'min' } } as AskQuestionPayload,
    });

  const askForClevernessMsgId = await vk.sendMessage({
    peerId,
    message: 'Выберите тип сообразительности:',
    keyboard: askForClevernessKeyboard,
  });

  const clevernessResponse = await vk.waitForMessage(peerId, senderId, askForClevernessMsgId);
  if (!clevernessResponse || !clevernessResponse.messagePayload) {
    await vk.sendMessage({
      message: 'Вы не выбрали тип сообразительности. Попробуйте ещё раз.',
      peerId,
    });
    return;
  }

  const clevernessPayload = clevernessResponse.messagePayload as AskQuestionPayload;

  if (clevernessPayload.command !== 'askQuestion' || clevernessPayload.data.action !== 'chooseCleverness') {
    await vk.sendMessage({
      message: 'Вы не выбрали тип сообразительности. Попробуйте ещё раз.',
      peerId,
    });
    return;
  }

  const session = chatGPT.createChatSession(peerId, clevernessPayload.data.cleverness);
  const username = await vk.getRealUserName(peerId) || '* пользователь';
  const firstName = username.split(' ')[0];

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
    `О чём хочет узнать ${utils.genderifyWord('наш', sex)} ${firstName}?`,
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
    payloadOnly: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;