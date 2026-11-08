import mongoose from 'mongoose';
import { Submission } from '../models/submission.model.js';
import { Task } from '../models/task.model.js';
import { AdminHistory } from '../models/adminHistory.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  sendTaskSubmissionEmail,
  sendTaskEvaluationEmail,
} from '../services/email.service.js';

const githubUrlRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/.*)?$/;

/**
 * Submit work for an assigned task (Intern only)
 * POST /api/submissions
 */
export const submitTask = asyncHandler(async (req, res) => {
  const { taskId, githubUrl, submissionNotes } = req.body;

  if (!taskId || !githubUrl) {
    throw new ApiError(400, 'taskId and githubUrl are required');
  }

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid task ID format');
  }

  if (!githubUrlRegex.test(githubUrl.trim())) {
    throw new ApiError(400, 'Please provide a valid GitHub repository or pull request URL');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Security: Intern can only submit their own assigned task
  if (task.assignedTo.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Forbidden: You are not authorized to submit work for this task');
  }

  // Prevent re-submission of already approved/completed tasks
  if (task.status === 'completed') {
    throw new ApiError(400, 'This task has already been completed and approved');
  }

  // Prevent duplicate submissions while a submission is already pending review
  const activeSubmission = await Submission.findOne({
    task: taskId,
    intern: req.user._id,
    status: 'submitted',
  });

  if (activeSubmission) {
    throw new ApiError(400, 'A submission for this task is already awaiting review');
  }

  const submission = await Submission.create({
    task: taskId,
    intern: req.user._id,
    githubUrl: githubUrl.trim(),
    submissionNotes: submissionNotes ? submissionNotes.trim() : '',
    status: 'submitted',
    submittedAt: new Date(),
    isEvaluated: false,
  });

  // Update task status to submitted
  task.status = 'submitted';
  await task.save();

  const populatedSubmission = await Submission.findById(submission._id)
    .populate('task', 'title taskType deadline maxPoints')
    .populate('intern', 'name email role');

  // Trigger automated submission email notification to admin asynchronously
  sendTaskSubmissionEmail({
    intern: req.user,
    task,
    submission: populatedSubmission,
  }).catch((err) => {
    console.error(`[SubmissionController] Email dispatch failed: ${err.message}`);
  });

  return res.status(201).json(
    new ApiResponse(201, populatedSubmission, 'Task submitted successfully')
  );
});

/**
 * Get all submissions (Admin only)
 * GET /api/submissions
 */
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const { status, intern, task } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (intern && mongoose.Types.ObjectId.isValid(intern)) filter.intern = intern;
  if (task && mongoose.Types.ObjectId.isValid(task)) filter.task = task;

  // Retrieve admin-specific hidden history preferences
  const preference = await AdminHistory.findOne({ admin: req.user._id });
  if (preference) {
    const hiddenIds = preference.hiddenSubmissions || [];
    const clearedAt = preference.historyClearedAt;

    const exclusions = [];
    if (hiddenIds.length > 0) {
      exclusions.push({ _id: { $in: hiddenIds } });
    }
    if (clearedAt) {
      exclusions.push({
        isEvaluated: true,
        reviewedAt: { $lte: clearedAt },
      });
    }

    if (exclusions.length > 0) {
      filter.$nor = exclusions;
    }
  }

  const submissions = await Submission.find(filter)
    .populate('task', 'title taskType maxPoints deadline status')
    .populate('intern', 'name email role')
    .populate('reviewedBy', 'name email')
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, 'Submissions retrieved successfully')
  );
});

/**
 * Get current intern's submissions
 * GET /api/submissions/my-submissions
 */
export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ intern: req.user._id })
    .populate('task', 'title description taskType maxPoints deadline status')
    .populate('reviewedBy', 'name email')
    .sort({ submittedAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, submissions, 'My submissions retrieved successfully')
  );
});

/**
 * Get intern's earned points and score breakdown
 * GET /api/submissions/my-points
 */
