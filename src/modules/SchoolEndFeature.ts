import { Keyboard } from 'vk-io';

import Classes from './Classes';
import Utils from './Utils';
import VK from './VK';

import { ExamsSurveyPayload, SchoolEndFeature9thClassSurveyPayload } from '../types/VK/Payloads/SchoolEndFeaturePayload';
import { SurveyResponse } from '../types/SchoolEndFeature/SurveyResponse';
import { GIAExam } from '../types/SchoolEndFeature/GIASubjects';
import { GIAExamsDataConfig } from '../types/Configs/GIAExamsDataConfig';
import { EndingMessageResponse } from '../types/SchoolEndFeature/EndingMessageResponse';

import { getGIAExamsDataConfig } from '../utils/getConfig';

import { DMMainKeyboard } from '../keyboards/DMMainKeyboard';

export default class SchoolEndFeature {
  vk: VK;
  classes: Classes;
  utils: Utils;

  GIAExamsData: GIAExamsDataConfig;

  constructor(vk: VK, classes: Classes, utils: Utils) {
    this.vk = vk;
    this.classes = classes;
    this.utils = utils;

    this.GIAExamsData = getGIAExamsDataConfig();
  }

  async makeSurveyAbout9thClass(peerId: number): Promise<SurveyResponse> {
    const user = await this.vk.getUser(peerId);
    if (!user) {
      return {
        status: false,
        error: 'Пользователь не найден.',
      };
    }

    const realName = await this.vk.getRealUserName(peerId);
    const firstName = realName.split(' ')[0];

    const message = `Привет, ${firstName}.\nУ меня к тебе небольшой, но важный вопрос.\n\nПокидаешь ли ты школу после 9 класса или собираешься продолжать учиться до 11 класса?`;
    const keyboard = Keyboard.builder()
      .inline()
      .textButton({
        label: 'Ухожу',
        color: Keyboard.PRIMARY_COLOR,
        payload: { command: 'SchoolEndFeature9thClassSurvey', data: { action: 'leaving' } } as SchoolEndFeature9thClassSurveyPayload,
      })
      .textButton({
        label: 'Остаюсь',
        color: Keyboard.PRIMARY_COLOR,
        payload: { command: 'SchoolEndFeature9thClassSurvey', data: { action: 'staying' } } as SchoolEndFeature9thClassSurveyPayload,
      });

    const askMessageId = await this.vk.sendMessage({
      message,
      peerId,
      keyboard,
    });

    const waitedAnswer = await this.vk.waitForMessage(peerId, peerId, askMessageId, 60);
    if (!waitedAnswer || !waitedAnswer.messagePayload || !waitedAnswer.text) {
      await this.vk.sendMessage({
        message: 'Пожалуйста, ответь на мой вопрос, используя кнопки.',
        peerId,
      });
      return this.makeSurveyAbout9thClass(peerId);
    }

    const waitedAnswerPayload = waitedAnswer.messagePayload as SchoolEndFeature9thClassSurveyPayload;
    if (waitedAnswerPayload.command !== 'SchoolEndFeature9thClassSurvey') {
      await this.vk.sendMessage({
        message: 'Пожалуйста, ответь на мой вопрос, используя кнопки.',
        peerId,
      });
      return this.makeSurveyAbout9thClass(peerId);
    }

    const status = waitedAnswerPayload.data.action;

    await this.classes.set9thClassSurveyStatus(peerId, status);

    await this.vk.sendMessage({
      message: 'Хорошо, спасибо за ответ. Это было важно для меня.',
      peerId,
    });

    return {
      status: true,
    };
  }

