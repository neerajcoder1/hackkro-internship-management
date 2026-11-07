import { Resend } from 'resend';
import {
  taskAssignmentTemplate,
  taskSubmissionTemplate,
  taskEvaluationTemplate,
} from './emailTemplates.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory deduplication set to avoid sending duplicate notifications within process
const sentNotifications = new Set();

// Mock / testing storage for integration tests
let isMockMode = process.env.NODE_ENV === 'test';
const mockSentEmails = [];

/**
 * Validates email address format
 */
const isValidEmail = (email) => {
  return typeof email === 'string' && emailRegex.test(email.trim());
};

/**
 * Gets or initializes the Resend client safely
 */
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_your_')) {
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Internal email dispatch wrapper with error isolation and deduplication
 */
const sendEmail = async ({ to, subject, html, text, deduplicationKey }) => {
  if (!to || !isValidEmail(to)) {
    console.warn(`[EmailService] Invalid recipient email address: "${to}". Email delivery skipped.`);
    return { success: false, reason: 'INVALID_RECIPIENT' };
  }

  // Deduplication check
  if (deduplicationKey && sentNotifications.has(deduplicationKey)) {
    console.warn(`[EmailService] Notification with key "${deduplicationKey}" was already sent. Skipping duplicate.`);
    return { success: false, reason: 'DUPLICATE_NOTIFICATION' };
  }

  const from = process.env.EMAIL_FROM || 'HackKro Internship <onboarding@resend.dev>';

  // In test/mock mode, record email and return success
  if (isMockMode) {
    const record = {
      to,
      from,
      subject,
      html,
      text,
      deduplicationKey,
      sentAt: new Date(),
    };
    mockSentEmails.push(record);
    if (deduplicationKey) sentNotifications.add(deduplicationKey);
    return { success: true, mock: true, id: `mock_${Date.now()}` };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn('[EmailService] RESEND_API_KEY is not configured or using placeholder. Email skipped in development.');
    return { success: false, reason: 'NO_API_KEY' };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      console.error(`[EmailService] Resend API error: ${result.error.message || result.error}`);
      return { success: false, error: result.error };
    }

    if (deduplicationKey) {
      sentNotifications.add(deduplicationKey);
    }

    console.log(`[EmailService] Successfully sent email to ${to} (Subject: "${subject}")`);
    return { success: true, id: result.data?.id };
  } catch (error) {
    // Log failure without corrupting outer transaction
    console.error(`[EmailService] Delivery failure: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Task Assignment Workflow
 * Recipient: Assigned intern
 */
export const sendTaskAssignmentEmail = async ({ intern, task }) => {
  try {
    if (!intern || !task) return { success: false };

    const deduplicationKey = `assign_${task._id}_${intern._id}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const dashboardUrl = `${frontendUrl}/intern`;

    const { html, text } = taskAssignmentTemplate({
      internName: intern.name,
      task,
      dashboardUrl,
    });

    return await sendEmail({
      to: intern.email,
      subject: `New Task Assigned: ${task.title}`,
      html,
      text,
      deduplicationKey,
    });
  } catch (err) {
    console.error(`[EmailService] sendTaskAssignmentEmail error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * 2. Task Submission Workflow
 * Recipient: Admin
 */
export const sendTaskSubmissionEmail = async ({ intern, task, submission }) => {
  try {
    if (!intern || !task || !submission) return { success: false };

    const deduplicationKey = `submission_${submission._id}`;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@hackkro.com';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const dashboardUrl = `${frontendUrl}/admin`;

    const { html, text } = taskSubmissionTemplate({
      internName: intern.name,
      internEmail: intern.email,
      task,
      submission,
      dashboardUrl,
    });

    return await sendEmail({
      to: adminEmail,
      subject: `New Submission: ${task.title} by ${intern.name}`,
      html,
      text,
      deduplicationKey,
    });
  } catch (err) {
    console.error(`[EmailService] sendTaskSubmissionEmail error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * 3. Task Evaluation Workflow
 * Recipient: Intern
 */
export const sendTaskEvaluationEmail = async ({ intern, task, submission }) => {
  try {
    if (!intern || !task || !submission) return { success: false };

    const deduplicationKey = `eval_${submission._id}_${submission.status}_${submission.pointsAwarded}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const dashboardUrl = `${frontendUrl}/intern`;

    const { html, text } = taskEvaluationTemplate({
      internName: intern.name,
      task,
      submission,
      dashboardUrl,
    });

    const statusTitle = submission.status === 'approved' ? 'Approved' : 'Needs Revision';

    return await sendEmail({
      to: intern.email,
      subject: `Task ${statusTitle}: ${task.title}`,
      html,
      text,
      deduplicationKey,
    });
  } catch (err) {
    console.error(`[EmailService] sendTaskEvaluationEmail error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// Test helper methods
export const __emailTestHelpers = {
  setMockMode: (val) => {
    isMockMode = val;
  },
  getMockSentEmails: () => [...mockSentEmails],
  clearMockSentEmails: () => {
    mockSentEmails.length = 0;
    sentNotifications.clear();
  },
};
