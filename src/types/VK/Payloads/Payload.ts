export interface Payload {
  command: string
  data?: {
    action: string
    isPreview?: boolean
  }
}
