const resend = require("../../config/resend");

async function sendCorporateInvitationMail({
  email,
  firstName,
  companyName,
  role,
  token,
  inviteExpiresAt,
}) {
  try {
    console.log("Sending corporate invitation email to:", email);

    const invitationUrl =
      `https://erranzo.com/corporate/invite/${token}`;

    const response = await resend.emails.send({
      from: "Erranzo <no-reply@erranzo.com>",
      to: [email],
      subject: `You're Invited to Join ${companyName} on Erranzo`,
      html: `
        <div style="background-color:#f4f6f8;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
          
          <table
            align="center"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width:600px;
              background:#ffffff;
              border-radius:8px;
              overflow:hidden;
            "
          >

            <!-- Header -->
            <tr>
              <td
                style="
                  padding:30px;
                  text-align:center;
                  background:#111827;
                  color:#ffffff;
                "
              >
                <h1
                  style="
                    margin:0;
                    font-size:24px;
                  "
                >
                  Erranzo
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:40px 30px;">

                <h2
                  style="
                    margin-top:0;
                    color:#111827;
                  "
                >
                  Corporate Account Invitation
                </h2>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Hello ${firstName},
                </p>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  You have been invited to join
                  <strong>${companyName}</strong>
                  on Erranzo as an employee.
                </p>

                <!-- Invitation Details -->
                <div
                  style="
                    margin:25px 0;
                    padding:20px;
                    background:#f9fafb;
                    border:1px solid #e5e7eb;
                    border-radius:8px;
                  "
                >

                  <p
                    style="
                      margin:0 0 8px;
                      color:#6b7280;
                      font-size:13px;
                    "
                  >
                    Company
                  </p>

                  <p
                    style="
                      margin:0 0 18px;
                      color:#111827;
                      font-size:16px;
                      font-weight:600;
                    "
                  >
                    ${companyName}
                  </p>

                  <p
                    style="
                      margin:0 0 8px;
                      color:#6b7280;
                      font-size:13px;
                    "
                  >
                    Role
                  </p>

                  <p
                    style="
                      margin:0;
                      color:#111827;
                      font-size:16px;
                      font-weight:600;
                      text-transform:capitalize;
                    "
                  >
                    ${role}
                  </p>

                </div>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Accept this invitation to join your company's
                  Erranzo account and access the features available
                  to you as an employee.
                </p>

                <!-- Button -->
                <div
                  style="
                    margin:30px 0;
                    text-align:center;
                  "
                >
                  <a
                    href="${invitationUrl}"
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
                    Accept Invitation
                  </a>
                </div>

                <p
                  style="
                    color:#6b7280;
                    font-size:13px;
                    line-height:1.6;
                  "
                >
                  This invitation will expire in 48 hours.
                  If you did not expect this invitation,
                  you can safely ignore this email.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding:20px 30px;
                  text-align:center;
                  font-size:12px;
                  color:#9ca3af;
                  border-top:1px solid #e5e7eb;
                "
              >
                © ${new Date().getFullYear()}
                Erranzo. All rights reserved.
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

module.exports = sendCorporateInvitationMail;
