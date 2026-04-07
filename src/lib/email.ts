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
