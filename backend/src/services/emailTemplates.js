/**
 * Email templates for HackKro Internship Management System notifications.
 * Responsive HTML design with fallback plain-text equivalents.
 */

/**
 * Escapes HTML characters to prevent email injection / HTML XSS attacks.
 */
export const escapeHtml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates and sanitizes a URL for safe HTML href attribute usage.
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '#';
};

const baseEmailStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #1e293b;
  background-color: #f8fafc;
  margin: 0;
  padding: 24px;
`;

const cardStyle = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const headerStyle = `
  background-color: #0f172a;
  padding: 24px 32px;
  text-align: left;
`;

const bodyStyle = `
  padding: 32px;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #059669;
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 8px;
  margin-top: 20px;
`;

const footerStyle = `
  padding: 20px 32px;
  background-color: #f1f5f9;
  font-size: 12px;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
  text-align: center;
`;

/**
 * Template for Task Assignment Notification
 */
export const taskAssignmentTemplate = ({ internName, task, dashboardUrl }) => {
  const safeInternName = escapeHtml(internName);
  const safeTitle = escapeHtml(task.title);
  const safeDescription = escapeHtml(task.description);
  const safeTaskType = escapeHtml(task.taskType);
  const safeMaxPoints = escapeHtml(task.maxPoints);
  const safeUrl = sanitizeUrl(dashboardUrl);

  const deadlineStr = new Date(task.deadline).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const safeDeadlineStr = escapeHtml(deadlineStr);

  const html = `
    <div style="${baseEmailStyle}">
      <div style="${cardStyle}">
        <div style="${headerStyle}">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">HackKro Internship Management</h2>
          <span style="display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-top: 8px;">
            NEW TASK ASSIGNMENT
          </span>
        </div>
        <div style="${bodyStyle}">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${safeInternName}</strong>,</p>
          <p>A new assignment has been assigned to you by your program instructor.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px;">${safeTitle}</h3>
            <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">${safeDescription}</p>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Task Type:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; text-transform: capitalize;">${safeTaskType} Assignment</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Maximum Score:</strong></td>
                <td style="padding: 6px 0; color: #059669; font-weight: bold;">${safeMaxPoints} Points</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Deadline:</strong></td>
                <td style="padding: 6px 0; color: #dc2626; font-weight: 600;">${safeDeadlineStr}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #475569;">
            When ready, submit your public GitHub repository URL directly via your intern workspace.
          </p>

          <a href="${safeUrl}" style="${buttonStyle}">
            Go to Intern Workspace →
          </a>
        </div>
        <div style="${footerStyle}">
          HackKro Internship Management System &copy; ${new Date().getFullYear()} — Automated Notification
        </div>
      </div>
    </div>
  `;

  const text = `
New Task Assigned: ${task.title}

Hello ${internName},

A new assignment has been assigned to you:
- Title: ${task.title}
- Description: ${task.description}
- Type: ${task.taskType}
- Maximum Points: ${task.maxPoints}
- Deadline: ${deadlineStr}

Access your workspace to view details and submit:
${dashboardUrl}
  `.trim();

  return { html, text };
};

/**
 * Template for Task Submission Notification (To Admin)
 */
export const taskSubmissionTemplate = ({ internName, internEmail, task, submission, dashboardUrl }) => {
  const safeInternName = escapeHtml(internName);
  const safeInternEmail = escapeHtml(internEmail);
  const safeTitle = escapeHtml(task.title);
  const safeGithubUrl = sanitizeUrl(submission.githubUrl);
  const safeGithubDisplay = escapeHtml(submission.githubUrl);
  const safeMaxPoints = escapeHtml(task.maxPoints);
  const safeNotes = escapeHtml(submission.submissionNotes);
  const safeUrl = sanitizeUrl(dashboardUrl);

  const submittedAtStr = new Date(submission.submittedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const safeSubmittedAtStr = escapeHtml(submittedAtStr);

  const html = `
    <div style="${baseEmailStyle}">
      <div style="${cardStyle}">
        <div style="${headerStyle}">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">HackKro Internship Management</h2>
          <span style="display: inline-block; background-color: #451a03; color: #fbbf24; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-top: 8px;">
            NEW TASK SUBMISSION
          </span>
        </div>
        <div style="${bodyStyle}">
          <p style="font-size: 16px; margin-top: 0;">Admin Review Required,</p>
          <p>Intern <strong>${safeInternName}</strong> (${safeInternEmail}) has submitted their solution for review.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px;">${safeTitle}</h3>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>GitHub URL:</strong></td>
                <td style="padding: 6px 0;"><a href="${safeGithubUrl}" style="color: #059669; font-family: monospace;">${safeGithubDisplay}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Submitted At:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">${safeSubmittedAtStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Max Score:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${safeMaxPoints} Points</td>
              </tr>
              ${
                safeNotes
                  ? `<tr>
                      <td style="padding: 6px 0; color: #64748b; vertical-align: top;"><strong>Notes:</strong></td>
                      <td style="padding: 6px 0; color: #334155; font-style: italic;">"${safeNotes}"</td>
                    </tr>`
                  : ''
              }
            </table>
          </div>

          <a href="${safeUrl}" style="${buttonStyle}">
            Open Admin Review Queue →
          </a>
        </div>
        <div style="${footerStyle}">
          HackKro Internship Management System &copy; ${new Date().getFullYear()} — Administrator Alert
        </div>
      </div>
    </div>
  `;

  const text = `
