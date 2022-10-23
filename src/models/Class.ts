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

const totalStudentReport = {
  status: Boolean,
  error: String,
  info: [String],
  result: {
    daysData: [{
      month: String,
      day: String,
      lessonsWithGrades: [{
        grades: [String],
        lesson: String,
      }],
    }],
    averageGrades: [{
      lesson: String,
      average: String,
    }],
  },
  screenshot: String,
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
  subscription: {
    type: {
      active: Boolean,
      endDate: Number,
    },
  },
  totalStudentReport: {
    type: totalStudentReport,
  },
  lastUpdatedTotalStudentReport: {
    type: Number,
    default: 0,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default model('Class', classSchema, 'classes');
