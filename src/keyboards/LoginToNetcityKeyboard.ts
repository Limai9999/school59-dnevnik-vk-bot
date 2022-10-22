import {Keyboard} from 'vk-io';

import {GradesPayload} from '../types/VK/Payloads/GradesPayload';
import {LoginToNetcityPayload} from '../types/VK/Payloads/LoginToNetcityPayload';
import {SchedulePayload} from '../types/VK/Payloads/SchedulePayload';

export const LoginToNetcityKeyboard = Keyboard.builder()
    .inline()
    .textButton({
      label: 'Открыть расписание',
      color: Keyboard.POSITIVE_COLOR,
      payload: {command: 'schedule', data: {action: 'get'}} as SchedulePayload,
    })
    .row()
    .textButton({
      label: 'Узнать оценки',
      color: Keyboard.SECONDARY_COLOR,
      payload: {command: 'grades', data: {action: 'update', forceUpdate: false}} as GradesPayload,
    })
    .row()
    .textButton({
      label: 'Выйти из Сетевого Города',
      color: Keyboard.NEGATIVE_COLOR,
      payload: {command: 'loginToNetcity', data: {action: 'logout'}} as LoginToNetcityPayload,
    });
