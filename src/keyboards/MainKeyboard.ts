import { Keyboard } from 'vk-io';

import { SchedulePayload } from '../types/VK/Payloads/SchedulePayload';
import { HomeworkPayload } from '../types/VK/Payloads/HomeworkPayload';
import { AdditionalMenuPayload } from '../types/VK/Payloads/AdditionalMenuPayload';

export const MainKeyboard = Keyboard.builder()
  .textButton({
    label: 'Расписание',
    payload: { command: 'schedule', data: { action: 'get' } } as SchedulePayload,
    color: Keyboard.POSITIVE_COLOR,
  })
  .textButton({
    label: 'Домашнее задание',
    payload: { command: 'homework', data: { action: 'get' } } as HomeworkPayload,
    color: Keyboard.POSITIVE_COLOR,
  })
  .row()
  .textButton({
    label: 'Дополнительно',
    payload: { command: 'additionalMenu', data: { action: 'enable' } } as AdditionalMenuPayload,
    color: Keyboard.SECONDARY_COLOR,
  });
