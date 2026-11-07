import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';

dotenv.config();

let server;
let baseUrl;

const testIntern = {
  name: 'Test Intern',
  email: `intern_${Date.now()}@example.com`,
  password: 'Password123!',
};

const testAdmin = {
  name: 'Test Admin',
  email: `admin_${Date.now()}@example.com`,
  password: 'AdminPassword123!',
};

let internToken = '';
let adminToken = '';

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackkro_internship');

  // Start server on an ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/auth`;
      resolve();
    });
  });
});

after(async () => {
  // Cleanup test users created during run
  await User.deleteMany({
    email: { $in: [testIntern.email, testAdmin.email, 'duplicate_test@example.com'] },
  });
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('Phase 2 Authentication and Role-Based Authorization Tests', () => {
  test('1. Successful intern registration', async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testIntern),
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testIntern.email);
    assert.equal(body.data.user.role, 'intern');
    assert.equal(body.data.user.password, undefined); // Ensure password hash is not exposed
    assert.ok(body.data.token, 'Token must be returned');

    internToken = body.data.token;
  });

  test('2. Duplicate email rejection', async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testIntern),
    });

    const body = await res.json();
    assert.equal(res.status, 409);
    assert.equal(body.success, false);
    assert.match(body.message, /already exists/i);
  });

  test('3. Successful login', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testIntern.email,
        password: testIntern.password,
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testIntern.email);
    assert.equal(body.data.user.password, undefined);
    assert.ok(body.data.token);

    internToken = body.data.token; // Refresh token
  });

  test('4. Incorrect password rejection', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testIntern.email,
        password: 'WrongPassword999!',
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /invalid email or password/i);
  });

  test('5. Missing token rejection on protected route', async () => {
    const res = await fetch(`${baseUrl}/me`, {
      method: 'GET',
    });

    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /token missing/i);
  });

  test('6. Invalid token rejection on protected route', async () => {
    const res = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token.payload' },
    });

    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /invalid authentication token/i);
  });

  test('7. GET /api/auth/me retrieves authenticated user', async () => {
    const res = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${internToken}` },
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, testIntern.email);
    assert.equal(body.data.user.role, 'intern');
    assert.equal(body.data.user.password, undefined);
  });

  test('8. Intern attempting admin access is rejected (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/admin-only`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${internToken}` },
    });

    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.success, false);
    assert.match(body.message, /not authorized/i);
  });

  test('9. Admin registration via private key and accessing authorized admin route (200 OK)', async () => {
    // 9a: Register admin using private admin creation key
    const adminRegRes = await fetch(`${baseUrl}/register-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': process.env.ADMIN_CREATION_KEY || 'hackkro_super_secret_admin_key_2026',
      },
      body: JSON.stringify(testAdmin),
    });

    const adminRegBody = await adminRegRes.json();
    assert.equal(adminRegRes.status, 201);
    assert.equal(adminRegBody.data.user.role, 'admin');
    assert.ok(adminRegBody.data.token);

    adminToken = adminRegBody.data.token;

    // 9b: Admin accesses protected admin route
    const adminAccessRes = await fetch(`${baseUrl}/admin-only`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const adminAccessBody = await adminAccessRes.json();
    assert.equal(adminAccessRes.status, 200);
    assert.equal(adminAccessBody.success, true);
    assert.equal(adminAccessBody.data.admin, testAdmin.name);
  });
});
