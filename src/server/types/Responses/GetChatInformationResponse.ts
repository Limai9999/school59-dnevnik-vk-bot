import { IClass } from '../../../models/Class';

import { GetUserResponse } from '../../../types/VK/Responses/GetUserResponse';

export interface GetChatInformationResponse {
  peerId: number
  membersCount: number
  savedMessages: number
  totalMessages: number
  lastMessage: string
  owner: GetUserResponse
  className: string
  netcity: IClass['netCityData']
}