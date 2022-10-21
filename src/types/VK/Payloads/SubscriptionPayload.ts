import {Payload} from './Payload';

export interface SubscriptionPayload extends Payload {
  command: 'subscription'
  data: {
    action: 'status' | 'whatCanItDo' | 'subscribe';
  };
};
