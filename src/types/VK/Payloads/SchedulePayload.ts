import {Payload} from './Payload';

export interface SchedulePayload extends Payload {
  data: {
    action: 'get' | 'update' | 'choose' | 'netCityGetToday';
    filename?: string;
    type?: 'netcity' | 'manual'
  };
};
