const transporter = require('./transporter');

require('dotenv').config();


const sendResetEmail = async (email, resetUrl) => {
  return transporter.sendMail({
    from: `"Erranzo Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password. This link will expire in 15 minutes.</p>
          <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        `,
  });
};

module.exports = sendResetEmail;
