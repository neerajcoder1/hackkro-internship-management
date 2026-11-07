import mongoose from 'mongoose';

const githubUrlRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/.*)?$/;

const submissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
      index: true,
    },
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Intern reference is required'],
      index: true,
    },
    githubUrl: {
      type: String,
      required: [true, 'GitHub repository or pull request URL is required'],
      trim: true,
      match: [githubUrlRegex, 'Please provide a valid GitHub repository or pull request URL'],
    },
    submissionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['submitted', 'approved', 'rejected'],
        message: '{VALUE} is not a valid submission status',
      },
      default: 'submitted',
      index: true,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: [0, 'Points awarded cannot be negative'],
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isEvaluated: {
      type: Boolean,
      default: false,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Submission = mongoose.model('Submission', submissionSchema);
