const nodemailer = require("nodemailer");
require('dotenv').config();

// using mailer gun for now upgrade later
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,           // use TLS, not SSL
  secure: false,       // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // must be a Gmail App Password
  },
});


module.exports = transporter;
