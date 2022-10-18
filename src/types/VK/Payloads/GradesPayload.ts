import {Payload} from './Payload';

export interface GradesPayload extends Payload {
  data: {
    action: 'chooseMenu' | 'average' | 'checkIfPasses' | 'today';
  };
};
