import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Task } from '../src/models/task.model.js';
import { Submission } from '../src/models/submission.model.js';
import { AdminHistory } from '../src/models/adminHistory.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let server;
let baseUrl;

let adminA, adminB, internUser;
let adminAToken, adminBToken, internToken;
let task1, task2, pendingTask;
let submission1, submission2, pendingSubmission;

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackkro_internship');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  const timestamp = Date.now();

  // Create Admin A
  adminA = await User.create({
    name: 'Admin Alpha',
    email: `history_admin_a_${timestamp}@example.com`,
    password: 'AdminPassword123!',
    role: 'admin',
  });
  adminAToken = adminA.generateAuthToken();

  // Create Admin B
  adminB = await User.create({
    name: 'Admin Beta',
    email: `history_admin_b_${timestamp}@example.com`,
    password: 'AdminPassword123!',
    role: 'admin',
  });
  adminBToken = adminB.generateAuthToken();

  // Create Intern
  internUser = await User.create({
    name: 'History Intern',
    email: `history_intern_${timestamp}@example.com`,
    password: 'InternPassword123!',
    role: 'intern',
  });
  internToken = internUser.generateAuthToken();

  // Create Tasks
  task1 = await Task.create({
    title: 'History Test Task 1',
    description: 'First task for history testing',
    taskType: 'daily',
    assignedTo: internUser._id,
    assignedBy: adminA._id,
    deadline: new Date(Date.now() + 86400000),
    maxPoints: 100,
    status: 'completed',
  });

  task2 = await Task.create({
    title: 'History Test Task 2',
    description: 'Second task for history testing',
    taskType: 'weekly',
    assignedTo: internUser._id,
    assignedBy: adminA._id,
    deadline: new Date(Date.now() + 86400000),
    maxPoints: 100,
    status: 'completed',
  });

  pendingTask = await Task.create({
    title: 'History Test Pending Task',
    description: 'Pending task for history testing',
    taskType: 'daily',
    assignedTo: internUser._id,
    assignedBy: adminA._id,
    deadline: new Date(Date.now() + 86400000),
    maxPoints: 100,
    status: 'submitted',
  });

  // Create Submissions
  submission1 = await Submission.create({
    task: task1._id,
    intern: internUser._id,
    githubUrl: 'https://github.com/hackkro/history-test-1',
    submissionNotes: 'Submission 1 completed',
    status: 'approved',
    pointsAwarded: 90,
    feedback: 'Approved by admin',
    isEvaluated: true,
    reviewedBy: adminA._id,
    reviewedAt: new Date(Date.now() - 5000),
  });

  submission2 = await Submission.create({
    task: task2._id,
    intern: internUser._id,
    githubUrl: 'https://github.com/hackkro/history-test-2',
    submissionNotes: 'Submission 2 completed',
    status: 'approved',
    pointsAwarded: 85,
    feedback: 'Well done',
    isEvaluated: true,
    reviewedBy: adminA._id,
    reviewedAt: new Date(Date.now() - 3000),
  });

  pendingSubmission = await Submission.create({
    task: pendingTask._id,
    intern: internUser._id,
    githubUrl: 'https://github.com/hackkro/history-pending',
    submissionNotes: 'Pending review',
    status: 'submitted',
    pointsAwarded: 0,
    isEvaluated: false,
  });
});

