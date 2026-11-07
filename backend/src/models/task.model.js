import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    taskType: {
      type: String,
      required: [true, 'Task type is required'],
      enum: {
        values: ['daily', 'weekly'],
        message: '{VALUE} is not a valid task type (must be daily or weekly)',
      },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must be assigned to an intern'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin assigner is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline is required'],
    },
    maxPoints: {
      type: Number,
      required: [true, 'Maximum points are required'],
      min: [1, 'Maximum points must be at least 1'],
      default: 100,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'submitted', 'completed', 'overdue'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model('Task', taskSchema);
