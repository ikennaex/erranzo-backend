const resend = require("../../config/resend");

async function sendResetEmail({ email, resetUrl }) {
  try {
    console.log("Sending password reset email to:", email);

    const response = await resend.emails.send({
      from: "Erranzo <no-reply@erranzo.com>",
      to: [email],
      subject: "Reset Your Erranzo Password",
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
                <h2 style="margin-top:0;color:#111827;">
                  Reset Your Password
                </h2>

                <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                  Hello,
                </p>

                <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                  We received a request to reset your Erranzo account password.
                  Click the button below to create a new password.
                </p>

                <div style="margin:30px 0;text-align:center;">
                  <a
                    href="${resetUrl}"
                    target="_blank"
                    style="
                      display:inline-block;
                      background:#111827;
                      color:#ffffff;
                      text-decoration:none;
                      padding:14px 28px;
                      border-radius:8px;
                      font-size:15px;
                      font-weight:600;
                    "
                  >
                    Reset Your Password
                  </a>
                </div>

                <p style="color:#6b7280;font-size:13px;line-height:1.6;">
                  This password reset link will expire in 15 minutes.
                </p>

                <p style="color:#6b7280;font-size:13px;line-height:1.6;">
                  If the button above doesn't work, copy and paste the following
                  link into your browser:
                </p>

                <p style="word-break:break-all;font-size:13px;">
                  <a href="${resetUrl}" target="_blank" style="color:#2563eb;">
                    ${resetUrl}
                  </a>
                </p>

                <p style="margin-top:20px;color:#6b7280;font-size:13px;line-height:1.6;">
                  If you did not request a password reset, you can safely ignore
                  this email.
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

    console.log("RESEND RESPONSE:", response);

    return response;
  } catch (error) {
    console.error("RESEND ERROR:", error);
    throw error;
  }
}

module.exports = sendResetEmail;