import {Payload} from './Payload';

export interface GradesPayload extends Payload {
  data: {
    action: 'average' | 'checkIfPasses' | 'today';
  };
};
