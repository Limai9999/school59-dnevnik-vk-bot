import {CommandInputData, CommandOutputData} from '../types/Commands';

import {Payload} from '../types/VK/Payloads/Payload';

function checkCommand({command, data}: {command: CommandOutputData, data: {
  isAdminChat: boolean,
  isDMChat: boolean,
  args: string[],
}}) {
  const {isAdminChat, isDMChat, args} = data;
  const {requirements, name, howToUse} = command;

  if (requirements.dmOnly && !isDMChat) {
    return {
      status: false,
      errorMessage: 'Эта команда работает только в личных сообщениях.',
    };
  }

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

export default async function handleMessage({message, classes, vk, vkUser, commands, statistics, events, schedule, utils, netcityAPI}: CommandInputData) {
  const {text, peerId, senderId, messagePayload, id} = message;

  if (message.isDM) {
    console.log(`Новое личное сообщение от ${peerId}: ${text || '<без текста>'}`.gray);
  } else {
    console.log(`Новое сообщение в беседе ${peerId} от ${senderId}: ${text || '<без текста>'}`.gray);
  }

  const classData = await classes.getClass(peerId);
  const isMessagesHandling = classData.handleMessages;
  const isLoading = classData.isLoading;

  if (!isMessagesHandling) return console.log(`Получено сообщение в беседе ${peerId}, но оно не будет обрабатываться, т.к обработка сообщений в данный момент отключена.`.yellow);

  const isAdminChat = peerId === vk.config.adminChatID;
  const isDMChat = message.isDM;

  if (!isLoading && !isDMChat) events.executeRandomEvent(message);

  vk.handleMessage({message, classes, vk, vkUser, commands, statistics, events, schedule, args: [], utils, netcityAPI});

  let foundCommandAlias = '';

  const command = commands.find((cmd) => {
    const {name, aliases, payload} = cmd;

    let isFound = false;

    if (messagePayload) {
      const {command} = messagePayload as Payload;

      if (command === payload.command) isFound = true;
    }

    if (!text || !text.length || isFound) return isFound;

    const lwText = text.toLowerCase();
    aliases.some((alias) => {
      const lwAlias = alias.toLowerCase();

      if (lwText.startsWith(lwAlias)) {
        isFound = true;
        foundCommandAlias = lwAlias;
        return true;
      }
    });

    const lwName = name.toLowerCase();
    if (lwText.startsWith(lwName)) {
      isFound = true;
      foundCommandAlias = lwName;
    }

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

  const {status, errorMessage} = checkCommand({command, data: {isAdminChat, isDMChat, args}});

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

  if (isLoading) {
    return vk.sendMessage({
      message: 'Прости, я не могу выполнить эту команду, пока не выполню предыдущую.',
      peerId: message.peerId,
      priority: 'low',
    });
  }

  command.execute({message, vk, vkUser, classes, args, commands, payload: messagePayload, statistics, events, schedule, utils, netcityAPI});
};
