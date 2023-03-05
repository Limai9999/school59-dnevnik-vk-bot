import { SubscriptionData } from '../../../types/Subscription/SubscriptionData';
import { GetUserResponse } from '../../../types/VK/Responses/GetUserResponse';

export interface GetUserInformationResponse {
  user: GetUserResponse
  netcity: {
    login: string | null
    password: string | null
  }
  className: string
  subscription: SubscriptionData
}