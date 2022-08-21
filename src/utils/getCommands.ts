import fs from 'fs';
import path from 'path';

import {CommandOutputData} from '../types/Commands';

export default async function getCommands(): Promise<CommandOutputData[]> {
  const commands: CommandOutputData[] = [];

  const commandsDir = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsDir)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  await Promise.all(commandFiles.map(async (cmdFile) => {
    const cmd = await import(`../commands/${cmdFile}`);
    commands.push(cmd.default);
  }));

  return commands;
};
