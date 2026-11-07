# HackKro Internship Management System

A polished, full-stack SaaS platform designed for managing software developer internships, task workflows, code submissions, progress tracking, and automated email communications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, React Router DOM 6, Tailwind CSS 3 |
| **Design System** | HackKro Electric Blue (`#2563eb`), Linear/Vercel-inspired SaaS tokens |
| **Backend** | Node.js, Express (ESM architecture) |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens) & bcryptjs password hashing |
| **Email Service** | Resend API (Automated Notifications & HTML Templates) |

---

## 🎨 HackKro SaaS Design System

Modeled after modern developer interfaces (**Linear**, **Vercel**, **Stripe**, and **Raycast**) and anchored in the official [HackKro](https://www.hackkro.com/) visual identity:

- **Official Brand Mark**: Integrated official HackKro vector and logo (`https://res.cloudinary.com/payb7fsq/image/upload/v1791981789/Hack_Kro_Logo.png`).
- **Brand Tokens**:
  - `brand-600`: `#2563eb` (Official HackKro Developer Blue)
  - `brand-500`: `#3b82f6` (Electric Blue highlight & focus rings)
  - `space-950`: `#080c14` (Deep space canvas)
  - `space-900`: `#0e1422` (Elevated card surfaces)
  - `space-850`: `#141d30` (Interactive panels & inputs)
- **Typography**: Inter for crisp interface legibility with `-0.02em` tight heading kerning; JetBrains Mono for commit URLs, points, and timestamps.
- **Micro-Interactions**: Pulsing indicator dots on `submitted` review badges, custom sleek scrollbars, and accessible keyboard ESC modal closures.

---

## 📂 Project Architecture

```text
HackKro-Internship-Management/
├── backend/
│   ├── server.js                      # Application entry point & process listeners
│   ├── package.json                   # Backend dependencies & npm scripts
│   ├── .env.example                   # Environment variable template
│   ├── tests/
│   │   ├── auth.test.js               # Integration tests for Auth & RBAC
│   │   ├── task.test.js               # Integration tests for Tasks & Submissions
│   │   └── email.test.js              # Integration tests for Resend Email Workflows
│   └── src/
│       ├── app.js                     # Express setup (CORS, parsers, router mount, error handler)
│       ├── config/
│       │   └── db.js                  # MongoDB Mongoose connection & lifecycle handlers
│       ├── controllers/
│       │   ├── auth.controller.js     # User registration, login, logout, me, register-admin, interns
│       │   ├── health.controller.js   # Health check controller (/api/health)
│       │   ├── task.controller.js     # Task creation, assignment, updates, deletion, my-tasks
│       │   └── submission.controller.js # Task submission, review/evaluation, points calculation
│       ├── middleware/
│       │   ├── auth.middleware.js     # JWT verification (authenticate) & RBAC (authorize)
│       │   ├── errorHandler.js        # Centralized error handler
│       │   └── notFoundHandler.js     # Centralized 404 handler
│       ├── models/
│       │   ├── user.model.js          # User schema, password hashing, JWT generation
│       │   ├── task.model.js          # Task schema (daily/weekly, assignedTo, maxPoints)
│       │   └── submission.model.js    # Submission schema (githubUrl, review, pointsAwarded)
│       ├── routes/
│       │   ├── index.js               # Central API router aggregator
│       │   ├── auth.routes.js         # Authentication & RBAC endpoints
│       │   ├── health.routes.js       # Health routes
│       │   ├── task.routes.js         # Task management routes
│       │   └── submission.routes.js   # Submission & evaluation routes
│       ├── scripts/
│       │   └── seedAdmin.js           # CLI script to seed administrative accounts
│       ├── services/
│       │   ├── email.service.js       # Dedicated Resend email delivery service
│       │   └── emailTemplates.js      # Responsive HTML email templates & text fallbacks
│       └── utils/
│           ├── ApiError.js            # Standardized custom API error class
│           ├── ApiResponse.js         # Standardized API response class
│           └── asyncHandler.js        # Async route handler wrapper
├── frontend/
│   ├── index.html                     # HTML5 entry page
│   ├── package.json                   # Frontend dependencies & npm scripts
│   ├── vite.config.js                 # Vite build & dev server config
│   ├── tailwind.config.js             # HackKro SaaS tokens (Electric Blue & Deep Space)
│   ├── postcss.config.js              # PostCSS plugins (Tailwind, Autoprefixer)
│   ├── .env.example                   # Frontend environment variable template
│   └── src/
│       ├── main.jsx                   # React DOM root render
│       ├── App.jsx                    # Root app routing with AuthProvider & Navbar
│       ├── index.css                  # Typography, scrollbars & Tailwind base
│       ├── components/
│       │   ├── Navbar.jsx             # Official HackKro logo & role-aware header
│       │   ├── ProtectedRoute.jsx     # Route guard enforcing authentication & roles
│       │   └── ui/
│       │       ├── Modal.jsx          # Accessible dialog with ESC dismissal
│       │       ├── NotificationBanner.jsx # Toast-style feedback banner
│       │       ├── StatCard.jsx       # Linear-style KPI metric card with micro-gradients
│       │       └── StatusBadge.jsx    # Semantic status badges with pulsing live indicators
│       ├── context/
│       │   └── AuthContext.jsx        # Global auth state (login, register, logout, profile hydration)
│       ├── pages/
│       │   ├── HomePage.jsx           # Polished SaaS landing view with live health monitor
│       │   ├── LoginPage.jsx          # Clean sign-in with HackKro brand mark
│       │   ├── RegisterPage.jsx       # Cohort registration view with security disclosure
│       │   ├── InternPortal.jsx       # Linear-grade Intern Workspace (Missions, Drawer, Audit, Profile)
│       │   └── AdminPortal.jsx        # Command-Center Admin Workspace (KPIs, Triage Queue, Leaderboard)
│       └── services/
│           └── api.js                 # Unified API client (Auth, Tasks, Submissions, Cohorts)
├── docs/                              # Project documentation
├── .gitignore                         # Git exclusion rules
├── package.json                       # Monorepo root convenience scripts
└── README.md                          # Project documentation
```

---

## 🖥️ Workspaces

### 1. Intern Workspace (`/intern`)
- **Mission Dashboard**: Real-time progress bar, cumulative points ring, and urgent mission countdowns.
- **Segmented Linear-Style Tab Controller**: Switch seamlessly between Overview, Daily Assignments, Weekly Milestones, Submission Audit Log, Points Breakdown, and Developer Profile.
- **GitHub Solution Drawer**: Clean submission modal with public repository URL regex validation and developer notes.
- **Points Audit Trail**: Task-by-task scoring records with instructor feedback quotes.

### 2. Admin Command Center (`/admin`)
- **Triage Review Queue**: Prioritized list of intern submissions awaiting evaluation with one-click review controls.
- **Code Deliverable Evaluation Modal**: Interactive Approve / Request Revision toggles, point allocation with `maxPoints` validation, and constructive review feedback.
- **Task Dispatcher**: Create daily or weekly assignments assigned to registered cohort members with deadline pickers.
- **Cohort Leaderboard**: Comprehensive intern directory tracking assigned tasks, completion percentages, and total points.

---

## 🧪 Automated Testing

Run the full integration test suite across all implemented features:

```bash
cd backend
npm test
```

Executes **25 automated integration tests** with 100% pass rate:
- **Phase 2 Authentication Suite**: 9 tests (registration, duplicate email rejection, login, incorrect password, missing/invalid tokens, profile retrieval, RBAC 403/200 checks).
- **Phase 3 Task Management Suite**: 11 tests (task creation, assignment, unauthorized rejection, submission creation, ownership protection, duplicate prevention, review allocation, point calculation).
- **Phase 5 Automated Email Suite**: 5 tests (task assignment, task submission, evaluation decision, deduplication skipping, and failure handling).

---

## 🚀 Running the Project

```bash
# Start backend (port 5000)
npm run dev:backend

# Start frontend (port 5173)
npm run dev:frontend
```

Pre-seeded admin credentials:
- **Email**: `admin@hackkro.com`
- **Password**: `Admin@Hackkro2026`
