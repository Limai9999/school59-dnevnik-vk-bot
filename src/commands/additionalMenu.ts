import { ButtonColor, Keyboard, KeyboardBuilder } from 'vk-io';

import { CommandInputData, CommandOutputData } from '../types/Commands';
import { AdditionalMenuPayload } from '../types/VK/Payloads/AdditionalMenuPayload';

import { MainKeyboard } from '../keyboards/MainKeyboard';
import { DMMainKeyboard } from '../keyboards/DMMainKeyboard';

async function command({ message, vk, payload, commands }: CommandInputData) {
  const additionalMenuPayload = payload as AdditionalMenuPayload;

  if (!payload || !additionalMenuPayload.data) return;

  const action = additionalMenuPayload.data.action;
  const actionString = action === 'enable' ? 'открыто' : 'закрыто';

  let keyboard: KeyboardBuilder;

  if (action === 'enable') {
    keyboard = Keyboard.builder()
      .textButton({
        label: 'Вернуться в главное меню',
        payload: { command: 'additionalMenu', data: { action: 'disable' } } as AdditionalMenuPayload,
        color: Keyboard.NEGATIVE_COLOR,
      })
      .row();

    const isDMChat = message.isDM;
    const isAdminChat = message.peerId === vk.config.adminChatID;

    let currentButtonsInRowCount = 0;

    const defaultCommands = commands.filter((cmd) => {
      return !cmd.keyboardData?.positionSeparatelyFromAllButton;
    });
    const separatelyPositionedCommands = commands.filter((cmd) => {
      return cmd.keyboardData?.positionSeparatelyFromAllButton;
    });

    const applyCommands = (commands: CommandOutputData[]) => {
      commands.map(({ name, payload, showInAdditionalMenu, requirements: { admin, dmOnly }, keyboardData }) => {
        if (!showInAdditionalMenu) return;

        if (dmOnly && !isDMChat) return;
        if (admin && !isAdminChat) return;

        if (currentButtonsInRowCount >= 2 || (keyboardData && keyboardData.positionSeparatelyFromAllButton)) {
          keyboard.row();
          currentButtonsInRowCount = 0;
        }

        const keyboardColor = (keyboardData && keyboardData.color) ? keyboardData.color : Keyboard.PRIMARY_COLOR;

        keyboard.textButton({
          label: name[0].toUpperCase() + name.slice(1),
          payload,
          color: keyboardColor,
        });

        currentButtonsInRowCount++;
      });
    };

    applyCommands(defaultCommands);
    applyCommands(separatelyPositionedCommands);
  } else {
    keyboard = message.isDM ? DMMainKeyboard : MainKeyboard;
  }

  vk.sendMessage({
    message: `Дополнительное меню ${actionString}.`,
    peerId: message.peerId,
    priority: 'low',
    keyboard,
  });
}

const cmd: CommandOutputData = {
  name: 'дополнительное меню',
  aliases: ['дополнительно', 'additional menu'],
  description: 'включить дополнительное меню',
  payload: {
    command: 'additionalMenu',
    data: {
      action: 'enable',
    },
  } as AdditionalMenuPayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
  },
  showInCommandsList: false,
  showInAdditionalMenu: false,
  howToUse: null,
  execute: command,
};

export default cmd;
