import {Schema, model} from 'mongoose';

const parsedSchedule = {
  status: Boolean,
  filename: String,
  error: String,
  schedule: {
    date: String,
    distant: Boolean,
    filename: String,
    objectedSchedule: [{
      time: String,
      lesson: String,
      room: String,
    }],
    room: Number,
    schedule: [String],
    startTime: String,
    totalLessons: Number,
    creationTime: Number,
  },
};

const classSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  className: {
    type: String,
  },
  netCityData: {
    type: {
      login: String,
      password: String,
    },
  },
  schedule: {
    type: [parsedSchedule],
  },
  manualSchedule: {
    type: [parsedSchedule],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  lastUpdatedScheduleDate: {
    type: Number,
    default: 0,
  },
  lastSentMessages: {
    type: [Number],
  },
  bannedUsers: {
    type: Array,
  },
  handleMessages: {
    type: Boolean,
    default: true,
  },
  connectedProfiles: {
    type: [Number],
  },
  netcitySessionId: {
    type: Number,
  },
}, {
  timestamps: true,
});

export default model('Class', classSchema, 'classes');
