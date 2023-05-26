export type MainConfig = {
  testMode: boolean
  onlyAPIMode: boolean
  APIUrl: string
  secretKey: string
  rapidApiKey: string
  chatGPTKey: string
  autoUpdateMin: {
    netcity: number
    homework: number
    schedule: number
    grades: number
  }
  endingMessageScheduleDate: string
}
