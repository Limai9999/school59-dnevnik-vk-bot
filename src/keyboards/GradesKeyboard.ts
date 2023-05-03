import { Keyboard } from 'vk-io';

import { GradesPayload } from '../types/VK/Payloads/GradesPayload';
import { PastMandatoryTasksPayload } from '../types/VK/Payloads/PastMandatoryTasksPayload';

export const GradesKeyboard = Keyboard.builder()
  .inline()
  .textButton({
    label: 'Полный отчёт',
    color: Keyboard.POSITIVE_COLOR,
    payload: { command: 'grades', data: { action: 'fullReport' } } as GradesPayload,
  })
  .textButton({
    label: 'За четверть',
    color: Keyboard.POSITIVE_COLOR,
    payload: { command: 'grades', data: { action: 'quarter' } } as GradesPayload,
  })
  .row()
  .textButton({
    label: 'Просроченные задания',
    payload: { command: 'pastMandatoryTasks', data: { action: 'choice' } } as PastMandatoryTasksPayload,
    color: Keyboard.NEGATIVE_COLOR,
  })
  .row()
  .textButton({
    label: 'Недавнее',
    color: Keyboard.PRIMARY_COLOR,
    payload: { command: 'grades', data: { action: 'recently' } } as GradesPayload,
  })
  .row()
  .textButton({
    label: 'Обновить данные',
    color: Keyboard.NEGATIVE_COLOR,
    payload: { command: 'grades', data: { action: 'update', forceUpdate: true } } as GradesPayload,
  });
