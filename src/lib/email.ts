import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Welcome to LinkMind!",
    html: `
      <h1>Welcome to LinkMind, ${name}!</h1>
      <p>Thanks for signing up. Start saving and organizing your links with AI-powered summaries.</p>
      <p><a href="${process.env.NEXTAUTH_URL}">Get started</a></p>
    `,
  });
}

export interface NotificationLink {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  savedDaysAgo: number;
}

export async function sendNotificationEmail(
  to: string,
  name: string,
  links: NotificationLink[]
) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  const linkCards = links
    .map(
      (link) => `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;">
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;">
        You saved this ${link.savedDaysAgo} day${link.savedDaysAgo === 1 ? "" : "s"} ago
      </p>
      <h3 style="margin:0 0 8px;font-size:16px;">
        <a href="${link.url}" style="color:#2563eb;text-decoration:none;">
          ${link.title ?? link.url}
        </a>
      </h3>
      ${
        link.summary
          ? `<p style="margin:0;font-size:14px;color:#475569;">${link.summary}</p>`
          : ""
      }
    </div>
  `
    )
    .join("");

  return sendEmail({
    to,
    subject: "🔖 Links you haven't visited lately",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Hey ${name}, rediscover your saved links!</h1>
        <p style="color:#475569;margin-bottom:24px;">
          Here are a few links you saved but haven't visited recently. Give them another look!
        </p>
        ${linkCards}
        <p style="margin-top:24px;">
          <a href="${baseUrl}/dashboard"
             style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;">
            Open Dashboard
          </a>
        </p>
        <p style="margin-top:16px;font-size:12px;color:#94a3b8;">
          You received this email because you have a LinkHelper account.
        </p>
      </div>
    `,
  });
}
