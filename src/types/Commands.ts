import {MessageContext, ContextDefaultState} from 'vk-io';

import VK from '../modules/VK';
import Classes from '../modules/Classes';

import {Payload} from './VK/Payloads/Payload';

export type CommandInputData = {
  vk: VK;
  classes: Classes;
  message: MessageContext<ContextDefaultState>;
  commands: CommandOutputData[];
  args: string[];
  payload?: Payload
};

export type CommandOutputData = {
  name: string;
  aliases: string[];
  payload: string,
  description: string | null;
  requirements: {
    admin: boolean;
    args: number;
  };
  showInAdditionalMenu: boolean;
  showInCommandsList: boolean;
  howToUse: string | null;
  execute: ({}: CommandInputData) => Promise<void>;
};
