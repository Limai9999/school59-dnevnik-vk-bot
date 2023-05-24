import { Keyboard } from 'vk-io';
import { CommandInputData, CommandOutputData } from '../types/Commands';

async function command({ message, vk, commands }: CommandInputData) {
  const peerId = message.peerId;
  const isAdminChat = message.peerId === vk.config.adminChatID;
  const isDMChat = message.isDM;

  const showCommandsList = commands.filter((cmd) => cmd.showInCommandsList);

  let meaningsMessage = '';
  const addMeaningMessage = (msg: string) => meaningsMessage.length ? meaningsMessage += `\n${msg}` : meaningsMessage += msg;
  const meaningsShowed = {
    admin: false,
    dmOnly: false,
    paidSubscription: false,
  };

  let cmdIndex = 0;
  const commandsFormatted = showCommandsList.map((cmd) => {
    const { name, description, howToUse, requirements: { admin, dmOnly, paidSubscription, payloadOnly } } = cmd;

    if (dmOnly && !isDMChat) return;
    if (admin && !isAdminChat) return;

    let emoji = '';
    if (admin || dmOnly || paidSubscription) emoji += ' ';
    if (admin) {
      if (!meaningsShowed.admin) {
        addMeaningMessage('🛠️ - только для администраторов');
        meaningsShowed.admin = true;
      }

      emoji += '🛠️';
    }
    if (dmOnly) {
      if (!meaningsShowed.dmOnly) {
        addMeaningMessage('🔒 - только в личных сообщениях');
        meaningsShowed.dmOnly = true;
      }

      emoji += '🔒';
    }
    if (paidSubscription && isDMChat) {
      if (!meaningsShowed.paidSubscription) {
        addMeaningMessage('💸 - требуется активная подписка');
        meaningsShowed.paidSubscription = true;
      }

      emoji += '💸';
    }
    if (admin || dmOnly || paidSubscription) emoji += ' ';

    cmdIndex++;

    return `${cmdIndex}. ${emoji}${name}\nОписание: ${description || 'нет'}\n${payloadOnly ? '⌨️ Работает только по кнопкам.' : howToUse ? `Использование: ${howToUse}` : ''}`;
  });

  const commandsFiltered = commandsFormatted.filter((cmd) => cmd);

  const chatString = isDMChat ? 'Вам' : 'В этой беседе';
  const finalMessage = `${chatString} доступно ${cmdIndex} команд:\n\n${commandsFiltered.join('\n\n')}\n\n${meaningsMessage}`;

  await vk.sendMessage({
    message: finalMessage,
    peerId,
    priority: 'medium',
  });
}

const cmd: CommandOutputData = {
  name: 'команды',
  aliases: ['список команд'],
  description: 'показать список команд',
  payload: {
    command: 'commands',
    data: { action: 'commands' },
  },
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
    payloadOnly: false,
  },
  keyboardData: {
    color: Keyboard.SECONDARY_COLOR,
    positionSeparatelyFromAllButton: true,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;

