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
