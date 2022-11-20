import { Payload } from './Payload';

export interface AdminSubscriptionManagePayload extends Payload {
  command: 'manageSubscription'
  data: {
    action: 'selectId' | 'give' | 'takeAway'
  }
}
