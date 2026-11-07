import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Task } from '../src/models/task.model.js';
import { Submission } from '../src/models/submission.model.js';
import {
  sendTaskAssignmentEmail,
  sendTaskSubmissionEmail,
  sendTaskEvaluationEmail,
} from '../src/services/email.service.js';

dotenv.config();

let server;
let baseUrl;

let adminUser, internAlice, internBob;
let adminToken, internAliceToken, internBobToken;
let testTask, testSubmission;

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

  adminUser = await User.create({
    name: 'Security Admin',
    email: `sec_admin_${timestamp}@example.com`,
    password: 'AdminPassword123!',
    role: 'admin',
  });
  adminToken = adminUser.generateAuthToken();

  internAlice = await User.create({
    name: 'Security Alice',
    email: `sec_alice_${timestamp}@example.com`,
    password: 'Password123!',
    role: 'intern',
  });
  internAliceToken = internAlice.generateAuthToken();

  internBob = await User.create({
    name: 'Security Bob',
    email: `sec_bob_${timestamp}@example.com`,
    password: 'Password123!',
    role: 'intern',
  });
  internBobToken = internBob.generateAuthToken();

  // Create a base task assigned to Alice
  testTask = await Task.create({
    title: 'Security Hardening Task',
    description: 'Verify system boundaries and permissions',
    taskType: 'daily',
    assignedTo: internAlice._id,
    assignedBy: adminUser._id,
    deadline: new Date(Date.now() + 86400000),
    maxPoints: 100,
    status: 'pending',
  });
});

