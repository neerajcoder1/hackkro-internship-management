import mongoose from 'mongoose';
import { Task } from '../models/task.model.js';
import { User } from '../models/user.model.js';
import { Submission } from '../models/submission.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTaskAssignmentEmail } from '../services/email.service.js';

/**
 * Create a new task (Admin only)
 * POST /api/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, taskType, assignedTo, deadline, maxPoints } = req.body;

  if (!title || !description || !taskType || !assignedTo || !deadline) {
    throw new ApiError(400, 'Title, description, taskType, assignedTo, and deadline are required');
  }

  if (!['daily', 'weekly'].includes(taskType)) {
    throw new ApiError(400, "taskType must be either 'daily' or 'weekly'");
  }

  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    throw new ApiError(400, 'Invalid assignedTo intern ID');
  }

  const intern = await User.findById(assignedTo);
  if (!intern) {
    throw new ApiError(404, 'Assigned user does not exist');
  }

  if (intern.role !== 'intern') {
    throw new ApiError(400, 'Tasks can only be assigned to users with the intern role');
  }

  const parsedDeadline = new Date(deadline);
  if (isNaN(parsedDeadline.getTime())) {
    throw new ApiError(400, 'Invalid deadline date format');
  }

  const points = maxPoints !== undefined ? Number(maxPoints) : 100;
  if (isNaN(points) || points <= 0) {
    throw new ApiError(400, 'maxPoints must be a positive number');
  }

  const task = await Task.create({
    title: title.trim(),
    description: description.trim(),
    taskType,
    assignedTo: intern._id,
    assignedBy: req.user._id,
    deadline: parsedDeadline,
    maxPoints: points,
    status: 'pending',
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');

  // Trigger automated task assignment email notification asynchronously
  sendTaskAssignmentEmail({ intern, task: populatedTask }).catch((err) => {
    console.error(`[TaskController] Email dispatch failed: ${err.message}`);
  });

  return res.status(201).json(
    new ApiResponse(201, populatedTask, 'Task created and assigned successfully')
  );
});

/**
 * Get all tasks with optional filters (Admin only)
 * GET /api/tasks
 */
export const getAllTasks = asyncHandler(async (req, res) => {
  const { status, taskType, assignedTo } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (taskType) filter.taskType = taskType;
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    filter.assignedTo = assignedTo;
  }

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, tasks, 'Tasks retrieved successfully')
  );
});

/**
 * Get task by ID (Admin or assigned intern)
 * GET /api/tasks/:id
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid task ID format');
  }

  const task = await Task.findById(id)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // If intern, verify ownership
  if (req.user.role === 'intern' && task.assignedTo._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You can only view tasks assigned to you');
  }

  return res.status(200).json(
    new ApiResponse(200, task, 'Task details retrieved successfully')
  );
});

/**
 * Update task (Admin only)
 * PATCH /api/tasks/:id
 */
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid task ID format');
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const { title, description, taskType, assignedTo, deadline, maxPoints, status } = req.body;

  if (title) task.title = title.trim();
  if (description) task.description = description.trim();
  if (taskType) {
    if (!['daily', 'weekly'].includes(taskType)) {
      throw new ApiError(400, "taskType must be either 'daily' or 'weekly'");
    }
    task.taskType = taskType;
  }

  if (assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      throw new ApiError(400, 'Invalid assignedTo intern ID');
    }
    const intern = await User.findById(assignedTo);
    if (!intern || intern.role !== 'intern') {
      throw new ApiError(400, 'assignedTo must be a valid user with role intern');
    }
    task.assignedTo = intern._id;
  }

  if (deadline) {
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      throw new ApiError(400, 'Invalid deadline date format');
    }
    task.deadline = parsedDeadline;
  }

  if (maxPoints !== undefined) {
    const points = Number(maxPoints);
    if (isNaN(points) || points <= 0) {
      throw new ApiError(400, 'maxPoints must be a positive number');
    }
    task.maxPoints = points;
  }

  if (status) {
    if (!['pending', 'in-progress', 'submitted', 'completed', 'overdue'].includes(status)) {
      throw new ApiError(400, 'Invalid status value');
    }
    task.status = status;
  }

  await task.save();

  const updatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');

  return res.status(200).json(
    new ApiResponse(200, updatedTask, 'Task updated successfully')
  );
});

/**
 * Delete task (Admin only)
 * DELETE /api/tasks/:id
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid task ID format');
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Delete task and any associated submissions
  await Task.findByIdAndDelete(id);
  await Submission.deleteMany({ task: id });

  return res.status(200).json(
    new ApiResponse(200, null, 'Task and associated submissions deleted successfully')
  );
});

/**
 * Get tasks assigned to current intern
 * GET /api/tasks/my-tasks
 */
export const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('assignedBy', 'name email role')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, tasks, 'My tasks retrieved successfully')
  );
});
