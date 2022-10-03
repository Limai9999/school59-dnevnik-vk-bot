import {Payload} from './Payload';

export interface SchedulePayload extends Payload {
  data: {
    action: 'get' | 'choose' | 'netCityGetToday';
    filename?: string;
    type?: 'netcity' | 'manual'
  };
};
