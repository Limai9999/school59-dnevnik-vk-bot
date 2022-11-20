import { Schema, model } from 'mongoose';

const MessageStatisticsSchema = new Schema({
  peerId: {
    type: Number,
    required: true,
  },
  messageId: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
  },
  attachments: {
    type: [Object],
  },
  date: {
    type: Number,
  },
  userId: {
    type: Number,
    required: true,
  },
  args: {
    type: [String],
  },
  commandName: {
    type: String,
  },
  payload: {
    type: Object,
  },
}, {
  timestamps: true,
});

export default model('Statistics', MessageStatisticsSchema, 'statistics');
