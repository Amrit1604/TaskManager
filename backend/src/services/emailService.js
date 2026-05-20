/**
 * services/emailService.js
 * Optional email notifications via Nodemailer.
 * Feature is DISABLED if SMTP_HOST env var is not set — the app works fine without it.
 */
const nodemailer = require('nodemailer');

let transporter = null;

// Only initialize transport if SMTP credentials are configured
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[Email] SMTP transport initialized');
} else {
  console.log('[Email] SMTP not configured — email notifications disabled');
}

const EmailService = {
  /**
   * Send task assignment notification to the assignee.
   * Silently skips if SMTP is not configured.
   */
  async notifyTaskAssigned({ assigneeEmail, assigneeName, taskTitle, projectName, dueDate, assignedByName }) {
    if (!transporter) return;

    const dueDateStr = dueDate
      ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'No due date';

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Task Manager <noreply@taskmanager.app>',
        to: `${assigneeName} <${assigneeEmail}>`,
        subject: `[Task Manager] You have been assigned: "${taskTitle}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">New Task Assigned</h2>
            <p>Hi <strong>${assigneeName}</strong>,</p>
            <p><strong>${assignedByName}</strong> has assigned you a task in the project <strong>${projectName}</strong>.</p>
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Task</strong></td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${taskTitle}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>Due Date</strong></td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${dueDateStr}</td></tr>
            </table>
            <p>Log in to Task Manager to view and update your task.</p>
          </div>
        `,
      });
    } catch (err) {
      // Log but don't crash the request if email fails
      console.error('[Email] Failed to send assignment notification:', err.message);
    }
  },
};

module.exports = EmailService;