after(async () => {
  await User.deleteMany({
    _id: { $in: [adminUser._id, internAlice._id, internBob._id] },
  });
  await Task.deleteMany({
    _id: testTask._id,
  });
  if (testSubmission) {
    await Submission.deleteMany({ _id: testSubmission._id });
  }
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('Phase 7 Comprehensive Security Hardening & QA Test Suite', () => {
  // ==========================================
  // 1. AUTHENTICATION SECURITY
  // ==========================================
  describe('Authentication Security', () => {
    test('1.1. Missing token returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.2. Malformed / invalid token signature returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer invalid.token.signature' },
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.3. Expired token is detected and rejected with 401 Unauthorized', async () => {
      const expiredToken = jwt.sign(
        { id: internAlice._id, role: 'intern' },
        process.env.JWT_SECRET || 'test_jwt_secret',
        { expiresIn: '-10s' }
      );

      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('expired') || data.message.toLowerCase().includes('token'));
    });

    test('1.4. Wrong password returns 401 Unauthorized without leaking account existence detail', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: internAlice.email,
          password: 'IncorrectPassword999!',
        }),
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.message, 'Invalid email or password');
    });

    test('1.5. Duplicate registration returns 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Alice',
          email: internAlice.email,
          password: 'Password123!',
        }),
      });
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('1.6. Security headers (Helmet) are present on API responses', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    });
  });

  // ==========================================
  // 2. ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  describe('Role-Based Access Control (RBAC)', () => {
    test('2.1. Intern accessing admin-only endpoint (GET /api/tasks) returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/tasks`, {
        headers: { Authorization: `Bearer ${internAliceToken}` },
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('2.2. Intern attempting to create tasks (POST /api/tasks) returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internAliceToken}`,
        },
        body: JSON.stringify({
          title: 'Illicit Task',
          description: 'Intern cannot create tasks',
          taskType: 'daily',
          assignedTo: internAlice._id,
          deadline: new Date(Date.now() + 86400000).toISOString(),
          maxPoints: 50,
        }),
      });
      assert.equal(res.status, 403);
    });

    test('2.3. Intern attempting to update tasks (PATCH /api/tasks/:id) returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/tasks/${testTask._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internAliceToken}`,
        },
        body: JSON.stringify({ title: 'Tampered Title' }),
      });
      assert.equal(res.status, 403);
    });

    test('2.4. Intern attempting to delete tasks (DELETE /api/tasks/:id) returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/tasks/${testTask._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${internAliceToken}` },
      });
      assert.equal(res.status, 403);
    });

    test('2.5. Intern Bob submitting work for Intern Alice task is rejected with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internBobToken}`,
        },
        body: JSON.stringify({
          taskId: testTask._id,
          githubUrl: 'https://github.com/hackkro-bob/task-solution',
          submissionNotes: 'Trying to submit for Alice',
        }),
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('not authorized'));
    });

    test('2.6. Intern attempting to evaluate a submission returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/submissions/${testTask._id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internAliceToken}`,
        },
        body: JSON.stringify({ status: 'approved', pointsAwarded: 100 }),
      });
      assert.equal(res.status, 403);
    });
  });

  // ==========================================
  // 3. INPUT VALIDATION & INTEGRITY
  // ==========================================
  describe('Input Validation & Integrity', () => {
    test('3.1. Invalid task ID format returns 400 Bad Request (handled CastError)', async () => {
      const res = await fetch(`${baseUrl}/tasks/non-existent-or-invalid-mongo-id`, {
        headers: { Authorization: `Bearer ${internAliceToken}` },
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes('Invalid'));
    });

    test('3.2. Invalid deadline format during task creation returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Bad Deadline Task',
          description: 'Testing date parsing',
          taskType: 'weekly',
          assignedTo: internAlice._id,
          deadline: 'invalid-not-a-date',
          maxPoints: 80,
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('deadline'));
    });

    test('3.3. Invalid GitHub URL format during submission returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internAliceToken}`,
        },
        body: JSON.stringify({
          taskId: testTask._id,
          githubUrl: 'javascript:alert(1)', // Malicious URL injection attempt
          submissionNotes: 'Testing invalid URL',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('github'));
    });

    test('3.4. Duplicate submission while review is pending is rejected with 400 Bad Request', async () => {
      // Alice creates valid submission
      const subRes = await fetch(`${baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internAliceToken}`,
        },
        body: JSON.stringify({
          taskId: testTask._id,
          githubUrl: 'https://github.com/alice/valid-solution',
          submissionNotes: 'Initial valid submission',
        }),
      });
      assert.equal(subRes.status, 201);
      const subData = await subRes.json();
      testSubmission = subData.data;

      // Alice tries to submit again before admin reviews
      const dupRes = await fetch(`${baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internAliceToken}`,
        },
        body: JSON.stringify({
          taskId: testTask._id,
          githubUrl: 'https://github.com/alice/valid-solution-2',
          submissionNotes: 'Duplicate attempt',
        }),
      });
      assert.equal(dupRes.status, 400);
      const dupData = await dupRes.json();
      assert.equal(dupData.success, false);
      assert.ok(dupData.message.toLowerCase().includes('review'));
    });
  });

  // ==========================================
  // 4. POINT EVALUATION & INTEGRITY CONTROLS
  // ==========================================
  describe('Point Evaluation & Integrity Controls', () => {
    test('4.1. Awarding points exceeding task maxPoints returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/submissions/${testSubmission._id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'approved',
          pointsAwarded: 9999, // Exceeds maxPoints (100)
          feedback: 'Too generous',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes('cannot exceed'));
    });

    test('4.2. Awarding negative points returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/submissions/${testSubmission._id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'approved',
          pointsAwarded: -25,
          feedback: 'Negative points',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.toLowerCase().includes('non-negative'));
    });

    test('4.3. Admin successfully reviews and approves with valid points (85/100)', async () => {
      const res = await fetch(`${baseUrl}/submissions/${testSubmission._id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'approved',
          pointsAwarded: 85,
          feedback: 'Great quality implementation',
        }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.data.pointsAwarded, 85);
      assert.equal(data.data.status, 'approved');
      assert.equal(data.data.isEvaluated, true);
    });

    test('4.4. Duplicate point awards on already approved submission is strictly rejected (400)', async () => {
      const res = await fetch(`${baseUrl}/submissions/${testSubmission._id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'approved',
          pointsAwarded: 100,
          feedback: 'Trying to add more points',
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.message.includes('already been approved') || data.message.includes('forbidden'));
    });
  });

  // ==========================================
  // 5. EMAIL RESILIENCE & FAILURE RECOVERY
  // ==========================================
  describe('Email Resilience & Failure Recovery', () => {
    test('5.1. Missing email fields or invalid recipient gracefully handled without throwing', async () => {
      // Trigger assignment email with invalid recipient
      const result1 = await sendTaskAssignmentEmail({
        intern: { name: 'Faulty Intern', email: 'not-an-email' },
        task: testTask,
      });
      assert.equal(result1.success, false);
      assert.equal(result1.reason, 'INVALID_RECIPIENT');

      // Trigger submission email with null task
      const result2 = await sendTaskSubmissionEmail({
        intern: internAlice,
        task: null,
        submission: testSubmission,
      });
      assert.equal(result2.success, false);

      // Trigger evaluation email with missing intern email
      const result3 = await sendTaskEvaluationEmail({
        intern: { name: 'No Email User' },
        task: testTask,
        submission: testSubmission,
      });
      assert.equal(result3.success, false);
    });
  });
});
