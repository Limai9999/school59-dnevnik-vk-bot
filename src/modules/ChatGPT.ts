import { ContextDefaultState, MessageContext } from 'vk-io';

import { Configuration, OpenAIApi } from 'openai';

class ChatGPT extends OpenAIApi {
  constructor(apiKey: string) {
    const configuration = new Configuration({
      apiKey,
    });

    super(configuration);
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

  async askQuestion(question: string, username: string): Promise<string | undefined> {
    try {
      const response = await this.createChatCompletion({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: `Тебе задают вопрос. Имя человека задавшего вопрос: "${username}". Рекомендуется обратиться по имени. Вопрос: ${question}`,
        }],
      });

      return response.data.choices[0].message?.content;
    } catch (error) {
      console.log('generateRandomAnswerMessage error', error);
      return;
    }
  }
}

export default ChatGPT;