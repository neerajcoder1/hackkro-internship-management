import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Task } from '../src/models/task.model.js';
import { Submission } from '../src/models/submission.model.js';
import {
  sendTaskAssignmentEmail,
  sendTaskSubmissionEmail,
  sendTaskEvaluationEmail,
  __emailTestHelpers,
} from '../src/services/email.service.js';

dotenv.config();

let server;
let baseUrl;

let adminUser, internUser;
let adminToken, internToken;

before(async () => {
  __emailTestHelpers.setMockMode(true);

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
    name: 'Email Test Admin',
    email: `email_admin_${timestamp}@hackkro.com`,
    password: 'AdminPassword123!',
    role: 'admin',
  });
  adminToken = adminUser.generateAuthToken();

  internUser = await User.create({
    name: 'Email Test Intern',
    email: `email_intern_${timestamp}@example.com`,
    password: 'InternPassword123!',
    role: 'intern',
  });
  internToken = internUser.generateAuthToken();
});

after(async () => {
  if (adminUser) await User.deleteOne({ _id: adminUser._id });
  if (internUser) await User.deleteOne({ _id: internUser._id });
  await Task.deleteMany({ assignedBy: adminUser?._id });
  await Submission.deleteMany({ intern: internUser?._id });

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

beforeEach(() => {
  __emailTestHelpers.clearMockSentEmails();
});

describe('Phase 5 Automated Email Notification Workflows', () => {
  let createdTaskId;
  let createdSubmissionId;

  test('1. Task Assignment Email Workflow: Admin creates task triggers intern email', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Build Notification Pipeline',
        description: 'Integrate Resend automated email delivery',
        taskType: 'weekly',
        assignedTo: internUser._id.toString(),
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        maxPoints: 100,
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    createdTaskId = body.data._id;

    // Small delay to allow asynchronous email dispatch
    await new Promise((r) => setTimeout(r, 100));

    const sentEmails = __emailTestHelpers.getMockSentEmails();
    assert.equal(sentEmails.length, 1);

    const email = sentEmails[0];
    assert.equal(email.to, internUser.email);
    assert.match(email.subject, /New Task Assigned: Build Notification Pipeline/);
    assert.match(email.html, /Build Notification Pipeline/);
    assert.match(email.html, /100 Points/);
    assert.match(email.html, /weekly/i);
    assert.match(email.html, /\/intern/);
  });

  test('2. Task Submission Email Workflow: Intern submits solution triggers admin notification', async () => {
    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internToken}`,
      },
      body: JSON.stringify({
        taskId: createdTaskId,
        githubUrl: 'https://github.com/intern/email-notification-pipeline',
        submissionNotes: 'Resend email templates fully implemented and tested.',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    createdSubmissionId = body.data._id;

    await new Promise((r) => setTimeout(r, 100));

    const sentEmails = __emailTestHelpers.getMockSentEmails();
    assert.equal(sentEmails.length, 1);

    const email = sentEmails[0];
    const expectedAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@hackkro.com';
    assert.equal(email.to, expectedAdminEmail);
    assert.match(email.subject, /New Submission: Build Notification Pipeline/);
    assert.match(email.html, /email-notification-pipeline/);
    assert.match(email.html, /Resend email templates fully implemented/);
    assert.match(email.html, /\/admin/);
  });

  test('3. Task Evaluation Email Workflow: Admin review decision triggers intern notification', async () => {
    const res = await fetch(`${baseUrl}/submissions/${createdSubmissionId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'approved',
        pointsAwarded: 100,
        feedback: 'Outstanding implementation of automated email services!',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);

    await new Promise((r) => setTimeout(r, 100));

    const sentEmails = __emailTestHelpers.getMockSentEmails();
    assert.equal(sentEmails.length, 1);

    const email = sentEmails[0];
    assert.equal(email.to, internUser.email);
    assert.match(email.subject, /Task Approved: Build Notification Pipeline/);
    assert.match(email.html, /APPROVED/);
    assert.match(email.html, /100 \/ 100 Points/);
    assert.match(email.html, /Outstanding implementation of automated email services/);
    assert.match(email.html, /\/intern/);
  });

  test('4. Duplicate Notification Prevention: Resending same notification key is skipped', async () => {
    const dummyTask = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Deduplication Test',
      taskType: 'daily',
      maxPoints: 50,
      deadline: new Date(),
    };

    // First call sends
    const res1 = await sendTaskAssignmentEmail({ intern: internUser, task: dummyTask });
    assert.equal(res1.success, true);

    // Second call with identical task ID & intern ID is rejected as duplicate
    const res2 = await sendTaskAssignmentEmail({ intern: internUser, task: dummyTask });
    assert.equal(res2.success, false);
    assert.equal(res2.reason, 'DUPLICATE_NOTIFICATION');

    const sent = __emailTestHelpers.getMockSentEmails();
    assert.equal(sent.length, 1, 'Only 1 email should have been recorded');
  });

  test('5. Resilience & Failure Handling: Invalid email or missing parameters do not throw', async () => {
    const invalidIntern = { name: 'Bad Email', email: 'invalid-email-address' };
    const dummyTask = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Fault Tolerant Task',
      taskType: 'daily',
      maxPoints: 50,
      deadline: new Date(),
    };

    const result = await sendTaskAssignmentEmail({ intern: invalidIntern, task: dummyTask });
    assert.equal(result.success, false);
    assert.equal(result.reason, 'INVALID_RECIPIENT');

    // Missing parameters
    const emptyResult = await sendTaskAssignmentEmail({ intern: null, task: null });
    assert.equal(emptyResult.success, false);
  });
});
