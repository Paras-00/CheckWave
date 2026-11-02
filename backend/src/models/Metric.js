import mongoose from 'mongoose';
import config from '../config/config.js';

const metricSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: [true, 'Monitor reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    responseTime: {
      type: Number,
      default: 0
    },
    statusCode: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['up', 'down', 'timeout', 'error'],
      required: true
    },
    errorMessage: {
      type: String,
      default: null
    },
    isUp: {
      type: Boolean,
      required: true,
      index: true
    }
  },
  {
    timestamps: false,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Primary query pattern indexes
metricSchema.index({ monitor: 1, timestamp: -1 });
metricSchema.index({ user: 1, timestamp: -1 });
metricSchema.index({ user: 1, monitor: 1, timestamp: -1 });

// TTL index to automatically purge old metrics
const retentionSeconds = (config.metricRetentionDays || 90) * 24 * 3600;
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: retentionSeconds });

export const Metric = mongoose.model('Metric', metricSchema);
export default Metric;
