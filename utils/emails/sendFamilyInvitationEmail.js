const resend = require("../../config/resend");

async function sendFamilyInvitationMail({
  email,
  seniorFirstName,
  guardianFirstName,
  relationship,
  linkId,
}) {
  try {
    console.log(
      "Sending family invitation email to:",
      email
    );

    // Change this to the actual page in your app
    const invitationUrl =
      `https://erranzo.com/family/invitation/${linkId}`;

    const response = await resend.emails.send({
      from: "Erranzo <no-reply@erranzo.com>",
      to: [email],
      subject: "You Have a Family Account Invitation",
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
                  Family Account Invitation
                </h2>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Hello ${seniorFirstName},
                </p>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  <strong>${guardianFirstName}</strong>
                  has invited you to connect with them
                  on Erranzo as a family member.
                </p>


                <!-- Relationship -->
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
                    Relationship
                  </p>

                  <p
                    style="
                      margin:0;
                      color:#111827;
                      font-size:16px;
                      font-weight:600;
                    "
                  >
                    ${relationship}
                  </p>
                </div>


                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  If you accept this invitation, your accounts
                  will be linked. ${guardianFirstName} will then
                  be able to book and manage errands on your
                  behalf through their Guardian account.
                </p>


                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Errands booked on your behalf will appear
                  under your account, while ${guardianFirstName}
                  will handle the payment for those errands.
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
                    Review Invitation
                  </a>
                </div>


                <p
                  style="
                    color:#6b7280;
                    font-size:13px;
                    line-height:1.6;
                  "
                >
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

    console.log(
      "RESEND RESPONSE:",
      response
    );

    return response;

  } catch (error) {
    console.error(
      "RESEND ERROR:",
      error
    );

    throw error;
  }
}

module.exports = sendFamilyInvitationMail;
