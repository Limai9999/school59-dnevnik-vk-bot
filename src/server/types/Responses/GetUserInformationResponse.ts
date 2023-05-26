import { IClass } from '../../../models/Class';
import { Session } from '../../../types/Responses/API/netCity/GetCookiesResponse';

import { SubscriptionData } from '../../../types/Subscription/SubscriptionData';
import { GetUserResponse } from '../../../types/VK/Responses/GetUserResponse';
import { GIAExam } from '../../../types/SchoolEndFeature/GIASubjects';

export interface GetUserInformationResponse {
  user: GetUserResponse
  netcity: {
    login: string | null
    password: string | null
    session: Session | null
  }
  className: string
  subscription: SubscriptionData
  usedFreeTrial: boolean
  realUserName: string | null
  schoolEndFeature: {
    survey9thClassStatus: IClass['survey9thClassStatus']
    surveyGIAExams: GIAExam[]
    hasEverBoughtSubscription: boolean
  }
}