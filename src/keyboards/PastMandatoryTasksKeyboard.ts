import { Keyboard } from 'vk-io';

import { PastMandatoryTasksPayload } from '../types/VK/Payloads/PastMandatoryTasksPayload';

export const PastMandatoryTasksKeyboard = Keyboard.builder()
  .inline()
  .textButton({
    label: 'За эту четверть',
    payload: { command: 'pastMandatoryTasks', data: { action: 'currentQuarter' } } as PastMandatoryTasksPayload,
    color: Keyboard.POSITIVE_COLOR,
  })
  .row()
  .textButton({
    label: 'За всё время',
    payload: { command: 'pastMandatoryTasks', data: { action: 'all' } } as PastMandatoryTasksPayload,
    color: Keyboard.PRIMARY_COLOR,
  });
