import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Task } from '../src/models/task.model.js';
import { Submission } from '../src/models/submission.model.js';

dotenv.config();

let server;
let baseUrl;

let adminUser, internA, internB;
let adminToken, internAToken, internBToken;
let createdTaskId;
let createdSubmissionId;

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

  // Create admin user
  adminUser = await User.create({
    name: 'Task Admin',
    email: `task_admin_${timestamp}@example.com`,
    password: 'AdminPassword123!',
    role: 'admin',
  });
  adminToken = adminUser.generateAuthToken();

  // Create Intern A
  internA = await User.create({
    name: 'Intern Alice',
    email: `intern_a_${timestamp}@example.com`,
    password: 'InternPassword123!',
    role: 'intern',
  });
  internAToken = internA.generateAuthToken();

  // Create Intern B
  internB = await User.create({
    name: 'Intern Bob',
    email: `intern_b_${timestamp}@example.com`,
    password: 'InternPassword123!',
    role: 'intern',
  });
  internBToken = internB.generateAuthToken();
});

after(async () => {
  if (adminUser) await User.deleteOne({ _id: adminUser._id });
  if (internA) await User.deleteOne({ _id: internA._id });
  if (internB) await User.deleteOne({ _id: internB._id });

  if (createdTaskId) await Task.deleteMany({ _id: createdTaskId });
  await Submission.deleteMany({ intern: { $in: [internA?._id, internB?._id] } });

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('Phase 3 Task Management & Evaluation Integration Tests', () => {
  test('1. Admin task creation (POST /api/tasks)', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Build REST Authentication API',
        description: 'Implement JWT authentication and password hashing',
        taskType: 'daily',
        assignedTo: internA._id.toString(),
        deadline: new Date(Date.now() + 86400000).toISOString(),
        maxPoints: 100,
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.title, 'Build REST Authentication API');
    assert.equal(body.data.assignedTo._id, internA._id.toString());
    assert.equal(body.data.maxPoints, 100);
    assert.equal(body.data.status, 'pending');

    createdTaskId = body.data._id;
  });

  test('2. Unauthorized task creation (Intern attempting POST /api/tasks is rejected with 403)', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internAToken}`,
      },
      body: JSON.stringify({
        title: 'Hacked Task',
        description: 'Intern trying to assign task',
        taskType: 'daily',
        assignedTo: internB._id.toString(),
        deadline: new Date().toISOString(),
        maxPoints: 50,
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.success, false);
    assert.match(body.message, /not authorized/i);
  });

  test('3. Intern task access & assignment verification (GET /api/tasks/my-tasks)', async () => {
    const res = await fetch(`${baseUrl}/tasks/my-tasks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${internAToken}` },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0]._id, createdTaskId);
    assert.equal(body.data[0].title, 'Build REST Authentication API');
  });

  test('4. Submission ownership protection (Intern B cannot submit for Intern A task)', async () => {
    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internBToken}`,
      },
      body: JSON.stringify({
        taskId: createdTaskId,
        githubUrl: 'https://github.com/internb/unauthorized-repo',
        submissionNotes: 'Trying to submit someone elses task',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.success, false);
    assert.match(body.message, /not authorized/i);
  });

  test('5. Valid submission creation by assigned intern (POST /api/submissions)', async () => {
    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internAToken}`,
      },
      body: JSON.stringify({
        taskId: createdTaskId,
        githubUrl: 'https://github.com/hackkro/intern-alice-auth-api',
        submissionNotes: 'All unit tests passing, clean modular architecture implemented.',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'submitted');
    assert.equal(body.data.intern._id, internA._id.toString());
    assert.equal(body.data.pointsAwarded, 0);

    createdSubmissionId = body.data._id;

    // Verify task status updated to submitted
    const taskRes = await fetch(`${baseUrl}/tasks/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const taskBody = await taskRes.json();
    assert.equal(taskBody.data.status, 'submitted');
  });

  test('6. Duplicate submission rejection while review is pending (POST /api/submissions)', async () => {
    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internAToken}`,
      },
      body: JSON.stringify({
        taskId: createdTaskId,
        githubUrl: 'https://github.com/hackkro/intern-alice-auth-api/pull/2',
        submissionNotes: 'Resubmitting while first is still pending',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /already awaiting review/i);
  });

  test('7. Validation prevents awarding points exceeding task maxPoints', async () => {
    const res = await fetch(`${baseUrl}/submissions/${createdSubmissionId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'approved',
        pointsAwarded: 150, // maxPoints is 100!
        feedback: 'Excessive points test',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /cannot exceed the task maximum points limit/i);
  });

  test('8. Admin review and approval with point allocation (PATCH /api/submissions/:id/review)', async () => {
    const res = await fetch(`${baseUrl}/submissions/${createdSubmissionId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'approved',
        pointsAwarded: 95,
        feedback: 'Excellent clean architecture and robust error handling.',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'approved');
    assert.equal(body.data.pointsAwarded, 95);
    assert.equal(body.data.feedback, 'Excellent clean architecture and robust error handling.');
    assert.equal(body.data.task.status, 'completed');
  });

  test('9. Duplicate point prevention (Attempting to re-evaluate approved submission is rejected)', async () => {
    const res = await fetch(`${baseUrl}/submissions/${createdSubmissionId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'approved',
        pointsAwarded: 95,
        feedback: 'Trying to award points twice',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /duplicate point awards are forbidden/i);
  });

  test('10. Point calculation accuracy (GET /api/submissions/my-points)', async () => {
    const res = await fetch(`${baseUrl}/submissions/my-points`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${internAToken}` },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.totalPoints, 95);
    assert.equal(body.data.approvedSubmissionsCount, 1);
    assert.equal(body.data.totalSubmissionsCount, 1);
    assert.equal(body.data.breakdown.length, 1);
    assert.equal(body.data.breakdown[0].pointsAwarded, 95);
    assert.equal(body.data.breakdown[0].maxPoints, 100);
  });

  test('11. Intern submission history retrieval (GET /api/submissions/my-submissions)', async () => {
    const res = await fetch(`${baseUrl}/submissions/my-submissions`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${internAToken}` },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0]._id, createdSubmissionId);
    assert.equal(body.data[0].status, 'approved');
    assert.equal(body.data[0].pointsAwarded, 95);
  });
});
