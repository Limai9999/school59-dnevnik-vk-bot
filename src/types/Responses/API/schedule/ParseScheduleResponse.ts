export type ParseScheduleResponse = {
  status: boolean
  message: {
    distant: boolean
    schedule: string[]
    objectedSchedule: [{
      time: string
      lesson?: string
      room?: string
    }]
    startTime: string
    totalLessons: number
    date: string
    filename: string
    room?: number
  }
};
