# HackKro Internship Management System
## Software Engineering Project Report & Architecture Specification
**Unstop Software Developer Internship – Task Submission Round**

---

### Project Metadata
- **Project Title:** HackKro Internship Management System (Enterprise SaaS Platform)
- **Candidate / Lead Engineer:** Neeraj
- **Repository:** [https://github.com/neerajcoder1/hackkro-internship-management](https://github.com/neerajcoder1/hackkro-internship-management)
- **Production Frontend (Vercel):** [https://hackkro-internship-management.vercel.app](https://hackkro-internship-management.vercel.app)
- **Production Backend API (Render):** [https://hackkro-internship-management.onrender.com](https://hackkro-internship-management.onrender.com)
- **Production Health Probe:** [https://hackkro-internship-management.onrender.com/api/health](https://hackkro-internship-management.onrender.com/api/health)
- **Technology Stack:** React 18, Vite 6, Tailwind CSS 3, Node.js, Express, MongoDB Atlas, Resend API
- **Verification Status:** 46 / 46 Automated Tests Passing (100% Pass Rate), Production Build Verified (0 Errors)

---

## 1. Executive Summary

The **HackKro Internship Management System** is an enterprise-grade full-stack SaaS platform designed to streamline, track, and evaluate technical internships at scale. Built with a decoupled client-server architecture, the system provides separate, role-tailored workspaces for interns and program administrators.

Interns manage daily and weekly project milestones, submit public GitHub repository deliverables, monitor real-time cumulative scores, and receive structured qualitative feedback. Administrators oversee intern rosters, create and delegate milestone assignments, inspect live code submissions via a central review queue, allocate validated points, and dispatch automated transactional emails via Resend.

The system features hardened application security—including JWT authentication, bcrypt password hashing, anti-brute-force rate limiting, atomic database updates preventing point race conditions, and full HTML sanitization across all email templates. The application is deployed in production across Vercel (frontend), Render (backend), and MongoDB Atlas (cloud database).

---

## 2. Problem Statement

Managing technical internship programs across distributed cohorts typically suffers from several systemic operational inefficiencies:
1. **Fragmented Communication:** Assignments, deadlines, and submissions are often managed through disparate spreadsheets, email threads, and Discord/Slack messages, causing missed deadlines and tracking errors.
2. **Lack of Submission Verification:** Reviewing code submissions without standardized GitHub URL validation and revision tracking results in unorganized code review bottlenecks.
3. **Double-Awarding & Scoring Inconsistencies:** Manual score tracking frequently leads to point allocation errors, race conditions in grading, and duplicate awards.
4. **Delayed Feedback Loops:** Interns frequently wait days for review feedback without visibility into review statuses or milestone requirements.
5. **Security Deficits:** Ad-hoc internal portals frequently lack role-based access isolation (RBAC), exposing administrative routes and candidate personal data to unauthorized tampering.

---

## 3. Project Objectives

- **Centralized Milestone Management:** Provide administrators with a dashboard to create daily and weekly assignments with deadlines, markdown task descriptions, and maximum point values.
- **Role-Based Workspace Isolation:** Ensure strict separation of privileges where public registrants strictly obtain the `intern` role and cannot access administrator endpoints.
- **Robust Submission Pipeline:** Allow interns to submit valid public GitHub repository URLs and implementation notes with automated validation and pending-state concurrency guards.
- **Atomic Evaluation Engine:** Prevent duplicate point awards and ensure awarded points can never exceed the task's maximum allowed points.
- **Automated Real-Time Notifications:** Integrate transactional email delivery using Resend to notify interns upon task assignment and evaluation, and alert administrators when deliverables are submitted.
- **Enterprise-Grade UI/UX:** Deliver a modern white-and-blue SaaS aesthetic inspired by Linear and Stripe, featuring responsive data tables, modal dialogs, and real-time statistics.
- **High Reliability & Quality Assurance:** Back the entire backend workflow with a 46-test automated integration suite covering authentication, RBAC, evaluation, and security hardening.

---

## 4. Proposed Solution

The HackKro Internship Management System resolves these challenges through a modular, service-oriented architecture:

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                   React 18 SPA (Vite, Tailwind CSS, Lucide Icons)                 |
|                                                                                   |
|   +----------------------------+                 +----------------------------+   |
|   |      Intern Workspace      |                 |      Admin Workspace       |   |
|   | - Task Milestones (D/W)    |                 | - Intern Roster Directory  |   |
|   | - GitHub Submission Form   |                 | - Task Creation & Dispatch |   |
|   | - Points Score Tracker     |                 | - Submission Review Queue  |   |
|   | - Instructor Feedback Card |                 | - Points Evaluation Engine |   |
|   +----------------------------+                 +----------------------------+   |
+-----------------------------------------------------------------------------------+
                                         |
                            HTTPS / JSON / Bearer JWT
                                         v
+-----------------------------------------------------------------------------------+
|                                  SERVER LAYER                                     |
|                   Express REST API on Node.js (Render Cloud)                      |
|                                                                                   |
|   [ Helmet Security Headers ]  -->  [ Rate Limiter (500 API / 30 Auth) ]          |
|   [ CORS Origin Allowlist ]    -->  [ JWT Authentication Middleware ]             |
|   [ RBAC Role Guard ]          -->  [ Centralized Error Handler (CastError, 400) ]|
+-----------------------------------------------------------------------------------+
                  |                                               |
                  v                                               v
+-----------------------------------+           +-----------------------------------+
|          DATABASE LAYER           |           |        NOTIFICATION LAYER         |
|      MongoDB Atlas (Cluster0)     |           |            Resend API             |
|  - Users Collection (bcrypt)      |           |  - Task Assignment Alerts         |
|  - Tasks Collection (Daily/Weekly)|           |  - Submission Alerts to Admin     |
|  - Submissions Collection (Atomic)|           |  - Evaluation Decision to Intern  |
+-----------------------------------+           +-----------------------------------+
```

---

## 5. Technology Stack

### Frontend Architecture
- **Framework:** React 18.3.1 (Single-Page Application)
- **Build Tool:** Vite 6.0.7 (Hot Module Replacement, fast ESBuild production chunks)
- **Routing:** React Router DOM 6.28.1 (Client-side routing with `ProtectedRoute` guards and `vercel.json` SPA rewrites)
- **Styling:** Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- **Icons:** Lucide React 1.70.0
- **Hosting:** Vercel (Edge-routed, CDN-cached production deployment)

### Backend Architecture
- **Runtime:** Node.js v20+ (ES Module architecture)
- **Web Framework:** Express 4.21.2
- **Database Connector:** Mongoose 8.9.5 ODM
- **Security Middleware:** Helmet 8.3.0, Express Rate Limit 8.7.3, CORS 2.8.5
- **Authentication:** JSON Web Tokens (`jsonwebtoken` 9.0.2) & `bcryptjs` 2.4.3 (10 salt rounds)
- **Email Delivery:** Resend SDK 6.37.0
- **Hosting:** Render Web Service (Ubuntu container with dynamic port binding and zero-downtime health probes)

### Database Layer
- **Engine:** MongoDB Atlas (Cloud Shared M0 Cluster)
- **Features:** Replica set high availability, field-level unique indexes, atomic find-and-modify operations

---

## 6. System Architecture Diagram

```
+------------------+         +------------------+         +--------------------+
|  Intern Browser  |         |  Admin Browser   |         | External Services  |
|  (React 18 SPA)  |         |  (React 18 SPA)  |         | (GitHub, Resend)   |
+--------+---------+         +--------+---------+         +---------+----------+
         |                            |                             ^
         | Authorization: Bearer JWT  | Authorization: Bearer JWT   |
         v                            v                             |
+-------------------------------------------------------------------+----------+
|                     Render Cloud Web Service (Port Dynamic)                  |
|                                                                              |
|  +--------------------+   +---------------------+   +---------------------+  |
|  |   auth.routes.js   |   |   task.routes.js    |   |submission.routes.js |  |
|  | - /login           |   | - /my-tasks (Intern)|   | - / (POST submit)   |  |
|  | - /register        |   | - / (POST Admin)    |   | - /my-submissions   |  |
|  | - /me              |   | - /:id (PATCH/DEL)  |   | - /my-points        |  |
|  | - /register-admin  |   | - / (GET Admin list)|   | - /:id/review       |  |
|  +---------+----------+   +----------+----------+   +----------+----------+  |
|            |                         |                         |             |
|            +-------------------------+-------------------------+             |
|                                      v                                       |
|  +------------------------------------------------------------------------+  |
|  |                        Controllers & Services                          |  |
|  | - auth.controller.js (Type guards, bcrypt compare, token minting)     |  |
|  | - task.controller.js (Deadline validation, intern assignment)         |  |
|  | - submission.controller.js (Atomic evaluation, GitHub URL regex)       |  |
|  | - email.service.js (Resend API dispatch, HTML template escaping)       |  |
|  +-----------------------------------+------------------------------------+  |
+--------------------------------------|---------------------------------------+
                                       v
+------------------------------------------------------------------------------+
|                         MongoDB Atlas Cloud Cluster                          |
|                                                                              |
|  +-----------------------+  +-----------------------+  +-------------------+ |
|  |    User Collection    |  |    Task Collection    |  |Submission Collect | |
|  | - name, email (unique)|  | - title, description  |  | - task (ref)      | |
|  | - password (bcrypt)   |  | - taskType (daily/wk) |  | - intern (ref)    | |
|  | - role (admin/intern) |  | - assignedTo (ref)    |  | - githubUrl       | |
|  |                       |  | - maxPoints, deadline |  | - pointsAwarded   | |
|  +-----------------------+  +-----------------------+  +-------------------+ |
+------------------------------------------------------------------------------+
```

---

## 7. Application Modules & Features

### Core Modules:
1. **Authentication & Session Management:**
   - Unified login interface supporting seamless role-based redirection.
   - Public registration strictly locked to the `intern` role.
   - Protected admin onboarding via private administrative master key.
   - Persistent session hydration via `localStorage` JWT token storage.
2. **Task & Milestone Workflow:**
   - Dual milestone classification: **Daily Tasks** (quick deliverables) and **Weekly Tasks** (comprehensive projects).
   - Milestone assignment engine linking tasks to specific interns.
   - Deadline tracking with automated overdue status detection.
3. **Deliverables & Submission Review:**
   - Intern deliverable submission with strict GitHub repository URL pattern matching (`https://github.com/owner/repo`).
   - Duplicate submission protection blocking re-submissions while an evaluation is pending.
   - Centralized review queue for administrators displaying submitted date, code URL, and candidate notes.
4. **Evaluation & Points Ledger:**
   - Administrator evaluation modal allowing single-click Approval or Revision Request.
   - Strict score validation ensuring awarded points can never exceed the task's maximum limit.
   - Atomic database guards preventing concurrent point evaluation race conditions.
   - Real-time score recalculation aggregating approved submission scores.
5. **Automated Notification Service:**
   - Resend API integration with responsive, entity-escaped HTML templates.
   - Automatic dispatch for Task Assignment, Task Submission, and Evaluation Decisions.
   - Non-blocking asynchronous dispatch ensuring email provider latencies never slow down database transactions.

---

## 8. Role-Based Portal Selection Architecture (`/portals`)

To provide intuitive navigation for diverse user personas while preserving strict underlying cryptographic RBAC enforcement, the system implements a dedicated Role-Based Portal Selection interface:

1. **Dedicated Portal Directory (`/portals` and Landing Page Section):**
   - **Admin / Employee Portal:** Program directors, mentors, and administrators manage candidate rosters, assign daily/weekly milestones, inspect submitted code solutions, and grade deliverables with atomic points. Routes to `/login?portal=admin` $\rightarrow$ `/admin`.
   - **Intern Portal:** Candidates and active interns access daily/weekly milestone instructions, submit validated public GitHub repositories, and track feedback with cumulative scores. Routes to `/login?portal=intern` $\rightarrow$ `/intern` (or `/register` for new candidates).
2. **Context-Aware Authentication Screen:**
   - The `/login` page reads the `?portal=admin` or `?portal=intern` query parameter to display contextual badges, role guidance, and a one-click switcher back to `/portals`.
   - The authentication pipeline remains completely decoupled: users authenticate against the single secure endpoint, and backend JWT role claims determine their destination workspace (`/admin` vs `/intern`), preventing client-side spoofing.

---

## 9. Intern Dashboard Functionality

The Intern Workspace (`/intern`) is designed around a distraction-free four-quadrant productivity layout:

1. **Intern Overview & Analytics:**
   - Four top-level metric cards: **Total Points Earned**, **Completed Milestones**, **Active Tasks**, and **Completion Rate (%)**.
2. **Daily & Weekly Task Explorer:**
   - Tabbed view categorizing milestones by cadence (Daily vs. Weekly).
   - Displays task titles, detailed markdown instructions, deadlines, maximum point scores, and status tags (`Pending`, `Submitted`, `Completed`).
3. **GitHub Submission Modal:**
   - Validates that the input follows GitHub URL standards.
   - Supports optional implementation notes and technical explanations.
4. **Submission History & Feedback Ledger:**
   - Comprehensive log of past submissions detailing submission timestamp, evaluation outcome, awarded points, and written instructor feedback.
5. **Intern Profile Panel:**
   - Displays candidate details, unique MongoDB Member ID, account registration date, and role credentials.

---

## 10. Admin Dashboard Functionality

The Administrator Portal (`/admin`) delivers a command-center experience for internship program directors:

1. **Program Overview Metrics:**
   - High-level KPIs: **Total Registered Interns**, **Total Assigned Tasks**, **Submissions Awaiting Review**, and **Total Cumulative Points Awarded**.
2. **Intern Roster Directory:**
   - Searchable, sortable table of all registered interns displaying candidate names, emails, registration dates, and completed task tallies.
3. **Task Creation & Delegation Engine:**
   - Intuitive creation form with fields for Task Title, Description, Cadence (`daily` / `weekly`), Assigned Intern dropdown, Deadline date-picker, and Maximum Points input.
4. **Submission Review Queue:**
   - Live queue highlighting pending deliverables.
   - One-click links opening candidate GitHub repositories directly in a new tab.
   - Interactive review modal to record evaluation status (`approved` or `rejected`), points awarded (0 to maxPoints), and qualitative feedback notes.
5. **Evaluation Audit Trail:**
   - Historical ledger of all evaluated submissions with reviewer timestamps and recorded scores.

---

## 11. Authentication & Role-Based Access Control (RBAC)

The system enforces strict multi-layered privilege isolation:

```
[ Incoming HTTP Request ]
            |
            v
[ authenticate Middleware ]
  ├── Extracts 'Authorization: Bearer <token>' header
  ├── Verifies signature via jwt.verify(token, process.env.JWT_SECRET)
  ├── Queries User.findById(decoded.id)
  └── Attaches sanitized user document to req.user (or throws 401 Unauthorized)
            |
            v
[ authorize('admin') Middleware ]
  ├── Inspects req.user.role
  ├── If req.user.role === 'admin' --> Calls next()
  └── If req.user.role !== 'admin' --> Throws 403 Forbidden
```

### RBAC Enforcement Rules:
1. **Public Registration:** `POST /api/auth/register` creates accounts with `role: 'intern'`. Any client payload attempting to pass `"role": "admin"` is explicitly disregarded.
2. **Admin Provisioning:** `POST /api/auth/register-admin` requires the private header `x-admin-key` matching `process.env.ADMIN_CREATION_KEY`.
3. **Ownership Protection:** An intern can only submit deliverables for tasks where `task.assignedTo === req.user._id`. Cross-intern submissions are rejected with HTTP 403.
4. **Evaluation Isolation:** Only authenticated accounts with `role: 'admin'` can review submissions or assign points.

---

## 12. MongoDB Database Structure & Schemas

### 12.1. User Schema (`users` collection)
```javascript
{
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['intern', 'admin'], default: 'intern' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```
- **Security Feature:** Password hashes use `select: false` to ensure they are excluded from standard queries by default.
- **Lifecycle Hook:** `pre('save')` generates a 10-round bcrypt salt and hashes the password if modified.

### 12.2. Task Schema (`tasks` collection)
```javascript
{
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  taskType: { type: String, enum: ['daily', 'weekly'], required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  maxPoints: { type: Number, required: true, min: 1, default: 100 },
  status: { type: String, enum: ['pending', 'submitted', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 12.3. Submission Schema (`submissions` collection)
```javascript
{
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  githubUrl: { type: String, required: true, trim: true },
  submissionNotes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  pointsAwarded: { type: Number, default: 0, min: 0 },
  feedback: { type: String, trim: true, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  isEvaluated: { type: Boolean, default: false }
}
```

---

## 13. REST API Architecture & Endpoints

All responses follow a predictable JSON format using standardized `ApiResponse` and `ApiError` utilities:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Complete API Specification:

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, database connection, and uptime probe |
| `POST` | `/api/auth/register` | Public | Register new intern account (role strictly enforced) |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return signed JWT |
| `POST` | `/api/auth/logout` | Authenticated | Terminate user session |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role details |
| `GET` | `/api/auth/interns` | Admin Only | Retrieve roster of all enrolled intern accounts |
| `POST` | `/api/auth/register-admin`| Master Key | Securely provision administrator account |
| `GET` | `/api/tasks/my-tasks` | Intern Only | Retrieve milestones assigned to authenticated intern |
| `POST` | `/api/tasks` | Admin Only | Create milestone assignment and notify intern |
| `GET` | `/api/tasks` | Admin Only | Retrieve all created milestone assignments |
| `GET` | `/api/tasks/:id` | Authenticated | Retrieve task specification by ID |
| `PATCH`| `/api/tasks/:id` | Admin Only | Update task deadline, points, or description |
| `DELETE`| `/api/tasks/:id` | Admin Only | Delete milestone assignment |
| `POST` | `/api/submissions` | Intern Only | Submit GitHub solution URL for assigned task |
| `GET` | `/api/submissions/my-submissions`| Intern Only| Retrieve submission history for authenticated intern |
| `GET` | `/api/submissions/my-points`| Intern Only | Calculate and return cumulative points breakdown |
| `GET` | `/api/submissions` | Admin Only | Retrieve submission review queue with filters |
| `PATCH`| `/api/submissions/:id/review`| Admin Only | Evaluate submission, allocate points, provide feedback |

---

## 14. Automated Email Notification Workflows (Resend)

The notification system uses the **Resend API** to automate communications across three critical lifecycle milestones:

1. **Task Assignment Workflow:**
   - **Trigger:** Administrator creates and assigns a task.
   - **Recipient:** Assigned intern email.
   - **Contents:** Intern name, task title, description, cadence (`Daily` / `Weekly`), maximum point value, deadline timestamp, and direct CTA link to intern dashboard.
2. **Task Submission Workflow:**
   - **Trigger:** Intern submits a GitHub URL deliverable.
   - **Recipient:** Administrator notification email (`ADMIN_NOTIFICATION_EMAIL`).
   - **Contents:** Candidate name, email, task title, GitHub repository link, submission notes, and direct CTA link to admin review queue.
3. **Evaluation Decision Workflow:**
   - **Trigger:** Administrator approves or rejects a submission.
   - **Recipient:** Intern email.
   - **Contents:** Task title, evaluation decision badge (`APPROVED` or `REVISION REQUESTED`), awarded points breakdown (`pointsAwarded / maxPoints`), instructor feedback notes, and dashboard link.

### Email Security & Hygiene:
- **HTML Injection Defense:** All dynamic parameters (`internName`, `task.title`, `submissionNotes`, `feedback`) pass through `escapeHtml()` entity encoding to prevent email XSS.
- **Protocol Sanitization:** URLs pass through `sanitizeUrl()` restricting protocols to `http:` and `https:`.
- **Deduplication Engine:** In-memory deduplication keys prevent repeated notifications during network retries.

---

## 15. Security Implementation & Quality Assurance

A dedicated security hardening audit was performed in Phase 7 to resolve production edge cases:

1. **Atomic Evaluation Guard:**
   - Concurrency race conditions are eliminated using atomic MongoDB queries:
     ```javascript
     const updated = await Submission.findOneAndUpdate(
       { _id: id, status: { $ne: 'approved' } },
       { pointsAwarded, status: 'approved', isEvaluated: true },
       { new: true }
     );
     if (!updated) throw new ApiError(400, 'Duplicate point awards are forbidden.');
     ```
2. **HTTP Security Headers (Helmet):**
   - Configured `helmet()` providing `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Resource-Policy: cross-origin`, and `HSTS`.
3. **Anti-Brute-Force Rate Limiting:**
   - Global rate limiter: 500 requests per 15 minutes.
   - Authentication rate limiter: 30 requests per 15 minutes per IP on `/api/auth/login`, `/register`, and `/register-admin`.
4. **Normalized Error Handling (CastError Protection):**
   - Mongoose `CastError` (invalid 24-char ObjectId) is mapped to `400 Bad Request` instead of unhandled 500 crashes.
   - MongoDB duplicate key collisions (`E11000`) map to `409 Conflict`.
5. **NoSQL Injection Defense:**
   - Enforced strict primitive type checking (`typeof email === 'string' && typeof password === 'string'`) preventing query object injection.

---

## 16. Testing Methodology & Verification Results

The test suite runs against a live ephemeral MongoDB connection using Node.js's native test runner (`node --test`).

```
================================================================================
TEST SUITE EXECUTION SUMMARY: 46 / 46 PASSING (100% PASS RATE)
================================================================================
Phase 2: Authentication & Role-Based Authorization Tests (9 tests)
  ✔ 1. Successful intern registration
  ✔ 2. Duplicate email rejection (409 Conflict)
  ✔ 3. Successful login & JWT issuance
  ✔ 4. Incorrect password rejection (401 Unauthorized)
  ✔ 5. Missing token rejection on protected route (401 Unauthorized)
  ✔ 6. Invalid token rejection on protected route (401 Unauthorized)
  ✔ 7. GET /api/auth/me retrieves authenticated user profile
  ✔ 8. Intern attempting admin access is rejected (403 Forbidden)
  ✔ 9. Admin registration via private key and authorized access (200 OK)

Phase 5: Automated Email Notification Workflows (5 tests)
  ✔ 1. Task Assignment Email Workflow: Admin creates task triggers intern email
  ✔ 2. Task Submission Email Workflow: Intern submits solution triggers admin alert
  ✔ 3. Task Evaluation Email Workflow: Admin review decision triggers intern alert
  ✔ 4. Duplicate Notification Prevention: Resending same notification key is skipped
  ✔ 5. Resilience & Failure Handling: Invalid email or missing parameters do not throw

Phase 7: Comprehensive Security Hardening & QA Test Suite (21 tests)
  ✔ 1.1. Missing token returns 401 Unauthorized
  ✔ 1.2. Malformed / invalid token signature returns 401 Unauthorized
  ✔ 1.3. Expired token is detected and rejected with 401 Unauthorized
  ✔ 1.4. Wrong password returns 401 Unauthorized without leaking account existence detail
  ✔ 1.5. Duplicate registration returns 409 Conflict
  ✔ 1.6. Security headers (Helmet) are present on API responses
  ✔ 2.1. Intern accessing admin-only endpoint (GET /api/tasks) returns 403 Forbidden
  ✔ 2.2. Intern attempting to create tasks (POST /api/tasks) returns 403 Forbidden
  ✔ 2.3. Intern attempting to update tasks (PATCH /api/tasks/:id) returns 403 Forbidden
  ✔ 2.4. Intern attempting to delete tasks (DELETE /api/tasks/:id) returns 403 Forbidden
  ✔ 2.5. Intern Bob submitting work for Intern Alice task is rejected with 403 Forbidden
  ✔ 2.6. Intern attempting to evaluate a submission returns 403 Forbidden
  ✔ 3.1. Invalid task ID format returns 400 Bad Request (handled CastError)
  ✔ 3.2. Invalid deadline format during task creation returns 400 Bad Request
  ✔ 3.3. Invalid GitHub URL format during submission returns 400 Bad Request
  ✔ 3.4. Duplicate submission while review is pending is rejected with 400 Bad Request
  ✔ 4.1. Awarding points exceeding task maxPoints returns 400 Bad Request
  ✔ 4.2. Awarding negative points returns 400 Bad Request
  ✔ 4.3. Admin successfully reviews and approves with valid points (85/100)
  ✔ 4.4. Duplicate point awards on already approved submission is strictly rejected (400)
  ✔ 5.1. Missing email fields or invalid recipient gracefully handled without throwing

Phase 3: Task Management & Evaluation Integration Tests (11 tests)
  ✔ 1. Admin task creation (POST /api/tasks)
  ✔ 2. Unauthorized task creation (Intern attempting POST /api/tasks rejected with 403)
  ✔ 3. Intern task access & assignment verification (GET /api/tasks/my-tasks)
  ✔ 4. Submission ownership protection (Intern B cannot submit for Intern A task)
  ✔ 5. Valid submission creation by assigned intern (POST /api/submissions)
  ✔ 6. Duplicate submission rejection while review is pending (POST /api/submissions)
  ✔ 7. Validation prevents awarding points exceeding task maxPoints
  ✔ 8. Admin review and approval with point allocation (PATCH /api/submissions/:id/review)
  ✔ 9. Duplicate point prevention (Attempting to re-evaluate approved submission rejected)
  ✔ 10. Point calculation accuracy (GET /api/submissions/my-points)
  ✔ 11. Intern submission history retrieval (GET /api/submissions/my-submissions)
--------------------------------------------------------------------------------
TOTALS: 46 passed, 0 failed, 0 skipped. Duration: ~13.2s
================================================================================
```

---

## 17. Deployment Architecture

```
                                    [ User Request ]
                                           |
                                           v
                  +-------------------------------------------------+
                  |          Vercel Global Edge Network             |
                  |  - Production URL: hackkro-internship-mgmt      |
                  |  - Host: https://*.vercel.app                   |
                  |  - Client-Side SPA Routing via vercel.json      |
                  +-------------------------------------------------+
                                           |
                                  API Calls via HTTPS
                                           v
                  +-------------------------------------------------+
                  |            Render Web Service (Linux)           |
                  |  - Host: https://*.onrender.com                 |
                  |  - Node.js 20 ESM Container                     |
                  |  - Zero-downtime health probe: /api/health      |
                  |  - Automatic deployments linked to Git main     |
                  +-------------------------------------------------+
                                     |            |
                    Mongoose TCP / SRV            | HTTPS REST API
                                     v            v
            +--------------------------+        +--------------------------+
            |  MongoDB Atlas Cluster   |        |        Resend API        |
            |  Cloud Replica Set M0    |        |  Transactional Delivery  |
            +--------------------------+        +--------------------------+
```

### Key Deployment Configurations:
- **SPA Route Rewrites:** Configured in `frontend/vercel.json` routing all subpaths (`/(.*)`) to `/index.html` to eliminate 404 errors on browser page reloads.
- **CORS Origin Binding:** Render dynamically permits requests originating from `https://hackkro-internship-management.vercel.app` with `credentials: true`.
- **Zero-Downtime Health Probing:** Render continuously monitors `/api/health` before routing live traffic to new deployments.

---

## 18. Application Screenshots

### 18.1. Authentication Portal (Unified Split-Screen Login)
The unified login interface automatically routes authenticated users based on their server-verified account role (`/admin` for directors, `/intern` for interns):

```
+-----------------------------------------------------------------------------------+
|  [HK Logo] HackKro Internship Management System                 Sign In  Register |
|-----------------------------------------------------------------------------------|
|                                         |                                         |
|              [ BRAND HERO ]             |             Welcome back                |
|                                         |     Sign in to continue to your         |
|      HackKro Internship Management      |     internship workspace.               |
|                                         |                                         |
|      A Smarter Way to Manage            |     [Email Address               ]      |
|      Internships                        |                                         |
|                                         |     [Password                (o) ]      |
|      - Task & Project Management        |                                         |
|      - Progress & Points Tracking       |     [x] Remember me                     |
|      - Evaluation & Feedback            |                                         |
|                                         |     [        Sign In Button      ]      |
|                                         |                                         |
|                                         |     Don't have an account? Register     |
+-----------------------------------------------------------------------------------+
```
*(Reference: `docs/screenshots/login_page.png`)*

### 18.2. Administrator Workspace & Live Dashboard
The production administrator portal displays real-time statistics, intern tallies, review queues, and quick actions:

```
+-----------------------------------------------------------------------------------+
|  [HK] HackKro        Home > Admin Dashboard                    Refresh  (Bell) (N)|
|-----------------------------------------------------------------------------------|
|  [x] Overview        Admin Overview                                               |
|  [ ] Interns         Manage interns, tasks, submissions and evaluations.          |
|  [ ] All Tasks                                                                    |
|  [+] Assign Task     +--------------+ +--------------+ +--------------+           |
|  [ ] Pending Reviews |Total Interns | | Total Tasks  | |Pending Review|           |
|  [ ] History         |      1       | |      1       | |      0       |           |
|                      +--------------+ +--------------+ +--------------+           |
|                                                                                   |
|                      Recent Submissions                  Quick Actions            |
|                      +------------------------+          [ + Assign New Task    ] |
|                      |  (Check) Inbox Zero    |          [ Review Submissions   ] |
|                      |  No pending reviews    |          [ Manage Interns       ] |
|                      +------------------------+                                   |
+-----------------------------------------------------------------------------------+
```
*(Reference: `docs/screenshots/admin_dashboard.png`)*

---

## 19. Local Installation & Execution Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Local MongoDB instance or free MongoDB Atlas URI

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/neerajcoder1/hackkro-internship-management.git
cd hackkro-internship-management

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Create `backend/.env` using the provided template:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hackkro_internship
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=development_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_CREATION_KEY=hackkro_admin_secret_key_2026
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=HackKro Internship <onboarding@resend.dev>
ADMIN_NOTIFICATION_EMAIL=admin@hackkro.com
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Development Servers
In terminal 1 (Backend API):
```bash
npm --prefix backend run dev
```

In terminal 2 (Frontend Client):
```bash
npm --prefix frontend run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Execute Automated Test Suite
```bash
npm --prefix backend test
```

---

## 20. Conclusion & Future Enhancements

The **HackKro Internship Management System** successfully delivers an end-to-end, production-verified software engineering platform. By uniting role-based access control, atomic evaluation safeguards, real-time score calculation, and automated transactional emails, the system provides a scalable solution for modern technical training programs.

### Roadmap & Future Enhancements:
1. **GitHub Pull Request Webhooks:** Automatically ingest commit hashes, CI test statuses, and code change diffs directly from candidate repositories.
2. **Distributed Redis Deduplication:** Migrate in-memory notification sets to a distributed Redis key-value store with TTL for multi-node backend clustering.
3. **Plagiarism & Code Similarity Detection:** Integrate automated source code comparison across cohort submissions.
4. **Exportable Evaluation Transcripts:** Enable PDF and CSV score certificate generation for candidates upon internship completion.
