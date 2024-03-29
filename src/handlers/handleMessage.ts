import VkService from '../modules/VK';

import { CommandInputData, CommandOutputData } from '../types/Commands';
import { SubscriptionData } from '../types/Subscription/SubscriptionData';

import { Payload } from '../types/VK/Payloads/Payload';
import handleHomework from './handleHomework';

function checkCommand({ command, vk, data }: {command: CommandOutputData, vk: VkService, data: {
  isUserAdmin: boolean,
  isAdminChat: boolean,
  isDMChat: boolean,
  args: string[],
  subscriptionData: SubscriptionData,
  hasMessagePayload: boolean,
  isPreview: boolean
}}) {
  const { isUserAdmin, isAdminChat, isDMChat, args, subscriptionData, hasMessagePayload, isPreview } = data;
  const { requirements, name, howToUse } = command;

  if (requirements.admin && !isAdminChat && !isUserAdmin) {
    return {
      status: false,
      errorMessage: null,
    };
  }

  if (requirements.paidSubscription && isDMChat && !subscriptionData.active && !isPreview) {
    return {
      status: false,
      errorMessage: `Для использования этой команды необходимо иметь активную подписку.\n\nОбратитесь к ${vk.getAdminLinkString('администратору')}.`,
    };
  }

  if (requirements.chatOnly && isDMChat) {
    return {
      status: false,
      errorMessage: 'Эта команда работает только в беседе.',
    };
  }

  if (requirements.dmOnly && !isDMChat) {
    return {
      status: false,
      errorMessage: 'Эта команда работает только в личных сообщениях.',
    };
  }

  if (requirements.payloadOnly && !hasMessagePayload) {
    return {
      status: false,
      errorMessage: 'Эта команда работает только по кнопкам.',
    };
  }

  if (requirements.args > args.length) {
    return {
      status: false,
      errorMessage: `Недостаточно параметров для выполнения команды — требуется еще ${requirements.args - args.length}.\n\nВерное использование: ${name} ${howToUse}`,
    };
  }

  return {
    status: true,
    errorMessage: '',
  };
}

export default async function handleMessage({ message, classes, vk, vkUser, commands, statistics, events, schedule, utils, netcityAPI, mainConfig, subscription, api, grades, chatGPT, schoolEndFeature }: CommandInputData) {
  const { text, peerId, senderId, messagePayload, id, hasMessagePayload } = message;

  if (message.isDM) {
    console.log(`Новое личное сообщение от ${peerId}: ${text || '<без текста>'}`.gray);
  } else {
    console.log(`Новое сообщение в беседе ${peerId} от ${senderId}: ${text || '<без текста>'}`.gray);
  }

  const classData = await classes.getClass(peerId);
  const { handleMessages, isLoading, isDisabled } = classData;

  if (isDisabled) return;

  const subscriptionData = await subscription.checkSubscription(peerId);

  // console.log('data sub', subscriptionData);

  if (!handleMessages) return console.log(`Получено сообщение в беседе ${peerId}, но оно не будет обрабатываться, т.к обработка сообщений в данный момент отключена.`.yellow);

  const isAdminChat = peerId === vk.config.adminChatID;
  const isUserAdmin = vk.config.adminUserIDs.includes(senderId);
  const isDMChat = message.isDM;

  if (!isLoading && !isDMChat) events.executeRandomEvent(message);

  vk.handleMessage({ message, classes, vk, vkUser, commands, statistics, events, schedule, args: [], utils, netcityAPI, mainConfig, subscription, api, grades, chatGPT, schoolEndFeature });

  let foundCommandAlias = '';

  const command = commands.find((cmd) => {
    const { name, aliases, payload } = cmd;

    let isFound = false;

    if (messagePayload) {
      const { command } = messagePayload as Payload;

      if (command === payload.command) {
        isFound = true;
      } else {
        return false;
      }
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
    args = utils.caseInsensitiveReplace(text, foundCommandAlias, '')
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

  if (!command) {
    await handleHomework({ message, classes, vk, vkUser, commands, statistics, events, schedule, utils, netcityAPI, mainConfig, subscription, api, grades, args: [], chatGPT, schoolEndFeature });
    return;
  }

  if (mainConfig.testMode && (!isAdminChat && !isUserAdmin)) {
    return vk.sendMessage({
      message: 'Бот временно отключён, попробуйте позже.',
      peerId: message.peerId,
      priority: 'low',
    });
  }

  let isPreview = false;
  if (message.hasMessagePayload) {
    const payload = message.messagePayload as Payload;

    if (payload.data && payload.data.isPreview) isPreview = true;
  }

  const { status, errorMessage } = checkCommand({ command, vk, data: { isAdminChat, isDMChat, args, subscriptionData, isUserAdmin, hasMessagePayload, isPreview } });

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

  console.log(`В ${peerId} выполняется команда ${command.name}.`.green);
  await command.execute({ message, vk, vkUser, classes, args, commands, payload: messagePayload, statistics, events, schedule, utils, netcityAPI, mainConfig, subscription, api, grades, chatGPT, schoolEndFeature });
}
