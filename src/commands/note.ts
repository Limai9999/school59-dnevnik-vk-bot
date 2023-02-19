import { CommandInputData, CommandOutputData } from '../types/Commands';

import { Keyboard } from 'vk-io';

import { NotePayload } from '../types/VK/Payloads/NotePayload';
import { Note } from '../types/Note/Note';

async function command({ message, vk, classes, payload, schedule, utils }: CommandInputData) {
  if (!payload) return;

  const notePayload = payload as NotePayload;
  const action = notePayload.data.action;

  const { peerId, senderId } = message;

  await classes.setLoading(peerId, true);

  let loadingMessageID = 0;

  const removeLoadingMessage = () => {
    if (!loadingMessageID) return;
    return vk.removeMessage(loadingMessageID, peerId);
  };

  loadingMessageID = await vk.sendMessage({
    message: 'Идёт загрузка списка доступных файлов с расписанием...',
    peerId,
  });

  const currentSchedule = await schedule.get(peerId, false);
  const { netcitySchedule } = currentSchedule;
  const netcityFiles = netcitySchedule.schedule!;

  await classes.setLoading(peerId, false);
  removeLoadingMessage();

  const keyboard = Keyboard.builder()
    .inline();

  let resultMessage = '';
  let totalNetcityFiles = 0;

  if (action === 'getSchedule') {
    if (netcitySchedule.status) {
      netcityFiles.map((file, index) => {
        let returningString = '';

        const { filename } = file;

        let date: string | undefined;
        if (file.status) date = file.schedule!.date;

        keyboard.textButton({
          label: date || String(index + 1),
          color: file.status ? Keyboard.PRIMARY_COLOR : Keyboard.NEGATIVE_COLOR,
          payload: {
            command: 'note',
            data: { action: 'chooseSchedule', scheduleFilename: file.filename },
          } as NotePayload,
        });

        returningString += `${index + 1} - ${filename}`;

        if (!file.status) {
          returningString += ' ❌';
          console.log(`${filename}, ошибка:`.red, file.error);
        }

        return returningString;
      });

      totalNetcityFiles = netcityFiles.length;

      const filesCountString = utils.setWordEndingBasedOnThingsCount('foundFiles', totalNetcityFiles);

      resultMessage += `В Сетевом Городе ${filesCountString} с расписанием.\n\nВыберите расписание, в котором вы хотите оставить заметку:`;
    } else {
      resultMessage += `При получении расписания из объявлений Сетевого Города произошла ошибка:\n${netcitySchedule.error!}`;
    }

    await vk.sendMessage({
      message: resultMessage,
      peerId,
      keyboard,
    });
  } else if (action === 'chooseSchedule') {
    const filename = notePayload.data.scheduleFilename!;
    const isExists = netcityFiles.find((scheduleFile) => scheduleFile.filename === filename);

    if (!isExists) {
      return vk.sendMessage({
        message: 'Расписание, которое вы выбрали, не существует.',
        peerId,
      });
    }

    const lastMsgId = await vk.sendMessage({
      message: 'Напишите текст заметки в следующем сообщении...',
      peerId,
    });

    const noteMessage = await vk.waitForMessage(peerId, senderId, lastMsgId);
    if (!noteMessage) {
      return vk.sendMessage({
        message: 'Прикрепление заметки отменено.',
        peerId,
      });
    }

    const note: Note = {
      filename,
      noteText: noteMessage.text!,
    };

    await classes.addNote(peerId, note);

    await vk.sendMessage({
      message: 'Заметка успешно сохранена.',
      peerId,
    });
  }
}

const cmd: CommandOutputData = {
  name: 'Добавить заметку',
  aliases: ['note'],
  description: 'прикрепить заметку к определённому расписанию',
  payload: {
    command: 'note',
    data: { action: 'getSchedule' },
  } as NotePayload,
  requirements: {
    admin: false,
    dmOnly: false,
    args: 0,
    paidSubscription: false,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
