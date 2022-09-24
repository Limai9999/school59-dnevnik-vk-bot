import {Keyboard, KeyboardBuilder} from 'vk-io';

import {CommandInputData, CommandOutputData} from '../types/Commands';
import {AdditionalMenuPayload} from '../types/VK/Payloads/AdditionalMenuPayload';

import {MainKeyboard} from '../keyboards/MainKeyboard';

async function command({message, vk, classes, payload, commands}: CommandInputData) {
  const additionalMenuPayload = payload as AdditionalMenuPayload;

  if (!payload || !additionalMenuPayload.data) return;

  const action = additionalMenuPayload.data.action;
  const actionString = action === 'enable' ? 'открыто' : 'закрыто';

  let keyboard: KeyboardBuilder;

  if (action === 'enable') {
    keyboard = Keyboard.builder()
        .textButton({
          label: 'Вернуться в главное меню',
          payload: {command: 'additional', data: {action: 'disable'}} as AdditionalMenuPayload,
        })
        .row();

    const isDMChat = message.isDM;
    const isAdminChat = message.peerId === vk.config.adminChatID;

    let currentButtonsInRowCount = 0;
    commands.map(({name, payload, showInAdditionalMenu, requirements: {admin, dmOnly}}) => {
      if (!showInAdditionalMenu) return;

      if (dmOnly && !isDMChat) return;
      if (admin && !isAdminChat) return;

      if (currentButtonsInRowCount >= 3) {
        keyboard!.row();
        currentButtonsInRowCount = 0;
      }

      keyboard!.textButton({
        label: name[0].toUpperCase() + name.slice(1),
        payload,
        color: admin ? Keyboard.NEGATIVE_COLOR : Keyboard.PRIMARY_COLOR,
      });

      currentButtonsInRowCount++;
    });
  } else {
    keyboard = MainKeyboard;
  }

  vk.sendMessage({
    message: `Дополнительное меню ${actionString}.`,
    peerId: message.peerId,
    priority: 'low',
    keyboard,
  });
};

const cmd: CommandOutputData = {
  name: 'дополнительное меню',
  aliases: ['дополнительно', 'additional menu'],
  description: 'включить дополнительное меню',
  payload: {
    command: 'additional',
    data: {
      action: 'enable',
    },
  } as AdditionalMenuPayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
  },
  showInCommandsList: false,
  showInAdditionalMenu: false,
  howToUse: null,
  execute: command,
};

export default cmd;
