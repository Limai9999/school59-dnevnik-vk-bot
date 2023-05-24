import path from 'path';
import { Keyboard } from 'vk-io';

import { CommandInputData, CommandOutputData } from '../types/Commands';

import { PreviewCommandPayload } from '../types/VK/Payloads/PreviewCommandPayload';
import { GradesPayload } from '../types/VK/Payloads/GradesPayload';
import { SchedulePayload } from '../types/VK/Payloads/SchedulePayload';

async function command({ message, vk, payload }: CommandInputData) {
  const { peerId } = message;

  const previewCommandPayload = payload as PreviewCommandPayload;
  const action = previewCommandPayload.data.action;

  const previewAssets = path.resolve(__dirname, '../../assets/commandPreviews/');

  if (action === 'netcityLoginExample') {
    const netcityLoginPreviewImage = path.join(previewAssets, 'netcityLoginPreview.png');

    const uploadResponse = await vk.uploadAndGetPhoto({ photoPath: netcityLoginPreviewImage, peerId });
    if (!uploadResponse) return;

    const attachment = vk.createPhotoAttachment(uploadResponse);

    const msg =
    `
Когда вы добавляете свои данные для входа в Сетевой Город, бот сразу же запускает авто-обновление вашей сессии.

Это означает что вам не нужно будет каждый раз ждать, пока Сетевой Город загрузится, а это значит, что вы сможете сразу получить всю нужную вам информацию.

Вот как это работает:
    `;

    return await vk.sendMessage({
      peerId,
      message: msg,
      attachment,
    });
  } else if (action === 'gradesExample') {
    const msg =
    `
Команда "оценки" позволяет просмотреть всю подробную информацию о ваших текущих оценках.

Например, оценки за сегодня, за четверть или же обычный сформированный отчет из Сетевого Города в виде скриншота.

Также, если ваша подписка активна, то бот будет оповещать вас о каждом изменении в отчёте об оценках, начиная от среднего балла или новых оценках, заканчивая добавлением нового предмета в отчёте.

Попробуйте посмотреть, как это работает, на примере чужого (прошлогоднего) отчёта:
    `;

    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: 'Открыть оценки',
        color: Keyboard.POSITIVE_COLOR,
        payload: { command: 'grades', data: { action: 'update', forceUpdate: true, isPreview: true } } as GradesPayload,
      });

    return await vk.sendMessage({
      peerId,
      message: msg,
      keyboard,
    });
  } else if (action === 'scheduleExample') {
    const msg =
    `
Команда "расписание" позволяет получить файлы с расписанием уроков из объявлений Сетевого Города.

Каждый файл автоматически обрабатывается и выдает расписание конкретно для вашего класса.

Также, при обработке файлов, идут различные автоматические проверки:
Бот уведомит вас, если расписание недавно добавилось или было изменено (например, при добавлении урока или при изменении кабинета).

Попробуйте посмотреть, как это работает, на примере прошлогоднего расписания:
    `;

    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: 'Открыть расписание',
        color: Keyboard.POSITIVE_COLOR,
        payload: { command: 'schedule', data: { action: 'get', type: 'netcity', isPreview: true } } as SchedulePayload,
      });

    return await vk.sendMessage({
      peerId,
      message: msg,
      keyboard,
    });
  } else if (action === 'gradesChangesExample') {
    const msg =
    `
Бот оповещает о любых изменениях в отчёте об оценках, даже если это изменение произошло 2 сентября.

Бот отслеживает следующие изменения:
1. Средний балл
2. Добавление новых оценок
3. Убирание существующих оценок
4. Изменение одной оценки на другую
5. Добавление/убирание предметов

Взгляните, как это работает:
    `;

    const changesExample =
    `
В отчёте об оценках произошло 6 изменений:

1) Средний балл предмета "Биология" изменился.
Был: "4,17", стал: "4,09".

2) Средний балл предмета "Физическая культура" изменился.
Был: "2", стал: "5".

3) Средний балл предмета "Информатика" изменился.
Был: "4,5", стал: "4,56".

4) Изменение на 10 мая:
1. По предмету "Биология" была выставлена оценка: "4".

5) Изменение на 19 января:
1. Убрана оценка "2" по предмету "Физическая культура".
2. Оценки по предмету "Информатика" изменились.
Было: "4", стало: "5, 4".

6) Количество предметов в отчёте изменилось.
Было: "17", стало: "18".
    `;

    await vk.sendMessage({
      message: msg,
      peerId,
    });

    await vk.sendMessage({
      message: changesExample,
      peerId,
    });
  } else if (action === 'scheduleChangesExample') {
    const msg =
    `
Бот оповещает о любых изменениях в расписании, от добавления нового урока до изменения кабинета.

Бот отслеживает все изменения в расписании, в том числе:
1. Добавление новых уроков
2. Убирание уроков
3. Изменение кабинета урока
4. Смещение уроков на другое время
    `;

    // TODO: показать, как отображаются изменения

    await vk.sendMessage({
      message: msg,
      peerId,
    });
  }
}

const cmd: CommandOutputData = {
  name: 'previewCommand',
  aliases: [],
  description: null,
  payload: {
    command: 'previewCommand',
    data: { action: 'start' },
  } as PreviewCommandPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    chatOnly: false,
    args: 0,
    paidSubscription: false,
    payloadOnly: true,
  },
  showInAdditionalMenu: false,
  showInCommandsList: false,
  howToUse: null,
  execute: command,
};

export default cmd;
