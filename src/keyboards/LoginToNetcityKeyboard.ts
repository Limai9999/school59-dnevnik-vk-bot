import {Keyboard} from 'vk-io';

import {GradesPayload} from '../types/VK/Payloads/GradesPayload';
import {LoginToNetcityPayload} from '../types/VK/Payloads/LoginToNetcityPayload';
import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';

export const LoginToNetcityKeyboard = Keyboard.builder()
    .inline()
    .textButton({
      label: 'Расписание на сегодня',
      color: Keyboard.POSITIVE_COLOR,
      payload: {command: 'schedule', data: {action: 'netCityGetToday'}} as SchedulePayload,
    })
    .row()
    .textButton({
      label: 'Оценки за сегодня',
      color: Keyboard.SECONDARY_COLOR,
      payload: {command: 'grades', data: {action: 'today'}} as GradesPayload,
    })
    .textButton({
      label: 'Средний балл',
      color: Keyboard.SECONDARY_COLOR,
      payload: {command: 'grades', data: {action: 'average'}} as GradesPayload,
    })
    .row()
    .textButton({
      label: 'Выйти из Сетевого Города',
      color: Keyboard.NEGATIVE_COLOR,
      payload: {command: 'loginToNetcity', data: {action: 'logout'}} as LoginToNetcityPayload,
    });
