import {Keyboard} from 'vk-io';

import {AdditionalMenuPayload} from '../types/VK/Payloads/AdditionalMenuPayload';
import {LoginToNetcityPayload} from '../types/VK/Payloads/LoginToNetcityPayload';
import {SubscriptionPayload} from '../types/VK/Payloads/SubscriptionPayload';

export const DMMainKeyboard = Keyboard.builder()
    .textButton({
      label: 'Войти в Сетевой Город',
      payload: {command: 'loginToNetcity', data: {action: 'login'}} as LoginToNetcityPayload,
      color: Keyboard.PRIMARY_COLOR,
    })
    .row()
    .textButton({
      label: 'Подписка',
      payload: {command: 'subscription', data: {action: 'status'}} as SubscriptionPayload,
      color: Keyboard.POSITIVE_COLOR,
    })
    .row()
    .textButton({
      label: 'Дополнительно',
      payload: {command: 'additionalMenu', data: {action: 'enable'}} as AdditionalMenuPayload,
      color: Keyboard.SECONDARY_COLOR,
    });
