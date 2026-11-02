import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'high'
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    affectedChecks: {
      type: Number,
      default: 1
    },
    resolvedBy: {
      type: String,
      enum: ['auto', 'manual'],
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

incidentSchema.index({ monitor: 1, status: 1 });
incidentSchema.index({ user: 1, startedAt: -1 });
incidentSchema.index({ user: 1, status: 1 });

export const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
