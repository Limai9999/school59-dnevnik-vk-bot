import {Keyboard} from 'vk-io';
import {CommandInputData, CommandOutputData} from '../types/Commands';

async function command({message, vk, commands}: CommandInputData) {
  const isAdminChat = message.peerId === vk.config.adminChatID;

  let cmdCount = 0;
  const commandsFormatted = commands.map(({name, howToUse, description, requirements: {admin}, showInCommandsList}) => {
    if (!isAdminChat && admin) return;
    if (!showInCommandsList) return;

    cmdCount++;

    return `${cmdCount}. ${name}${description ? `: ${description}` : ''}${howToUse ? `\nИспользование: ${name} ${howToUse}` : ''}`;
  }).filter(Boolean);

  const result = `Всего команд - ${commandsFormatted.length}\nСписок доступных команд:\n\n${commandsFormatted.join('\n\n')}`;

  vk.sendMessage({
    message: result,
    peerId: message.peerId,
    priority: 'medium',
  });
}

const cmd: CommandOutputData = {
  name: 'команды',
  aliases: ['список команд'],
  description: 'показать список команд',
  payload: {
    command: 'commands',
    data: {action: 'commands'},
  },
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
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