  async makeSurveyAboutExams(peerId: number): Promise<SurveyResponse> {
    const user = await this.vk.getUser(peerId);
    if (!user) {
      return {
        status: false,
        error: 'Пользователь не найден.',
      };
    }

    const realName = await this.vk.getRealUserName(peerId);
    const firstName = realName.split(' ')[0];

    let chosenExams: GIAExam[] = [];
    let choosingIsActive = true;

    await this.vk.sendMessage({
      message: `Привет, ${firstName}.\nНа этот раз мне хотелось бы узнать, какие предметы вы выбрали для сдачи экзамена (ОГЭ/ГВЭ).\n\nПожалуйста выберите до 4-х предметов, используя кнопки на клавиатуре.`,
      peerId,
    });

    await new Promise<void>(async (resolve) => {
      while (choosingIsActive) {
        const keyboard = Keyboard.builder();
        let kbRowButtons = 0;

        if (chosenExams.length >= 2) {
          keyboard.textButton({
            label: 'Закончить выбор',
            color: Keyboard.POSITIVE_COLOR,
            payload: { command: 'ExamsSurveyPayload', data: { action: 'stopChoosing' } } as ExamsSurveyPayload,
          });
          keyboard.row();
        }

        this.GIAExamsData.map((exam) => {
          if (kbRowButtons >= 2) {
            keyboard.row();
            kbRowButtons = 0;
          }
          const isAlreadyChosen = !!chosenExams.find((stateExam) => stateExam.subject === exam.subject);

          keyboard.textButton({
            label: exam.subject,
            color: isAlreadyChosen ? Keyboard.POSITIVE_COLOR : Keyboard.PRIMARY_COLOR,
            payload: { command: 'ExamsSurveyPayload', data: { action: 'chooseSubject', include: !isAlreadyChosen, subjectName: exam.subject } } as ExamsSurveyPayload,
          });
          kbRowButtons++;
        });

        const subjectsString = this.utils.setWordEndingBasedOnThingsCount('subjectsCount', chosenExams.length);
        const message = (!chosenExams.length ? 'Пока что вы не выбрали ни одного предмета.' : `Вы выбрали ${chosenExams.length} ${subjectsString}.`);
        const askMessageId = await this.vk.sendMessage({
          message,
          peerId,
          keyboard,
        });

        const answer = await this.vk.waitForMessage(peerId, peerId, askMessageId, 15);
        if (!answer || !answer.text || !answer.messagePayload) {
          await this.vk.sendMessage({
            message: 'Пожалуйста выберите до 4-х предметов, используя кнопки на клавиатуре.',
            peerId,
          });
          continue;
        }

        const answerPayload = answer.messagePayload as ExamsSurveyPayload;
        if (answerPayload.command !== 'ExamsSurveyPayload') {
          await this.vk.sendMessage({
            message: 'Пожалуйста выберите до 4-х предметов, используя кнопки на клавиатуре.',
            peerId,
          });
          continue;
        }

        if (answerPayload.data.action === 'chooseSubject') {
          const chosenExamData = this.GIAExamsData.find((exam) => exam.subject === answerPayload.data.subjectName!)!;

          if (answerPayload.data.include) {
            if (chosenExams.length >= 4) {
              await this.vk.sendMessage({
                message: 'Вы уже выбрали 4 предмета - максимально кол-во экзаменов.\nУберите лишнее, чтобы выбрать другие предметы.',
                peerId,
              });
              continue;
            }

            chosenExams.push(chosenExamData);
          } else {
            chosenExams = chosenExams.filter((exam) => exam.subject !== answerPayload.data.subjectName);
          }

          continue;
        } else if (answerPayload.data.action === 'stopChoosing') {
          const chosenExamsStrings = chosenExams.map((exam) => {
            return exam.subject;
          });

          await this.vk.sendMessage({
            message: `Вы выбрали ${chosenExamsStrings.length} предмета:\n${chosenExamsStrings.join(', ')}.\n\nСпасибо за ответ.`,
            peerId,
            keyboard: DMMainKeyboard,
          });

          choosingIsActive = false;
          resolve();
        }
      }
    });

    await this.classes.setSurveyGIAExams(peerId, chosenExams);

    return {
      status: true,
    };
  }

  async setHasEverBoughtSubscription(peerId: number, hasEverBoughtSubscription: boolean) {
    await this.classes.setHasEverBoughtSubscription(peerId, hasEverBoughtSubscription);

    return true;
  }

  async makeEndingMessage(peerId: number): Promise<EndingMessageResponse> {
    const user = await this.vk.getUser(peerId);
    if (!user) {
      return {
        status: false,
        error: 'Пользователь не найден.',
      };
    }

    const realName = await this.vk.getRealUserName(peerId);
    const firstName = realName.split(' ')[0];

    // TODO: придумать конечные сообщения
    const message = firstName + ' Конечное сообщение';

    return {
      status: true,
      message,
    };
  }
}
