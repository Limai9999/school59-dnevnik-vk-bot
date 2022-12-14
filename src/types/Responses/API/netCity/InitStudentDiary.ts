export type InitStudentDiaryResponse = {
  students: [{
    studentId: number
    nickName: string
    className?: any
    classId: number
    iupGrade: number
  }]
  currentStudentId: number
  weekStart: string
  yaClass: boolean
  yaClassAuthUrl: string
  newDiskToken: string
  newDiskWasRequest: boolean
  ttsuRl: string
  externalUrl: string
  weight: boolean
  maxMark: number
  withLaAssigns: boolean
}

export type InitStudentDiary = {
  status: boolean
  data?: InitStudentDiaryResponse
  error?: string
}