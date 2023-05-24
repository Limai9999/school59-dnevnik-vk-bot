import { Keyboard } from 'vk-io';

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { ConnectDMPayload } from '../types/VK/Payloads/ConnectDMPayload';

export async function command({ message, vk, classes, payload }: CommandInputData) {
  let loadingMessageID = 0;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, message.peerId);
  };

  loadingMessageID = await vk.sendMessage({
    message: 'Подождите, идёт загрузка бесед...',
    peerId: message.peerId,
    priority: 'none',
  });

  const groups = await vk.getChatsAdmins();

  removeLoadingMessage();

  const adminStatuses = groups.map(({ id, title, admins }) => {
    const isAdmin = admins.includes(message.senderId);

    return {
      id,
      title,
      isAdmin,
    };
  });
  const whereUserIsAdmin = adminStatuses.filter(({ isAdmin }) => isAdmin);

  const connectDMPayload = payload as ConnectDMPayload;
  const action = connectDMPayload.data.action;

  if (action === 'findgroups') {
    const totalGroups = whereUserIsAdmin.length;

    if (!totalGroups) {
      return vk.sendMessage({
        message: 'Вы не администратор ни в одной из бесед.',
        peerId: message.peerId,
      });
    }

    const keyboard = Keyboard.builder()
      .inline();

    let currentButtonsInRowCount = 0;

    whereUserIsAdmin.map((group, index) => {
      if (currentButtonsInRowCount >= 3) {
        keyboard.row();
        currentButtonsInRowCount = 0;
      }

      keyboard.textButton({
        label: group.title,
        payload: {
          command: 'connectDMWithChat',
          data: {
            action: 'chooseGroup',
            chatTitle: group.title,
            chatId: group.id,
          },
        } as ConnectDMPayload,
        color: Keyboard.PRIMARY_COLOR,
      });

      currentButtonsInRowCount++;

      return `${index + 1}. ${group.title}`;
    });

    return vk.sendMessage({
      message: `Вы админ в ${totalGroups} беседах.\n\nВыберите беседу, в которой вы хотите управлять ботом.`,
      peerId: message.peerId,
      keyboard,
    });
  } else if (action === 'chooseGroup') {
    const chosenChat = connectDMPayload.data.chatId!;

    const classData = await classes.getClass(chosenChat);
    let addedAdmins = classData.connectedProfiles;

    if (addedAdmins.includes(message.senderId)) {
      addedAdmins = addedAdmins.filter((addedAdmin) => addedAdmin !== message.senderId);

      await classes.setConnectedProfiles(chosenChat, addedAdmins);

      vk.sendMessage({
        message: `Вы больше не управляете ботом в беседе ${connectDMPayload.data.chatTitle!}`,
        peerId: message.peerId,
      });
    } else {
      addedAdmins.push(message.senderId);

      await classes.setConnectedProfiles(chosenChat, addedAdmins);

      vk.sendMessage({
        message: `Теперь вы можете управлять ботом в беседе ${connectDMPayload.data.chatTitle!}`,
        peerId: message.peerId,
      });
    }
  }
}

const cmd: CommandOutputData = {
  name: 'привязать группу',
  aliases: ['connectDMWithChat'],
  description: 'привязывает ваш профиль с определённой беседой, чтобы вы могли частично управлять ботом',
  payload: {
    command: 'connectDMWithChat',
    data: {
      action: 'findgroups',
    },
  } as ConnectDMPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    chatOnly: false,
    args: 0,
    paidSubscription: false,
    payloadOnly: true,
  },
  keyboardData: {
    color: Keyboard.PRIMARY_COLOR,
    positionSeparatelyFromAllButton: false,
  },
  showInAdditionalMenu: true,
  showInCommandsList: false,
  howToUse: null,
  execute: command,
};

export default cmd;
