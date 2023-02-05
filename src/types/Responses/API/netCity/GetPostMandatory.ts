export type PastLesson = {
  id: number
  typeId: number
  assignmentName: string
  weight: number
  dueDate: string
  classMeetingId: number
  subjectName: string
}

export type GetPastMandatoryResponse = PastLesson[]

export type GetPastMandatory = {
  status: boolean
  pastMandatory?: GetPastMandatoryResponse
  error?: string
}