after(async () => {
  // Clean up test data
  if (adminA && adminB && internUser) {
    await User.deleteMany({ _id: { $in: [adminA._id, adminB._id, internUser._id] } });
    await Task.deleteMany({ _id: { $in: [task1._id, task2._id, pendingTask._id] } });
    await Submission.deleteMany({ _id: { $in: [submission1._id, submission2._id, pendingSubmission._id] } });
    await AdminHistory.deleteMany({ admin: { $in: [adminA._id, adminB._id] } });
  }
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('Admin-Only History Removal & View Isolation Tests', () => {
  // 1. Authentication & Authorization Enforcement
  describe('1. Authentication and RBAC Verification', () => {
    test('1.1. Unauthenticated DELETE /api/submissions/history/:id returns 401', async () => {
      const res = await fetch(`${baseUrl}/submissions/history/${submission1._id}`, {
        method: 'DELETE',
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.2. Unauthenticated DELETE /api/submissions/history returns 401', async () => {
      const res = await fetch(`${baseUrl}/submissions/history`, {
        method: 'DELETE',
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.3. Intern calling DELETE /api/submissions/history/:id returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/submissions/history/${submission1._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('forbidden') || data.message.toLowerCase().includes('authorized'));
    });

    test('1.4. Intern calling DELETE /api/submissions/history returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/submissions/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.5. Invalid submission ID returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/submissions/history/invalid-object-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminAToken}` },
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.6. Non-existent submission ID returns 404 Not Found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await fetch(`${baseUrl}/submissions/history/${fakeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminAToken}` },
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  // 2. Single Item Removal & Admin View Isolation
  describe('2. Single Item History Removal & Admin Isolation', () => {
    test('2.1. Admin A hides submission1 from their history view', async () => {
      const res = await fetch(`${baseUrl}/submissions/history/${submission1._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminAToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.message.includes('removed from your view'));
    });

    test('2.2. Admin A no longer sees submission1 in GET /api/submissions', async () => {
      const res = await fetch(`${baseUrl}/submissions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminAToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const returnedIds = data.data.map((s) => s._id.toString());
      assert.ok(!returnedIds.includes(submission1._id.toString()), 'Submission 1 must be hidden for Admin A');
      assert.ok(returnedIds.includes(submission2._id.toString()), 'Submission 2 must still be visible to Admin A');
      assert.ok(returnedIds.includes(pendingSubmission._id.toString()), 'Pending submission must be visible');
    });

    test('2.3. Admin B STILL sees submission1 in GET /api/submissions (admin isolation)', async () => {
      const res = await fetch(`${baseUrl}/submissions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminBToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const returnedIds = data.data.map((s) => s._id.toString());
      assert.ok(returnedIds.includes(submission1._id.toString()), 'Submission 1 MUST remain visible to Admin B');
      assert.ok(returnedIds.includes(submission2._id.toString()), 'Submission 2 MUST remain visible to Admin B');
    });

    test('2.4. Intern STILL sees submission1 in GET /api/submissions/my-submissions', async () => {
      const res = await fetch(`${baseUrl}/submissions/my-submissions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const returnedIds = data.data.map((s) => s._id.toString());
      assert.ok(returnedIds.includes(submission1._id.toString()), 'Intern MUST retain full submission history');
      assert.ok(returnedIds.includes(submission2._id.toString()), 'Intern MUST retain submission 2');
    });

    test('2.5. Intern points and breakdown remain completely intact in GET /api/submissions/my-points', async () => {
      const res = await fetch(`${baseUrl}/submissions/my-points`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      // Total points from submission1 (90) + submission2 (85) = 175
      assert.equal(data.data.totalPoints, 175);
      assert.equal(data.data.approvedSubmissionsCount, 2);
    });
  });

  // 3. Clear All History & Integrity
  describe('3. Clear All History & Verification', () => {
    test('3.1. Admin A clears all history via DELETE /api/submissions/history', async () => {
      const res = await fetch(`${baseUrl}/submissions/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminAToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.message.includes('removed from your view'));
    });

    test('3.2. Admin A now sees zero evaluated submissions, but pending submissions remain in queue', async () => {
      const res = await fetch(`${baseUrl}/submissions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminAToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const returnedIds = data.data.map((s) => s._id.toString());
      assert.ok(!returnedIds.includes(submission1._id.toString()), 'Submission 1 must be hidden');
      assert.ok(!returnedIds.includes(submission2._id.toString()), 'Submission 2 must be hidden');
      assert.ok(returnedIds.includes(pendingSubmission._id.toString()), 'Pending submission must NEVER be hidden by clear history');
    });

    test('3.3. Admin B is completely unaffected by Admin A clear-all', async () => {
      const res = await fetch(`${baseUrl}/submissions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminBToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);

      const returnedIds = data.data.map((s) => s._id.toString());
      assert.ok(returnedIds.includes(submission1._id.toString()), 'Submission 1 still visible to Admin B');
      assert.ok(returnedIds.includes(submission2._id.toString()), 'Submission 2 still visible to Admin B');
      assert.ok(returnedIds.includes(pendingSubmission._id.toString()), 'Pending submission visible to Admin B');
    });

    test('3.4. Intern history and points remain 100% intact after Admin A clear-all', async () => {
      const resSubs = await fetch(`${baseUrl}/submissions/my-submissions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      const dataSubs = await resSubs.json();
      assert.equal(resSubs.status, 200);
      const internSubmissionIds = dataSubs.data.map((s) => s._id.toString());
      assert.ok(internSubmissionIds.includes(submission1._id.toString()));
      assert.ok(internSubmissionIds.includes(submission2._id.toString()));

      const resPoints = await fetch(`${baseUrl}/submissions/my-points`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${internToken}` },
      });
      const dataPoints = await resPoints.json();
      assert.equal(resPoints.status, 200);
      assert.equal(dataPoints.data.totalPoints, 175);
      assert.equal(dataPoints.data.approvedSubmissionsCount, 2);
    });

    test('3.5. MongoDB database documents still exist and are never physically deleted', async () => {
      const doc1 = await Submission.findById(submission1._id);
      const doc2 = await Submission.findById(submission2._id);
      assert.ok(doc1 !== null, 'Submission 1 must exist in database');
      assert.ok(doc2 !== null, 'Submission 2 must exist in database');
      assert.equal(doc1.pointsAwarded, 90);
      assert.equal(doc2.pointsAwarded, 85);
    });
  });
});
