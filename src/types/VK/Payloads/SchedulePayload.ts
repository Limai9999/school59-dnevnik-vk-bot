import {Payload} from './Payload';

export interface SchedulePayload extends Payload {
  data: {
    action: 'get' | 'choose';
    filename?: string;
    type?: 'netcity' | 'manual'
  };
};
