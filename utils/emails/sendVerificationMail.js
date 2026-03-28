const resend = require("../../config/resend");

async function sendVerificationMail({ email, verifyURL }) {
  return await resend.emails.send({
    from: "Erranzo <no-reply@erranzo.com>",
    to: [email],
    subject: "Verify Your Email Address",
    html: `
      <div style="background-color:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
          
          <tr>
            <td style="padding:30px;text-align:center;background:#111827;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;">Erranzo</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin-top:0;color:#111827;">Verify Your Email</h2>

              <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                Hello,
              </p>

              <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                Thank you for creating an account with Erranzo. Please verify your email address by clicking the button below.
              </p>

              <div style="margin-top:30px;text-align:center;">
                <a href="${verifyURL}" 
                   style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">
                   Verify Email
                </a>
              </div>

              <p style="margin-top:30px;color:#6b7280;font-size:13px;line-height:1.6;">
                If the button above does not work, copy and paste this link into your browser:
              </p>

              <p style="word-break:break-all;color:#2563eb;font-size:13px;">
                ${verifyURL}
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:20px 30px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
              © ${new Date().getFullYear()} Erranzo. All rights reserved.
            </td>
          </tr>

        </table>
      </div>
    `,
  });
}

module.exports = sendVerificationMail;