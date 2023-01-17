import { Keyboard } from 'vk-io';

import { GradesPayload } from '../types/VK/Payloads/GradesPayload';
// import { HomeworkPayload } from '../types/VK/Payloads/HomeworkPayload';
import { LoginToNetcityPayload } from '../types/VK/Payloads/LoginToNetcityPayload';
import { SchedulePayload } from '../types/VK/Payloads/SchedulePayload';

export const LoginToNetcityKeyboard = Keyboard.builder()
  .inline()
  .textButton({
    label: 'Получить отчёт об оценках',
    color: Keyboard.POSITIVE_COLOR,
    payload: { command: 'grades', data: { action: 'update', forceUpdate: false } } as GradesPayload,
  })
  .row()
  .textButton({
    label: 'Открыть расписание',
    color: Keyboard.PRIMARY_COLOR,
    payload: { command: 'schedule', data: { action: 'get' } } as SchedulePayload,
  })
  // .row()
  // .textButton({
  //   label: 'Домашнее задание',
  //   color: Keyboard.PRIMARY_COLOR,
  //   payload: { command: 'homework', data: { action: 'get' } } as HomeworkPayload,
  // })
  .row()
  .textButton({
    label: 'Выйти из Сетевого Города',
    color: Keyboard.NEGATIVE_COLOR,
    payload: { command: 'loginToNetcity', data: { action: 'logout' } } as LoginToNetcityPayload,
  });
