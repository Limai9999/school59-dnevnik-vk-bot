export type Mark = {
  assignmentId: number
  studentId: number
  mark: number
  resultScore?: any
  dutyMark: boolean
}

export type Assignment = {
  id: number
  typeId: number
  assignmentName: string
  weight: number
  dueDate: string
  classMeetingId: number
  mark?: Mark
}

export type Lesson = {
  classmeetingId: number
  day: string
  number: number
  relay: number
  room: string
  startTime: string
  endTime: string
  subjectName: string
  isEaLesson: boolean
  assignments?: Assignment[]
}

export type WeekDay = {
  date: string
  lessons: Lesson[]
}

export type GetStudentDiary = {
  weekStart: string
  weekEnd: string
  weekDays: WeekDay[],
  laAssigns: []
  termName: string
  className: string
}
