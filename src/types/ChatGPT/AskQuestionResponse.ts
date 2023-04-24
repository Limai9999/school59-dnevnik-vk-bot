import { CreateChatCompletionResponseChoicesInner } from 'openai';

export type AskQuestionResponse = {
  status: boolean
  choice?: CreateChatCompletionResponseChoicesInner
  error?: string
}
