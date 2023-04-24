import { ContextDefaultState, MessageContext } from 'vk-io';

import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';

import { AskQuestionResponse } from '../types/ChatGPT/AskQuestionResponse';
import { ChatCompletionError } from '../types/ChatGPT/ChatCompletionError';

interface ISession {
  peerId: number
  messages: ChatCompletionRequestMessage[]
}
class ChatGPT extends OpenAIApi {
  sessions: {
    [peerId: number]: ISession;
  };

  constructor(apiKey: string) {
    const configuration = new Configuration({
      apiKey,
    });

    super(configuration);

    this.sessions = {};
  }

  async generateRandomAnswerMessage(message: MessageContext<ContextDefaultState>): Promise<string | undefined> {
    try {
      const response = await this.createChatCompletion({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        messages: [{
          role: 'user',
          content:
`
Придумай ответное сообщение.
Критерии:
1. Сообщение должно быть от 3 до 20 слов.
2. Сообщение обязано быть в разговорном и неформальном стиле.
3. Не пытайся расставлять запятые и использовать все возможные правила языка, но и не убирай их полностью.

Текст сообщения:
${message.text}
`,
        }],
      });

      return response.data.choices[0].message?.content;
    } catch (error) {
      console.log('generateRandomAnswerMessage error', error);
      return;
    }
  }

  async askQuestion(question: string, session: ISession, username: string): Promise<AskQuestionResponse> {
    if (!session.messages.length) {
      session.messages.push({
        role: 'user',
        content:
        `
Тебе пишут сообщение через чат-бота. Ты и есть этот бот, под названием Chechnya LTD.

Имя пользователя, написавшего сообщение: ${username}.
Сообщение пользователя: ${question}.
        `,
      });
    } else {
      session.messages.push({
        role: 'user',
        content: question,
      });
    }

    try {
      const response = await this.createChatCompletion({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        messages: session.messages,
      }, {
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        const erroredData = response.data as unknown as ChatCompletionError;

        return {
          status: false,
          error: erroredData.error.message,
        };
      }

      session.messages.push(response.data.choices[0].message!);

      return {
        status: true,
        choice: response.data.choices[0],
      };
    } catch (error) {
      console.log('generateRandomAnswerMessage error', error);
      return {
        status: false,
        error: `${error}`,
      };
    }
  }

  createChatSession(peerId: number): ISession {
    this.sessions[peerId] = {
      peerId,
      messages: [],
    };

    return this.sessions[peerId];
  }

  clearChatSession(peerId: number): boolean {
    this.sessions[peerId] = {
      peerId,
      messages: [],
    };

    return true;
  }
}

export default ChatGPT;