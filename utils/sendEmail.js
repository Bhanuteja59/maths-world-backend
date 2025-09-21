const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    transporter.verify((err, success) => {
      if (err) console.error("Email server error:", err);
      else console.log("Email server ready ✅");
    });
  }
  return transporter;
}

async function sendEmail(to, subject, html) {
  return getTransporter().sendMail({
    from: `"Maths-World" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
