import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Monitor name is required'],
      trim: true,
      maxlength: [100, 'Monitor name cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          try {
            const parsed = new URL(v);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
          } catch {
            return false;
          }
        },
        message: 'Please provide a valid HTTP or HTTPS URL'
      }
    },
    method: {
      type: String,
      enum: {
        values: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        message: 'Method must be GET, POST, PUT, DELETE, or HEAD'
      },
      default: 'GET',
      uppercase: true
    },
    interval: {
      type: Number,
      default: 5,
      min: [1, 'Interval must be at least 1 minute'],
      max: [1440, 'Interval cannot exceed 1440 minutes (24 hours)']
    },
    timeout: {
      type: Number,
      default: 30000,
      min: [1000, 'Timeout must be at least 1000ms'],
      max: [60000, 'Timeout cannot exceed 60000ms (60 seconds)']
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'error'],
      default: 'active',
      index: true
    },
    lastChecked: {
      type: Date,
      index: true
    },
    lastStatus: {
      type: String,
      enum: ['up', 'down', 'unknown'],
      default: 'unknown'
    },
    lastResponseTime: {
      type: Number,
      default: null
    },
    lastStatusCode: {
      type: Number,
      default: null
    },
    consecutiveFailures: {
      type: Number,
      default: 0
    },
    uptime7d: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    uptime30d: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    headers: {
      type: Map,
      of: String,
      default: () => new Map()
    },
    body: {
      type: String,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        // Convert headers Map to regular object if necessary
        if (ret.headers instanceof Map) {
          ret.headers = Object.fromEntries(ret.headers);
        }
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

monitorSchema.index({ user: 1, isDeleted: 1 });
monitorSchema.index({ status: 1, isDeleted: 1 });

export const Monitor = mongoose.model('Monitor', monitorSchema);
export default Monitor;