export const getMyPoints = asyncHandler(async (req, res) => {
  const internId = req.user._id;

  const approvedSubmissions = await Submission.find({
    intern: internId,
    status: 'approved',
  })
    .populate('task', 'title maxPoints taskType')
    .sort({ reviewedAt: -1 });

  const totalPoints = approvedSubmissions.reduce(
    (sum, sub) => sum + (sub.pointsAwarded || 0),
    0
  );

  const totalSubmittedCount = await Submission.countDocuments({ intern: internId });

  const pointBreakdown = approvedSubmissions.map((sub) => ({
    submissionId: sub._id,
    taskTitle: sub.task ? sub.task.title : 'Deleted Task',
    taskType: sub.task ? sub.task.taskType : 'N/A',
    maxPoints: sub.task ? sub.task.maxPoints : 0,
    pointsAwarded: sub.pointsAwarded,
    reviewedAt: sub.reviewedAt,
    feedback: sub.feedback,
  }));

  const data = {
    intern: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
    totalPoints,
    approvedSubmissionsCount: approvedSubmissions.length,
    totalSubmissionsCount: totalSubmittedCount,
    breakdown: pointBreakdown,
  };

  return res.status(200).json(
    new ApiResponse(200, data, 'Points calculated and retrieved successfully')
  );
});

/**
 * Review a submission (Approve or Reject, assign points & feedback) (Admin only)
 * PATCH /api/submissions/:id/review
 */
export const reviewSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid submission ID format');
  }

  const submission = await Submission.findById(id).populate('task');
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  const { status, pointsAwarded, feedback } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, "Review status must be either 'approved' or 'rejected'");
  }

  // Security: Prevent duplicate point awards if already approved
  if (submission.status === 'approved' && submission.isEvaluated) {
    throw new ApiError(400, 'This submission has already been approved and evaluated. Duplicate point awards are forbidden.');
  }

  const task = await Task.findById(submission.task._id || submission.task);
  if (!task) {
    throw new ApiError(404, 'Associated task not found');
  }

  let finalPoints = 0;

  if (status === 'approved') {
    if (pointsAwarded === undefined || pointsAwarded === null) {
      throw new ApiError(400, 'pointsAwarded is required when approving a submission');
    }

    const points = Number(pointsAwarded);
    if (isNaN(points) || points < 0) {
      throw new ApiError(400, 'pointsAwarded must be a non-negative number');
    }

    // Security: Validate awarded points against task maxPoints
    if (points > task.maxPoints) {
      throw new ApiError(
        400,
        `Awarded points (${points}) cannot exceed the task maximum points limit (${task.maxPoints})`
      );
    }

    finalPoints = points;
  }

  // Atomic update guard to prevent double-point awards under race conditions
  const filter = { _id: id };
  if (status === 'approved') {
    filter.status = { $ne: 'approved' };
  }

  const updatedSubmission = await Submission.findOneAndUpdate(
    filter,
    {
      pointsAwarded: finalPoints,
      status,
      feedback: feedback ? feedback.trim() : '',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      isEvaluated: true,
    },
    { new: true }
  );

  if (!updatedSubmission) {
    throw new ApiError(
      400,
      'This submission has already been approved and evaluated. Duplicate point awards are forbidden.'
    );
  }

  // Update task status accordingly
  task.status = status === 'approved' ? 'completed' : 'pending';
  await task.save();

  const evaluatedSubmission = await Submission.findById(updatedSubmission._id)
    .populate('task', 'title maxPoints status')
    .populate('intern', 'name email role')
    .populate('reviewedBy', 'name email');

  // Trigger automated evaluation decision email notification to intern asynchronously
  sendTaskEvaluationEmail({
    intern: evaluatedSubmission.intern,
    task: evaluatedSubmission.task,
    submission: evaluatedSubmission,
  }).catch((err) => {
    console.error(`[SubmissionController] Email dispatch failed: ${err.message}`);
  });

  return res.status(200).json(
    new ApiResponse(200, evaluatedSubmission, `Submission has been ${status} successfully`)
  );
});

/**
 * Hide an individual history record from the requesting admin's view
 * DELETE /api/submissions/history/:id
 */
export const hideSubmissionHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid submission ID format');
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    throw new ApiError(404, 'Submission record not found');
  }

  await AdminHistory.findOneAndUpdate(
    { admin: req.user._id },
    { $addToSet: { hiddenSubmissions: submission._id } },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, { submissionId: id }, 'History record removed from your view successfully')
  );
});

/**
 * Clear all evaluation history records for the requesting admin
 * DELETE /api/submissions/history
 */
export const clearAllSubmissionHistory = asyncHandler(async (req, res) => {
  // Find all currently evaluated submissions to add to exclusion set
  const evaluatedSubmissions = await Submission.find({ isEvaluated: true }).select('_id');
  const evaluatedIds = evaluatedSubmissions.map((s) => s._id);

  await AdminHistory.findOneAndUpdate(
    { admin: req.user._id },
    {
      $addToSet: { hiddenSubmissions: { $each: evaluatedIds } },
      historyClearedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { clearedCount: evaluatedIds.length },
      'All evaluation history removed from your view successfully'
    )
  );
});

