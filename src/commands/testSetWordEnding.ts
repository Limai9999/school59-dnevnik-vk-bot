import {CommandInputData, CommandOutputData} from '../types/Commands';

export async function command({message, vk, utils, args}: CommandInputData) {
  const [unformattedWord, declination, wordGender, things] = args;

  // @ts-ignore
  const word = utils.setWordEndingBasedOnThingsCount(unformattedWord, Number(declination), Number(wordGender), things);

  await vk.sendMessage({
    message: word,
    peerId: message.peerId,
  });
}

const cmd: CommandOutputData = {
  name: 'testwordending',
  aliases: ['ramzan'],
  description: 'testwordending',
  payload: {
    command: 'ramzan',
    data: {action: 'ramzan'},
  },
  requirements: {
    admin: true,
    dmOnly: false,
    args: 4,
  },
  showInAdditionalMenu: false,
  showInCommandsList: false,
  howToUse: 'testwordending <слово> <склонение> <род> <кол-во>',
  execute: command,
};

export default cmd;
