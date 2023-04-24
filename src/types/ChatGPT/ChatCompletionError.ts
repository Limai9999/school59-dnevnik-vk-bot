export type ChatCompletionError = {
  error: {
    code: string | number | null
    message: string
    param: string | null
    type: string
  }
}