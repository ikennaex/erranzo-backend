const nodemailer = require("nodemailer");
require('dotenv').config();

// using mailer gun for now upgrade later
const transporter = nodemailer.createTransport({
    service: "Gmail", // remember to change this to mailgun or send grid - ikenna nevermind, using mailer send
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;
