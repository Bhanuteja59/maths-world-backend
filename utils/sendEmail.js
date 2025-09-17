// utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

// ✅ Create and reuse transporter (avoid reconnecting each time)
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password (NOT normal password)
      },
    });

    // Verify connection once at startup
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Email server not ready:", error);
      } else {
        console.log("✅ Email server ready to send messages");
      }
    });
  }
  return transporter;
}

// ✅ Send email function
async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: `"Maths-World" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  return getTransporter().sendMail(mailOptions);
}

module.exports = sendEmail;
