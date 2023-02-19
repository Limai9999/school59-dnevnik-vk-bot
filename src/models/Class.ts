import { Document, Schema, model } from 'mongoose';

import { GetHomework } from '../types/Homework/GetHomework';
import { ManualHomework } from '../types/Homework/ManualHomework';
import { GetTotalStudentReport } from '../types/Responses/API/grades/GetTotalStudentReport';
import { ParseScheduleResponse } from '../types/Responses/API/schedule/ParseScheduleResponse';
import { Note } from '../types/Note/Note';

export interface IClass {
  id: number
  className: string
  netCityData: {
    login: string
    password: string
  }
  schedule: ParseScheduleResponse[]
  manualSchedule: ParseScheduleResponse[]
  isLoading: boolean
  lastUpdatedScheduleDate: number
  lastSentMessages: number[]
  bannedUsers: []
  handleMessages: boolean
  connectedProfiles: number[]
  netcitySessionId: number
  subscription: {
    active: boolean
    endDate: number
  }
  totalStudentReport: GetTotalStudentReport
  lastUpdatedTotalStudentReport: number
  isDisabled: boolean
  manualHomework: ManualHomework[]
  homework: GetHomework
  lastUpdatedHomework: number
  notes: Note[]
}

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
    room: String,
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
    default: null,
  },
  netCityData: {
    type: {
      login: String,
      password: String,
    },
  },
  schedule: {
    type: [parsedSchedule],
    default: [],
  },
  manualSchedule: {
    type: [parsedSchedule],
    default: [],
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
    default: [],
  },
  bannedUsers: {
    type: Array,
    default: [],
  },
  handleMessages: {
    type: Boolean,
    default: true,
  },
  connectedProfiles: {
    type: [Number],
    default: [],
  },
  netcitySessionId: {
    type: Number,
    default: 0,
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
  manualHomework: {
    type: [{
      date: Number,
      text: String,
      messageId: Number,
    }],
  },
  homework: {
    type: {
      status: Boolean,
      days: [Object],
      error: String,
    },
  },
  lastUpdatedHomework: {
    type: Number,
    default: 0,
  },
  notes: {
    type: [{
      filename: String,
      noteText: String,
    }],
  },
}, {
  timestamps: true,
});

export type ClassDoc = IClass & Document

export default model<ClassDoc>('Class', classSchema, 'classes');
