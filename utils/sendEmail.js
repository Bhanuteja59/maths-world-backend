const nodemailer = require("nodemailer");

// Create transporter once (reused for all mails)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

async function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: `"Maths-World" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ""), // plain text fallback
  });
}

module.exports = sendEmail;
