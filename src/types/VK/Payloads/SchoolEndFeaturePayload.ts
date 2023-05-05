import { Payload } from './Payload';

export interface SchoolEndFeature9thClassSurveyPayload extends Payload {
  command: 'SchoolEndFeature9thClassSurvey'
  data: {
    action: 'leaving' | 'staying'
  }
}

export interface ExamsSurveyPayload extends Payload {
  command: 'ExamsSurveyPayload'
  data: {
    action: 'chooseSubject' | 'stopChoosing'
    include?: boolean
    subjectName?: string
  }
}