const nodemailer = require("nodemailer")

// ── Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

// ========================
// BASE TEMPLATE
// ========================
function baseTemplate(content){
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; padding:20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #DC2626, #7F1D1D); border-radius:16px 16px 0 0; padding:32px 40px; text-align:center;">
      <div style="font-size:36px; margin-bottom:8px;">🏛️</div>
      <h1 style="margin:0; color:white; font-size:22px; font-weight:700; letter-spacing:0.5px;">
        City Hall Financial Assistance
      </h1>
      <p style="margin:6px 0 0; color:#FCA5A5; font-size:13px;">
        Official Notification
      </p>
    </div>

    <!-- Content -->
    <div style="background:white; padding:40px; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 16px 16px; padding:20px 40px; text-align:center;">
      <p style="margin:0 0 4px; color:#6b7280; font-size:12px;">
        This is an automated message. Please do not reply to this email.
      </p>
      <p style="margin:0; color:#9ca3af; font-size:11px;">
        City Hall Financial Assistance Portal — Service for the Community
      </p>
    </div>

  </div>

</body>
</html>
  `
}

// ── Info row helper
function infoRow(label, value, valueColor){
  return `
    <tr>
      <td style="padding:10px 0; color:#6b7280; font-size:14px; width:45%; border-bottom:1px solid #f3f4f6;">
        ${label}
      </td>
      <td style="padding:10px 0; font-weight:600; font-size:14px; color:${valueColor || "#1f2937"}; border-bottom:1px solid #f3f4f6;">
        ${value}
      </td>
    </tr>
  `
}

// ========================
// SUBMISSION CONFIRMATION
// ========================
async function sendSubmissionEmail(email, data){
  if(!email) return false

  try {
    const content = `
      <!-- Status Badge -->
      <div style="background:#fef9c3; border:1px solid #fde68a; border-radius:12px; padding:16px 20px; margin-bottom:28px; display:flex; align-items:center; gap:12px;">
        <span style="font-size:28px;">📋</span>
        <div>
          <p style="margin:0; font-weight:700; color:#92400e; font-size:16px;">Application Received</p>
          <p style="margin:4px 0 0; color:#b45309; font-size:13px;">Your application is under review</p>
        </div>
      </div>

      <p style="color:#374151; font-size:15px; line-height:1.6; margin-bottom:24px;">
        Dear <strong>${data.name}</strong>,<br><br>
        Your financial assistance application has been successfully submitted to City Hall.
        Please keep your reference number safe — you will need it to track your application status.
      </p>

      <!-- Reference Number Box -->
      <div style="background:linear-gradient(135deg, #DC2626, #7F1D1D); border-radius:12px; padding:24px; text-align:center; margin-bottom:28px;">
        <p style="margin:0 0 4px; color:#FCA5A5; font-size:12px; text-transform:uppercase; letter-spacing:1px;">
          Your Reference Number
        </p>
        <p style="margin:0; color:white; font-size:32px; font-weight:800; letter-spacing:3px;">
          ${data.referenceNumber}
        </p>
      </div>

      <!-- Details Table -->
      <div style="background:#f9fafb; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
        <p style="margin:0 0 12px; font-weight:700; color:#DC2626; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">
          Application Details
        </p>
        <table style="width:100%; border-collapse:collapse;">
          ${infoRow("Assistance Type", data.assistanceType)}
          ${infoRow("Status", "⏳ PENDING REVIEW", "#D97706")}
          ${infoRow("Date Submitted", new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }))}
        </table>
      </div>

      <!-- Info Box -->
      <div style="background:#eff6ff; border-left:4px solid #2563EB; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:24px;">
        <p style="margin:0; color:#1e40af; font-size:14px; line-height:1.6;">
          📱 <strong>What happens next?</strong><br>
          City Hall staff will review your application. You will receive an SMS and email
          notification once a decision has been made.
        </p>
      </div>

      <p style="color:#6b7280; font-size:13px; margin:0;">
        If you have any questions, please visit City Hall during office hours (Monday–Friday, 8:00 AM – 5:00 PM).
      </p>
    `

    await transporter.sendMail({
      from:    '"City Hall Financial Assistance" <' + process.env.GMAIL_USER + '>',
      to:      email,
      subject: "📋 Application Received — " + data.referenceNumber,
      html:    baseTemplate(content)
    })

    console.log("✅ Submission email sent to:", email)
    return true

  } catch(err){
    console.error("❌ Email error:", err.message)
    return false
  }
}

// ========================
// APPROVAL EMAIL
// ========================
async function sendApprovalEmail(email, data){
  if(!email) return false

  try {
    const content = `
      <!-- Status Badge -->
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px 20px; margin-bottom:28px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">✅</span>
          <div>
            <p style="margin:0; font-weight:700; color:#166534; font-size:16px;">Application Approved!</p>
            <p style="margin:4px 0 0; color:#16a34a; font-size:13px;">Congratulations! Your application has been approved.</p>
          </div>
        </div>
      </div>

      <p style="color:#374151; font-size:15px; line-height:1.6; margin-bottom:24px;">
        Dear <strong>${data.name}</strong>,<br><br>
        We are pleased to inform you that your financial assistance application
        has been <strong style="color:#16A34A;">APPROVED</strong> by City Hall.
      </p>

  <!-- Amount Box -->
      <div style="background-color:#16A34A; background:#16A34A; border-radius:12px; padding:24px; text-align:center; margin-bottom:28px;">
        <p style="margin:0 0 4px; color:#ffffff; font-size:12px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">
          Approved Amount
        </p>
        <p style="margin:0; color:#ffffff; font-size:40px; font-weight:800;">
          ₱${Number(data.approvedAmount).toLocaleString()}
        </p>
        <p style="margin:8px 0 0; color:#ffffff; font-size:13px; font-weight:600;">
          📅 Claim on: <strong>${data.payDate}</strong>
        </p>
      </div>

      <!-- Details Table -->
      <div style="background:#f9fafb; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
        <p style="margin:0 0 12px; font-weight:700; color:#DC2626; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">
          Application Details
        </p>
        <table style="width:100%; border-collapse:collapse;">
          ${infoRow("Reference Number", data.referenceNumber)}
          ${infoRow("Assistance Type", data.assistanceType)}
          ${infoRow("Approved Amount", "₱" + Number(data.approvedAmount).toLocaleString(), "#16A34A")}
          ${infoRow("Pay Date", "📅 " + data.payDate, "#2563EB")}
          ${infoRow("Status", "✅ APPROVED", "#16A34A")}
        </table>
      </div>

      <!-- Important Instructions -->
      <div style="background:#fef9c3; border-left:4px solid #CA8A04; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:24px;">
        <p style="margin:0 0 8px; font-weight:700; color:#854D0E; font-size:14px;">
          ⚠️ Important Instructions:
        </p>
        <ul style="color: #854D0E; font-size: 14px; margin: 10px 0 0; padding-left: 20px;">
          <li>Visit City Hall on <strong>${data.payDate}</strong></li>
          ${data.timeSlot ? `<li>Your time slot: <strong>${data.timeSlot}</strong></li>` : ""}
          ${data.batchName ? `<li>Your batch: <strong>${data.batchName}</strong></li>` : ""}
          <li>Bring a valid government-issued ID</li>
          <li>Present your reference number: <strong>${data.referenceNumber}</strong></li>
          <li>Please arrive on time — late arrivals may be rescheduled</li>
        </ul>
      </div>

      ${data.remarks ? `
        <div style="background:#eff6ff; border-left:4px solid #2563EB; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:24px;">
          <p style="margin:0; color:#1e40af; font-size:14px; line-height:1.6;">
            <strong>📝 Remarks from Staff:</strong><br>${data.remarks}
          </p>
        </div>
      ` : ""}

      <p style="color:#6b7280; font-size:13px; margin:0;">
        Congratulations again! We look forward to serving you at City Hall.
      </p>
    `

    await transporter.sendMail({
      from:    '"City Hall Financial Assistance" <' + process.env.GMAIL_USER + '>',
      to:      email,
      subject: "✅ Application Approved — " + data.referenceNumber,
      html:    baseTemplate(content)
    })

    console.log("✅ Approval email sent to:", email)
    return true

  } catch(err){
    console.error("❌ Email error:", err.message)
    return false
  }
}

// ========================
// REJECTION EMAIL
// ========================
async function sendRejectionEmail(email, data){
  if(!email) return false

  try {
    const content = `
      <!-- Status Badge -->
      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:16px 20px; margin-bottom:28px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">❌</span>
          <div>
            <p style="margin:0; font-weight:700; color:#991B1B; font-size:16px;">Application Not Approved</p>
            <p style="margin:4px 0 0; color:#DC2626; font-size:13px;">Your application was not approved at this time.</p>
          </div>
        </div>
      </div>

      <p style="color:#374151; font-size:15px; line-height:1.6; margin-bottom:24px;">
        Dear <strong>${data.name}</strong>,<br><br>
        We regret to inform you that your financial assistance application
        was <strong style="color:#DC2626;">NOT APPROVED</strong> at this time.
      </p>

      <!-- Details Table -->
      <div style="background:#f9fafb; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
        <p style="margin:0 0 12px; font-weight:700; color:#DC2626; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">
          Application Details
        </p>
        <table style="width:100%; border-collapse:collapse;">
          ${infoRow("Reference Number", data.referenceNumber)}
          ${infoRow("Status", "❌ NOT APPROVED", "#DC2626")}
          ${infoRow("Reason", data.rejectionReason || "Please visit City Hall for details.", "#374151")}
        </table>
      </div>

      <!-- Info Box -->
      <div style="background:#eff6ff; border-left:4px solid #2563EB; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:24px;">
        <p style="margin:0; color:#1e40af; font-size:14px; line-height:1.6;">
          💡 <strong>What can you do?</strong><br>
          If you believe this decision was made in error or you have additional
          documents to support your application, please visit City Hall during
          office hours for further assistance.
        </p>
      </div>

      <p style="color:#6b7280; font-size:13px; margin:0;">
        We apologize for any inconvenience. City Hall remains committed to serving the community.
      </p>
    `

    await transporter.sendMail({
      from:    '"City Hall Financial Assistance" <' + process.env.GMAIL_USER + '>',
      to:      email,
      subject: "Application Status Update — " + data.referenceNumber,
      html:    baseTemplate(content)
    })

    console.log("✅ Rejection email sent to:", email)
    return true

  } catch(err){
    console.error("❌ Email error:", err.message)
    return false
  }
}

// ========================
// PAID EMAIL
// ========================
async function sendPaidEmail(email, data){
  if(!email) return false

  try {
    const content = `
      <!-- Status Badge -->
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:16px 20px; margin-bottom:28px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">💵</span>
          <div>
            <p style="margin:0; font-weight:700; color:#1D4ED8; font-size:16px;">Assistance Released!</p>
            <p style="margin:4px 0 0; color:#2563EB; font-size:13px;">Your financial assistance has been successfully released.</p>
          </div>
        </div>
      </div>

      <p style="color:#374151; font-size:15px; line-height:1.6; margin-bottom:24px;">
        Dear <strong>${data.name}</strong>,<br><br>
        Your financial assistance has been <strong style="color:#1D4ED8;">successfully released</strong>.
        Thank you for availing the City Hall Financial Assistance Program.
      </p>

      <!-- Details Table -->
      <div style="background:#f9fafb; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
        <p style="margin:0 0 12px; font-weight:700; color:#DC2626; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">
          Transaction Details
        </p>
        <table style="width:100%; border-collapse:collapse;">
          ${infoRow("Reference Number", data.referenceNumber)}
          ${infoRow("Status", "💵 PAID", "#1D4ED8")}
          ${infoRow("Date Released", new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" }))}
        </table>
      </div>

      <!-- Thank you box -->
      <div style="background-color:#1D4ED8; background:#1D4ED8; border-radius:12px; padding:24px; text-align:center; margin-bottom:24px;">
        <p style="margin:0 0 8px; color:#ffffff; font-size:13px; font-weight:600;">
          Thank you for being part of our community.
        </p>
        <p style="margin:0; color:#ffffff; font-size:18px; font-weight:700;">
          City Hall is here to serve you. 🏛️
        </p>
      </div>

      <p style="color:#6b7280; font-size:13px; margin:0;">
        We hope this assistance has helped you and your family.
        City Hall continues to serve the community with dedication.
      </p>
    `

    await transporter.sendMail({
      from:    '"City Hall Financial Assistance" <' + process.env.GMAIL_USER + '>',
      to:      email,
      subject: "💵 Assistance Released — " + data.referenceNumber,
      html:    baseTemplate(content)
    })

    console.log("✅ Paid email sent to:", email)
    return true

  } catch(err){
    console.error("❌ Email error:", err.message)
    return false
  }
}

module.exports = {
  sendSubmissionEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPaidEmail
}