import { CommandInputData, CommandOutputData } from '../types/Commands';
import { Payload } from '../types/VK/Payloads/Payload';

async function command({ message, vk, args, events }: CommandInputData) {
  if (!args.length) {
    const eventList = events.events;

    const eventListStringified = eventList.map((event, index) => {
      const { name, executeProbability, disabled } = event;

      const statusString = disabled ? 'Выключено 🔴' : 'Включено 🟢';

      return `${index + 1}. ${name}.\nВероятность запуска: ${executeProbability}\nСтатус: ${statusString}`;
    });

    const eventListMessage = `Всего событий: ${eventList.length}\n\n${eventListStringified.join('\n\n')}\n\nЗапустить событие: useEvent [название].`;

    return vk.sendMessage({
      peerId: message.peerId,
      message: eventListMessage,
    });
  }

  const [executingEventName] = args;

  const executeStatus = await events.executeEventByName(message, executingEventName);
  if (!executeStatus) {
    return vk.sendMessage({
      peerId: message.peerId,
      message: 'Не удалось запустить событие.',
    });
  }
}

const cmd: CommandOutputData = {
  name: 'useEvent',
  aliases: [],
  description: 'запустить ивент по его названию',
  payload: { command: 'useEvent' } as Payload,
  requirements: {
    admin: true,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
    payloadOnly: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
