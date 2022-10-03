import {DocumentAttachment, Keyboard} from 'vk-io';

import {CommandInputData, CommandOutputData} from '../types/Commands';

import {ParseScheduleResponse} from '../types/Responses/API/schedule/ParseScheduleResponse';

import {ManageChatsPayload} from '../types/VK/Payloads/ManageChatsPayload';

async function command({message, vk, classes, payload, schedule, utils}: CommandInputData) {
  const manageChatsPayload = payload as ManageChatsPayload;

  const action = manageChatsPayload.data.action;

  if (action === 'getchats') {
    const allClasses = await classes.getAllClasses();
    const allAdmins = allClasses.map(({id, connectedProfiles}) => {
      return {id, connectedProfiles: Array.from(connectedProfiles)};
    });

    const chatsWhereAdmin = allAdmins.filter((admin) => admin.connectedProfiles.includes(message.senderId));

    const totalChats = chatsWhereAdmin.length;

    if (!totalChats) {
      return vk.sendMessage({
        message: 'Вы не привязали ни одной беседы к своему профилю.',
        peerId: message.peerId,
      });
    }

    const keyboard = Keyboard.builder()
        .inline();

    let currentButtonsInRowCount = 0;

    chatsWhereAdmin.map(async (chat) => {
      if (currentButtonsInRowCount >= 3) {
        keyboard.row();
        currentButtonsInRowCount = 0;
      }

      const chatData = await vk.getChat(chat.id);
      const {title} = chatData!.chat_settings!;

      keyboard.textButton({
        label: title,
        payload: {
          command: 'manageChats',
          data: {
            action: 'choosechat',
            chatTitle: title,
            chatId: chat.id,
          },
        } as ManageChatsPayload,
        color: Keyboard.PRIMARY_COLOR,
      });

      currentButtonsInRowCount++;
    });

    vk.sendMessage({
      message: `Вы можете управлять ботом в ${totalChats} беседах.\n\nВыберите беседу, в которой вы хотите выполнить действия.`,
      peerId: message.peerId,
      keyboard,
    });
  } else if (action === 'choosechat') {
    const chosenChat = manageChatsPayload.data.chatId!;

    const classData = await classes.getClass(chosenChat);
    const chatData = await vk.getChat(chosenChat);

    const {title, owner_id, members_count} = chatData!.chat_settings!;
    const {className} = classData;

    const ownerData = await vk.getUser(owner_id);
    const {first_name, last_name, id} = ownerData!;

    const ownerString = `[id${id}|${first_name} ${last_name}]`;

    const keyboard = Keyboard.builder()
        .inline()
        .textButton({
          label: 'Опубликовать расписание',
          payload: {
            command: 'manageChats',
            data: {action: 'postschedule', chatId: chosenChat, chatTitle: title},
          } as ManageChatsPayload,
          color: Keyboard.POSITIVE_COLOR,
        })
        .row()
        .textButton({
          label: 'Сделать объявление',
          payload: {
            command: 'manageChats',
            data: {action: 'makeannouncement', chatId: chosenChat, chatTitle: title},
          } as ManageChatsPayload,
          color: Keyboard.PRIMARY_COLOR,
        });

    vk.sendMessage({
      message: `Название: ${title}, ${members_count} участников.\nКласс: ${className}\nСоздатель: ${ownerString}\n\nВыберите действие:`,
      peerId: message.peerId,
      keyboard,
    });
  }

  if (action === 'makeannouncement') {
    const chosenChat = manageChatsPayload.data.chatId!;

    const lastMessageId = await vk.sendMessage({
      message: `Введите текст объявления, либо нажмите "отменить".`,
      peerId: message.peerId,
      keyboard: Keyboard.builder()
          .oneTime()
          .inline()
          .textButton({
            label: 'Отменить',
            color: Keyboard.NEGATIVE_COLOR,
          }),
    });

    const announceMessage = await vk.waitForMessage(message.peerId, message.senderId, lastMessageId);
    if (!announceMessage) {
      return vk.sendMessage({
        message: 'Я не дождался сообщения - отправка объявления отменена.',
        peerId: message.peerId,
      });
    }

    if (!announceMessage.text) {
      return vk.sendMessage({
        message: 'В этом сообщении нет текста, повторите еще раз.',
        peerId: message.peerId,
      });
    }

    const lowerCasedText = announceMessage.text.toLowerCase();
    if (lowerCasedText.includes('отменить')) {
      return vk.sendMessage({
        message: 'Отправка отменена.',
        peerId: message.peerId,
      });
    }

    const announcerData = await vk.getUser(message.senderId);
    const {first_name, last_name} = announcerData!;

    await vk.sendMessage({
      message: `${announceMessage.text} - ${first_name} ${last_name} [@all]`,
      peerId: chosenChat,
      priority: 'none',
      skipLastSentCheck: true,
    });

    vk.sendMessage({
      message: 'Сообщение отправлено.',
      peerId: message.peerId,
    });
  } else if (action === 'postschedule') {
    const chosenChat = manageChatsPayload.data.chatId!;
    const classData = await classes.getClass(chosenChat);

    const lastMessageId = await vk.sendMessage({
      message: `Отправьте .xlsx файл с расписанием в следующем сообщении, или нажмите "отменить"`,
      peerId: message.peerId,
      keyboard: Keyboard.builder()
          .oneTime()
          .inline()
          .textButton({
            label: 'Отменить',
            color: Keyboard.NEGATIVE_COLOR,
          }),
    });

    const attachmentMessage = await vk.waitForMessage(message.peerId, message.senderId, lastMessageId);

    if (!attachmentMessage) {
      return vk.sendMessage({
        message: 'Я не дождался сообщения - отправка расписания отменена.',
        peerId: message.peerId,
      });
    }

    const {text, attachments} = attachmentMessage;

    if (text && text.toLowerCase().includes('отменить')) {
      return vk.sendMessage({
        message: 'Отправка расписания отменена.',
        peerId: message.peerId,
      });
    }

    if (!attachments.length) {
      return vk.sendMessage({
        message: 'Вы не прикрепили никакой файл, повторите еще раз.',
        peerId: message.peerId,
      });
    }

    if (attachments[0].type !== 'doc') {
      return vk.sendMessage({
        message: 'Тип этого файла - не документ, повторите еще раз и прикрепите документ.',
        peerId: message.peerId,
      });
    }

    const attachment = attachments[0] as DocumentAttachment;

    if (attachment.extension !== 'xlsx') {
      return vk.sendMessage({
        message: 'Расширение этого файла - не .xlsx (таблица Excel), повторите еще раз и прикрепите Excel документ.',
        peerId: message.peerId,
      });
    }

    const url = attachment.url!;
    const filename = attachment.title!;

    const saveFileStatus = await schedule.saveFile(url, filename);
    if (!saveFileStatus) {
      return vk.sendMessage({
        message: `Не удалось сохранить этот файл.`,
        peerId: message.peerId,
      });
    }

    const parsedSchedule = await schedule.parse(filename, classData.className!);

    if (!parsedSchedule.status) {
      return vk.sendMessage({
        message: `Не удалось получить расписание из этого файла.\nОшибка: ${parsedSchedule.message}`,
        peerId: message.peerId,
      });
    }

    const isAlreadyExists = classData.manualSchedule.find((existingSchedule) => existingSchedule.message!.filename === parsedSchedule.message.filename);

    if (isAlreadyExists) {
      classData.manualSchedule = classData.manualSchedule.filter((existingSchedule) => existingSchedule.message!.filename !== parsedSchedule.message.filename);
    }

    const newManualSchedule = classData.manualSchedule.concat(parsedSchedule) as ParseScheduleResponse[];
    await classes.setManualSchedule(chosenChat, newManualSchedule);

    const ownerData = await vk.getUser(message.senderId);
    const {first_name, last_name, sex} = ownerData!;

    const action = isAlreadyExists ? 'обновил' : 'добавил';
    const genderifiedAction = utils.genderifyWord(action, sex);

    await vk.sendMessage({
      message: `${first_name} ${last_name} ${genderifiedAction} файл с расписанием: "${filename}" [@all]`,
      peerId: chosenChat,
    });

    vk.sendMessage({
      message: `Вы успешно добавили файл с расписанием: ${filename}`,
      peerId: message.peerId,
    });
  }
}

const cmd: CommandOutputData = {
  name: 'управлять беседой',
  aliases: ['manageChats'],
  description: null,
  payload: {
    command: 'manageChats',
    data: {action: 'getchats'},
  } as ManageChatsPayload,
  requirements: {
    admin: false,
    dmOnly: true,
    args: 0,
  },
  showInAdditionalMenu: true,
  showInCommandsList: true,
  howToUse: null,
  execute: command,
};

export default cmd;
