import {EventInputData, EventOutputData} from '../types/Event/Events';

async function executeEvent({statistics, vk, message, classes}: EventInputData) {
  if (!message || !message.text || message.messagePayload) return;
  const msg = message.text.toLowerCase();

  console.log('event');

  const homeworkList = [
    'задали выучить войну и мир',
    'русский страница 650 номер пошол нахуй',
    'русский страница пошол нахуй номер 650',
    'По украинской истории учить кто такие рашисты и что такое русский мир',
    'задали провести референдум по присоединению киева к россии',
    'не скажу',
    'я знаю дз но не скажу',
    'я знаю дз но не скажу азаза',
    'я знаю какое дз но сначала ты переведешь мне 650 рублей',
    'я не знаю',
    'а какая разница вообще?',
    'а какая разница епта',
    'Зачем тебе дз',
    'Нафига тебе дз',
    'Накуя тебе дз',
  ];
  const whatNeedList = [
    'шоколада',
    'корову',
    'рамзана мне надо',
  ];
  const whatToDoList = [
    'снимать чечню и бегать',
    'снимать рамзана и бегать',
    'как что',
    'не знаю пошол нах',
    'извини я не знаю',
  ];
  const whatList = [
    'чо чо рамзан в ачо',
    'да ничо',
    'чо ниче бля нормально общайся',
    'че ты чекаеш?',
    'чо чо чо чечня в ачо',
  ];

  let sendingMessage = '';

  if (msg.match(/че|чо|что/)) {
    sendingMessage = whatList[Math.floor(Math.random() * whatList.length)];
    if (msg.includes('задали') || msg.includes('по')) sendingMessage = homeworkList[Math.floor(Math.random() * homeworkList.length)];
    if (msg.includes('надо') || msg.includes('надобно') || msg.includes('нужно')) sendingMessage = whatNeedList[Math.floor(Math.random() * whatNeedList.length)];
    if (msg.includes('делать')) sendingMessage = whatToDoList[Math.floor(Math.random() * whatToDoList.length)];
  } else if (msg.match(/какое/)) {}

  if (!sendingMessage.length) return;

  vk.sendMessage({
    message: sendingMessage,
    peerId: message.peerId,
    priority: 'none',
    skipLastSentCheck: true,
  });
}

const evt: EventOutputData = {
  name: 'answerMessage',
  disabled: true,
  executeProbability: 0.3,
  execute: executeEvent,
};

export default evt;
