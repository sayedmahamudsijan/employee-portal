import nodemailer from "nodemailer";

/** Lazily create the Gmail SMTP transporter */
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER and GMAIL_APP_PASSWORD must be set to enable email sending."
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const FROM_NAME = "MBD Portal";
const PORTAL_URL = process.env.NEXTAUTH_URL ?? "https://employee-portal-flame.vercel.app";

// ─── Invitation Email ──────────────────────────────────────────────────────────

export interface InvitationEmailData {
  toEmail:     string;
  toName:      string;
  position:    string;
  employeeId:  string;
  accessCode:  string; // plain code (not hash)
  sentByName:  string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { toEmail, toName, position, employeeId, accessCode, sentByName } = data;
  const fromEmail = process.env.GMAIL_USER ?? "metabuilddynamics@gmail.com";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MBD Portal</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#93c5fd;letter-spacing:1px;text-transform:uppercase;">Meta Build Dynamics</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">Welcome to the Team!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                Hi <strong>${toName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                Congratulations! You have been invited to join the <strong>MBD Employee Portal</strong> as
                <strong>${position}</strong>. Your account has been set up by <strong>${sentByName}</strong>.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px;">Your Portal Credentials</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;width:120px;">Username</td>
                        <td style="padding:6px 0;font-size:15px;color:#111827;font-weight:700;font-family:monospace;">${employeeId}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#6b7280;">Access Code</td>
                        <td style="padding:6px 0;font-size:22px;color:#1d4ed8;font-weight:700;font-family:monospace;letter-spacing:4px;">${accessCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">How to get started:</p>
              <ol style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
                <li>Click the <strong>Access Portal</strong> button below.</li>
                <li>Sign in with your Google account: <strong>${toEmail}</strong></li>
                <li>Enter your <strong>Username</strong> (Employee ID) and <strong>Access Code</strong> when prompted.</li>
                <li>You're in! Your profile will be fully activated.</li>
              </ol>

              <!-- CTA -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${PORTAL_URL}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">Access MBD Portal →</a>
              </div>

              <!-- Security note -->
              <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#713f12;line-height:1.5;">
                  <strong>🔒 Security note:</strong> Keep your access code private. If you need to reset your access code,
                  please contact your administrator (<strong>CEO / CMO / CTO</strong>). Do not share these credentials with anyone.
                </p>
              </div>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you believe you received this email by mistake, please ignore it or contact your HR team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Meta Build Dynamics &bull; Employee Operations Platform<br/>
                This is an automated message sent from ${fromEmail}. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return getTransporter().sendMail({
    from:    `"${FROM_NAME}" <${fromEmail}>`,
    to:      `"${toName}" <${toEmail}>`,
    subject: `Welcome to MBD Portal – Your Access Credentials`,
    html,
  });
}

// ─── Reset Code Email ──────────────────────────────────────────────────────────

export interface ResetCodeEmailData {
  toEmail:     string;
  toName:      string;
  employeeId:  string;
  accessCode:  string;
  resetByName: string;
}

export async function sendResetCodeEmail(data: ResetCodeEmailData) {
  const { toEmail, toName, employeeId, accessCode, resetByName } = data;
  const fromEmail = process.env.GMAIL_USER ?? "metabuilddynamics@gmail.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Access Code Reset – MBD Portal</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#dc2626;padding:28px 36px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Access Code Reset</h1>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 14px;font-size:15px;color:#374151;">Hi <strong>${toName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Your MBD Portal access code has been reset by <strong>${resetByName}</strong>.
            Use the new credentials below to sign in.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:24px;">
            <tr><td style="padding:18px 22px;">
              <table width="100%">
                <tr>
                  <td style="font-size:13px;color:#6b7280;width:120px;">Username</td>
                  <td style="font-size:15px;font-weight:700;font-family:monospace;">${employeeId}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6b7280;padding-top:6px;">New Access Code</td>
                  <td style="font-size:22px;color:#1d4ed8;font-weight:700;font-family:monospace;letter-spacing:4px;padding-top:6px;">${accessCode}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <div style="text-align:center;margin:20px 0;">
            <a href="${PORTAL_URL}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Sign In to MBD Portal</a>
          </div>
          <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not request this reset, contact your administrator immediately.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Meta Build Dynamics &bull; Employee Operations Platform<br/>
            Sent from ${fromEmail}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return getTransporter().sendMail({
    from:    `"${FROM_NAME}" <${fromEmail}>`,
    to:      `"${toName}" <${toEmail}>`,
    subject: `MBD Portal – Your Access Code Has Been Reset`,
    html,
  });
}
