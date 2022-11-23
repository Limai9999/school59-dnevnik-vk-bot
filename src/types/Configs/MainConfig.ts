export type MainConfig = {
  testMode: boolean
  APIUrl: string
  secretKey: string
  rapidApiKey: string
  autoUpdateMin: {
    netcity: number
    homework: number
    schedule: number
    grades: number
  }
}
