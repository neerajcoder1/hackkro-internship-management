# HACKKRO
## Evaluator Access Guide

**Project:** HackKro Internship Management System  
**Evaluation:** Unstop – Software Developer Internship Task Submission  
**Candidate / Lead Engineer:** Neeraj  

---

### 1. Live Application Links
- **Production Web Application:** [https://hackkro-internship-management.vercel.app](https://hackkro-internship-management.vercel.app)  
- **Backend API Health Probe:** [https://hackkro-internship-management.onrender.com/api/health](https://hackkro-internship-management.onrender.com/api/health) (`200 OK`)

### 2. Source Code & Architecture Documentation
- **GitHub Repository:** [https://github.com/neerajcoder1/hackkro-internship-management](https://github.com/neerajcoder1/hackkro-internship-management)  
- **Technical Architecture Report (Markdown):** [docs/HackKro_Project_Report.md](https://github.com/neerajcoder1/hackkro-internship-management/blob/main/docs/HackKro_Project_Report.md)  
- **Publication-Ready Project Report (PDF):** [docs/HackKro_Project_Report.pdf](https://github.com/neerajcoder1/hackkro-internship-management/blob/main/docs/HackKro_Project_Report.pdf)  

---

### 3. Available Portals

**Admin / Employee Portal (`/login?portal=admin` → `/admin`)**
Administrators and staff can:
- View the active candidate directory and enrolled intern roster.
- Create and delegate daily deliverables (`Daily Task`) and weekly milestone tasks (`Weekly Milestone`).
- Inspect submitted code solutions via a centralized review queue.
- Validate candidate GitHub repository links (`https://github.com/owner/repo`).
- Grade deliverables with atomic points evaluation (enforcing score caps) and structured qualitative feedback.
- Monitor overall cohort progress, total reviews pending, and cumulative points awarded.

**Intern Portal (`/login?portal=intern` → `/intern`)**
Interns and candidates can:
- View assigned daily and weekly milestone assignments.
- Inspect real-time status badges: `Pending`, `Under Review` (submitted), and `Completed`.
- Submit public GitHub repository URLs and implementation notes.
- Inspect written instructor evaluation feedback and submission outcomes (`Approved` or `Needs Revision`).
- Monitor cumulative point scores and milestone completion statistics.

---

### 4. Evaluator Login Credentials

> **Status: ACTIVE EVALUATOR ACCOUNTS** — These dedicated evaluator accounts are provisioned on the live production environment exclusively for Unstop assessment. They are completely isolated from the project lead's personal account.

| Portal | Role | Email Address | Password | Direct Portal Entry |
| :--- | :--- | :--- | :--- | :--- |
| **Admin / Employee Portal** | `admin` | `evaluator-admin@hackkro.internal` | `[Provided securely in Unstop submission]` | [Sign In as Admin](https://hackkro-internship-management.vercel.app/login?portal=admin) |
| **Intern Portal** | `intern` | `evaluator-intern@hackkro.internal` | `[Provided securely in Unstop submission]` | [Sign In as Intern](https://hackkro-internship-management.vercel.app/login?portal=intern) |

---

### 5. Recommended Testing Workflow (For Evaluator Verification)

The following sequence is recommended for evaluators to test the end-to-end task lifecycle on the live production environment:

1. **Sign In through the Admin / Employee Portal:**
   - Navigate to [Admin Portal Sign In](https://hackkro-internship-management.vercel.app/login?portal=admin).
   - Sign in using the provisioned Evaluator Admin credentials.
   - Click **Assign Task** in the sidebar.
   - Select the Demo Intern from the **Assign To** dropdown, enter a title (e.g., "Build REST Authentication API"), select cadence (`Daily Task` or `Weekly Milestone`), choose a deadline, and set maximum points (e.g., `100`), then click **Assign Task**.
2. **Sign In through the Intern Portal:**
   - Log out or open a private/incognito window, then navigate to [Intern Portal Sign In](https://hackkro-internship-management.vercel.app/login?portal=intern).
   - Sign in using the provisioned Evaluator Intern credentials.
   - Locate the assigned milestone in the explorer (initially showing the `Pending` badge) and click **Submit Solution**.
   - Enter a valid public repository link (e.g., `https://github.com/octocat/Hello-World`) and technical notes, then click **Submit Deliverable**.
   - Verify that the task status updates to `Under Review`.
3. **Review & Grade as Admin:**
   - Log back into the Admin Portal and click **Pending Reviews** in the sidebar.
   - Click **Review Submission** on the pending deliverable.
   - Inspect the candidate notes and GitHub repository link.
   - Select **Approve**, enter awarded points (e.g., `90`), provide constructive feedback, and click **Submit Evaluation**.
4. **Verify Points & Feedback as Intern:**
   - Switch back to the Intern Portal.
   - Confirm that the intern's **Total Points** counter reflects `90`, the task status badge transitions to `Completed`, and the submission status reflects `Approved` with the written instructor feedback displayed.

---

### 6. Automated Email Notifications

HackKro implements three automated notification workflows powered by the Resend API:

1. **Task Assignment Workflow:** Dispatches assignment details to the assigned intern.
2. **Task Submission Workflow:** Alerts administrators when a candidate submits work.
3. **Task Evaluation Workflow:** Notifies the intern of the evaluation outcome and awarded score.

The codebase includes entity-escaped HTML email templates, recipient email pattern validation, duplicate-notification skipping keys, and asynchronous non-blocking error handling.

#### Verification & Delivery Distinction:
- **Automated Test Verification:** The email dispatch pipeline, deduplication logic, and template compilation are verified by the backend integration test suite (**46 / 46 passing tests**).
- **Live Production Delivery Constraint:** The production deployment operates on Resend's free developer sandbox using the default sender domain (`onboarding@resend.dev`). Under Resend's free tier policy, actual outbound email delivery to external inboxes is restricted strictly to the verified developer account. Delivering transactional emails to arbitrary external recipients requires a custom verified sending domain with DNS TXT/MX records. Passing automated tests confirm internal logic correctness, not unrestricted external delivery.

---

### 7. Technology Stack & Verification Summary

- **Frontend:** React 18.3, Vite 6, Tailwind CSS 3, Lucide React Icons, React Router 6.
- **Backend:** Node.js 20, Express.js 4.21 (ESM), MongoDB Atlas Cloud, Mongoose 8.9.
- **Security:** Stateless JWT cryptographic verification, bcrypt password hashing (10 salt rounds), Helmet security headers, Express rate limiting, and atomic conditional updates preventing race conditions in scoring.
- **Automated Test Results:** **46 / 46 passing automated tests** (100% pass rate).
