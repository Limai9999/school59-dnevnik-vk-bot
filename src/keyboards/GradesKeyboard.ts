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
  .row()
  .textButton({
    label: 'Просроченные задания',
    payload: { command: 'pastMandatoryTasks', data: { action: 'choice' } } as PastMandatoryTasksPayload,
    color: Keyboard.NEGATIVE_COLOR,
  })
  .row()
  .textButton({
    label: 'За сегодня',
    color: Keyboard.PRIMARY_COLOR,
    payload: { command: 'grades', data: { action: 'today' } } as GradesPayload,
  })
  .textButton({
    label: 'Средний балл',
    color: Keyboard.PRIMARY_COLOR,
    payload: { command: 'grades', data: { action: 'average' } } as GradesPayload,
  })
  .row()
  .textButton({
    label: 'Обновить',
    color: Keyboard.NEGATIVE_COLOR,
    payload: { command: 'grades', data: { action: 'update', forceUpdate: true } } as GradesPayload,
  });
