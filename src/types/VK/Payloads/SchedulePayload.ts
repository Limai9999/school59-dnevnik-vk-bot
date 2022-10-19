import {Payload} from './Payload';

export interface SchedulePayload extends Payload {
  command: 'schedule'
  data: {
    action: 'get' | 'update' | 'choose' | 'netCityGetToday';
    filename?: string;
    type?: 'netcity' | 'manual'
  };
};