New Task Submission: ${task.title}

Intern: ${internName} (${internEmail})
Task: ${task.title}
GitHub Repository: ${submission.githubUrl}
Submitted At: ${submittedAtStr}
Notes: ${submission.submissionNotes || 'None'}

Review this submission on the admin dashboard:
${dashboardUrl}
  `.trim();

  return { html, text };
};

/**
 * Template for Task Evaluation Notification (To Intern)
 */
export const taskEvaluationTemplate = ({ internName, task, submission, dashboardUrl }) => {
  const isApproved = submission.status === 'approved';
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusBadgeBg = isApproved ? '#064e3b' : '#450a0a';
  const statusBadgeText = isApproved ? '#34d399' : '#f87171';
  const statusLabel = isApproved ? 'APPROVED' : 'REVISION REQUESTED';

  const safeInternName = escapeHtml(internName);
  const safeTitle = escapeHtml(task.title);
  const safePointsAwarded = escapeHtml(submission.pointsAwarded);
  const safeMaxPoints = escapeHtml(task.maxPoints);
  const safeFeedback = escapeHtml(submission.feedback);
  const safeUrl = sanitizeUrl(dashboardUrl);

  const reviewedAtStr = new Date(submission.reviewedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const safeReviewedAtStr = escapeHtml(reviewedAtStr);

  const html = `
    <div style="${baseEmailStyle}">
      <div style="${cardStyle}">
        <div style="${headerStyle}">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">HackKro Internship Management</h2>
          <span style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeText}; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px; margin-top: 8px;">
            EVALUATION DECISION: ${statusLabel}
          </span>
        </div>
        <div style="${bodyStyle}">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${safeInternName}</strong>,</p>
          <p>Your submission for <strong>${safeTitle}</strong> has been reviewed by your administrator.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: ${statusColor}; font-weight: bold;">${statusLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Score Awarded:</strong></td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: bold; font-family: monospace; font-size: 16px;">
                  ${safePointsAwarded} / ${safeMaxPoints} Points
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Reviewed At:</strong></td>
                <td style="padding: 8px 0; color: #475569;">${safeReviewedAtStr}</td>
              </tr>
            </table>

            ${
              safeFeedback
                ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                    <strong style="color: #0f172a; font-size: 13px;">Instructor Feedback:</strong>
                    <p style="margin: 6px 0 0 0; color: #334155; font-style: italic; font-size: 14px;">
                      "${safeFeedback}"
                    </p>
                  </div>`
                : ''
            }
          </div>

          <p style="font-size: 14px; color: #475569;">
            ${
              isApproved
                ? 'Your points have been added to your cumulative points tracker!'
                : 'Please review the instructor feedback above and resubmit your updated code.'
            }
          </p>

          <a href="${safeUrl}" style="${buttonStyle}">
            Open Intern Workspace →
          </a>
        </div>
        <div style="${footerStyle}">
          HackKro Internship Management System &copy; ${new Date().getFullYear()} — Automated Evaluation Notification
        </div>
      </div>
    </div>
  `;

  const text = `
Task Evaluation: ${task.title}

Hello ${internName},

Your submission has been evaluated:
- Status: ${statusLabel}
- Points Awarded: ${submission.pointsAwarded} / ${task.maxPoints}
- Reviewed At: ${reviewedAtStr}
- Feedback: ${submission.feedback || 'None'}

Access your workspace to view points breakdown:
${dashboardUrl}
  `.trim();

  return { html, text };
};
