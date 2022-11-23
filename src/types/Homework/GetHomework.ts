import { WeekDay } from '../Responses/API/netCity/GetStudentDiary';

export type GetHomework = {
  status: boolean
  days?: [WeekDay | undefined, WeekDay | undefined]
  error?: string
}
