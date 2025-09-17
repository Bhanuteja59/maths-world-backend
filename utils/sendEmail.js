const nodemailer = require("nodemailer");

async function sendEmail(to, subject, textOrHtml) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // your App Password
    },
  });

  const mailOptions = {
    from: `"Maths-World " <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: typeof textOrHtml === "string" ? textOrHtml : "",
    text: textOrHtml,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;
