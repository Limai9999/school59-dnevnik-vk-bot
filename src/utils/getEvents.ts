import fs from 'fs';
import path from 'path';

import {EventOutputData} from '../types/Event/Events';

export default async function getEvents(): Promise<EventOutputData[]> {
  const events: EventOutputData[] = [];

  const eventsDir = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsDir)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  await Promise.all(eventFiles.map(async (eventFile) => {
    const cmd = await import(`../events/${eventFile}`);
    events.push(cmd.default);
  }));

  return events;
};
