import {Schema, model} from 'mongoose';

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
    type: [{
      status: Boolean,
      message: {
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
      },
    }],
  },
  lastUpdatedScheduleDate: {
    type: Number,
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
}, {
  timestamps: true,
});

export default model('Class', classSchema, 'classes');
