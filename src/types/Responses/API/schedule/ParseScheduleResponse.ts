export type ParseScheduleResponse = {
  status: boolean
  filename?: string
  error?: string
  schedule?: {
    distant: boolean
    schedule: string[]
    objectedSchedule: {
      time: string
      lesson?: string
      room?: string
    }[]
    startTime: string
    totalLessons: number
    date?: string
    filename: string
    room?: string
    creationTime: number
  }
}
