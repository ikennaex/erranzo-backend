const resend = require("../../config/resend");

async function sendVerificationMail({ email, verificationCode }) {
  try {
    console.log("Sending verification email to:", email);

    const response = await resend.emails.send({
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
                  Thank you for creating an account with Erranzo. To complete your registration, please use the verification code below.
                </p>

                <div style="margin:30px 0;text-align:center;">
                  <div
                    style="
                      display:inline-block;
                      background:#f3f4f6;
                      border:1px solid #e5e7eb;
                      border-radius:8px;
                      padding:16px 32px;
                      font-size:32px;
                      font-weight:700;
                      letter-spacing:8px;
                      color:#111827;
                    "
                  >
                    ${verificationCode}
                  </div>
                </div>

                <p style="color:#4b5563;font-size:15px;line-height:1.6;">
                  Enter this code in the app to verify your email address.
                </p>

                <p style="margin-top:20px;color:#6b7280;font-size:13px;line-height:1.6;">
                  This verification code will expire in 10 minutes.
                </p>

                <p style="margin-top:20px;color:#6b7280;font-size:13px;line-height:1.6;">
                  If you did not create an account with Erranzo, you can safely ignore this email.
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

module.exports = sendVerificationMail;