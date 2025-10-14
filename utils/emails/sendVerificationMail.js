const transporter = require("./transporter");

require('dotenv').config();

const sendVerificationMail = async (to, verifyURL) => {
  return transporter.sendMail({
    from: `"Erranzo" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify Your Email",
    html: `
      <h2>Welcome!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyURL}">Verify Email</a>
      <br/><br/>
      <small>This link expires in 3 hours.</small>
    `,
  });
};

module.exports = sendVerificationMail;
