import { Keyboard } from 'vk-io';

import { CommandInputData } from '../types/Commands';

import { HandleHomeworkPayload } from '../types/VK/Payloads/HandleHomeworkPayload';

export default async function handleHomework({ message, classes, vk }: CommandInputData) {
  if (message.isDM) return;
  if (!message.text) return;

  const lowerText = message.text.toLowerCase();

  if (lowerText.startsWith('дз') || lowerText.startsWith('домашнее задание')) {
    if (lowerText.length < 30) return;
  } else {
    return;
  }

  const { peerId, senderId } = message;

  const keyboard = Keyboard.builder()
    .inline()
    .textButton({
      label: 'Закрепить',
      color: Keyboard.POSITIVE_COLOR,
      payload: { command: 'handleHomework', data: { action: 'pin', choice: 'agree' } } as HandleHomeworkPayload,
    })
    .textButton({
      label: 'Не закреплять',
      color: Keyboard.NEGATIVE_COLOR,
      payload: { command: 'handleHomework', data: { action: 'pin', choice: 'disagree' } } as HandleHomeworkPayload,
    });

  const promptMessageId = await vk.sendMessage({
    message: 'Сообщение определено как домашнее задание.\nЗакрепить его?',
    peerId,
    keyboard,
  });

  const replyMessage = await vk.waitForMessage(peerId, senderId, promptMessageId);
  if (!replyMessage || !replyMessage.messagePayload) return;

  const replyPayload = replyMessage.messagePayload as HandleHomeworkPayload;

  if (replyPayload.data.choice === 'agree') {
    await classes.addManualHomework(peerId, {
      date: Date.now() + 1000 * 60 * 60 * 24,
      text: message.text,
      messageId: message.conversationMessageId!,
    });

    await vk.api.messages.pin({
      peer_id: peerId,
      conversation_message_id: message.conversationMessageId,
    });

    await vk.sendMessage({
      message: 'Домашнее задание сохранено и закреплено.',
      peerId,
    });
  } else {
    await vk.sendMessage({
      message: 'Сообщение не закреплено.',
      peerId,
    });
  }
}
