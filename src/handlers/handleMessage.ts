import {CommandInputData, CommandOutputData} from '../types/Commands';

import {Payload} from '../types/VK/Payloads/Payload';

function checkCommand({command, data}: {command: CommandOutputData, data: {
  isAdminChat: boolean,
  args: string[],
}}) {
  const {isAdminChat, args} = data;
  const {requirements, name, howToUse} = command;

  if (requirements.admin && !isAdminChat) {
    return {
      status: false,
      errorMessage: null,
    };
  }

  if (requirements.args > args.length) {
    return {
      status: false,
      errorMessage: `Недостаточно параметров для выполнения команды - требуется еще ${requirements.args - args.length}.\n\nВерное использование: ${name} ${howToUse}`,
    };
  }

  return {
    status: true,
    errorMessage: '',
  };
}

export default async function handleMessage({message, classes, vk, vkUser, commands, statistics, events}: CommandInputData) {
  const {text, peerId, messagePayload, id} = message;

  console.log(`Новое сообщение в беседе ${peerId}: ${text || '<без текста>'}`);

  const classData = await classes.getClass(peerId);
  const isMessagesHandling = classData.handleMessages;
  if (!isMessagesHandling) return console.log(`Получено сообщение в беседе ${peerId}, но оно не будет обрабатываться, т.к обработка сообщений в данный момент отключена.`);

  events.executeRandomEvent(message);

  let foundCommandAlias = '';

  const command = commands.find((cmd) => {
    const {name, aliases, payload} = cmd;

    let isFound = false;

    if (messagePayload) {
      const {command} = messagePayload as Payload;

      if (command === payload) isFound = true;
    }

    if (!text || !text.length || isFound) return isFound;

    if (text.startsWith(name)) {
      isFound = true;
      foundCommandAlias = name;
    }

    aliases.some((alias) => {
      if (text.startsWith(alias)) {
        isFound = true;
        foundCommandAlias = alias;
        return true;
      }
    });

    return isFound;
  });

  let args: string[] = [];

  if (text) {
    args = text
        .replace(foundCommandAlias, '')
        .trim()
        .split(' ')
        .filter((arg) => arg.length);
  }

  // @ts-ignore
  const attachments = message.message.attachments;

  statistics.saveMessage({
    peerId,
    messageId: message.conversationMessageId!,
    text: message.text,
    attachments,
    args,
    commandName: command?.name,
    date: message.createdAt! * 1000,
    userId: message.senderId!,
    payload: messagePayload,
  });

  if (!command) return;

  const isAdminChat = peerId === vk.config.adminChatID;

  const {status, errorMessage} = checkCommand({command, data: {isAdminChat, args}});

  if (!status) {
    if (!errorMessage) return;

    return vk.sendMessage({
      message: errorMessage,
      peerId,
      priority: 'medium',
    });
  }

  vk.setTypingStatus(peerId);

  vk.setTimeoutForMessageRemove(id, peerId, 'high');

  command.execute({message, vk, vkUser, classes, args, commands, payload: messagePayload, statistics, events});
};
