import { Attachment } from './GetAnnouncementsResponse';

export type Teacher = {
  id: number
  name: string
}

export type GetAssignDataResponse = {
  activityName?: string
  assignmentName: string
  attachments: Attachment[]
  date: string
  description?: string
  id: number
  isDeleted: boolean
  problemName?: string
  productId?: string
  subjectGroup: {
    id: number
    name: string
  }
  teachers: Teacher[]
  weight: number
}

export type GetAssignData = {
  status: boolean
  assignData?: GetAssignDataResponse
  error?: string
}