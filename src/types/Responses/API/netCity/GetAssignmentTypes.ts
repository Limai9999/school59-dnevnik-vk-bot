export type AssignmentType = {
  abbr: string
  id: number
  name: string
  order: number
}

export type GetAssignmentTypesResponse = AssignmentType[]

export type GetAssignmentTypes = {
  status: boolean
  assignmentTypes?: GetAssignmentTypesResponse
  error?: string
}