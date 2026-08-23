const express     = require("express")
const router      = express.Router()
const Application = require("../models/Application")
const ApplicationWindow = require("../models/ApplicationWindow")
const { protectStaff } = require("../middleware/authMiddleware")
const { sendSMS } = require("../services/smsService")
const {
  sendSubmissionEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPaidEmail
} = require("../services/emailService")

const multer     = require("multer")
const cloudinary = require("cloudinary").v2
const { CloudinaryStorage } = require("multer-storage-cloudinary")

// ── Cloudinary config — Render's disk is ephemeral, so local files don't survive
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "financial-assistance/selfies",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 800, height: 800, crop: "limit", quality: "auto" }]
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if(allowed.includes(file.mimetype)){
    cb(null, true)
  } else {
    cb(new Error("Only image files allowed"), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

// ── Delete the uploaded image when a submission is rejected.
// Fire-and-forget — the caller returns immediately, so failures are logged only.
function cleanupUpload(req){
  if(!req.file || !req.file.filename) return

  cloudinary.uploader.destroy(req.file.filename)
    .catch(e => console.error("Cloudinary cleanup failed:", e.message))
}

// ── Escape user input before putting it in a RegExp
const escapeRegex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// ── Store phone numbers in one canonical format (09XXXXXXXXX)
function normalizePhone(p){
  let n = String(p || "").replace(/\D/g, "")
  if(n.startsWith("63")) n = "0" + n.slice(2)
  return n
}

// ========================
// SUBMIT APPLICATION (PUBLIC)
// ========================
router.post("/submit/:windowId", upload.single("selfie"), async (req, res) => {
  try {

    // ── LINE 1 ── Find and validate the window
    const window = await ApplicationWindow.findById(req.params.windowId)

        if(!window){
      cleanupUpload(req)
      return res.status(404).json({ message: "Application window not found" })
    }

    // ── LINE 2 ── Check if window is currently open
        // ── LINE 2 ── Check if window is currently open
    const now = new Date()

    if(!window.isOpen()){
      cleanupUpload(req)
      return res.status(400).json({
        message: "This application window is no longer accepting submissions."
      })
    }
//To be resumed on 07-26-2026 By Mon Dev

    const {
        lastName, firstName, middleName,
        dateOfBirth, gender, civilStatus,
        houseNo, street, barangay, city, province, zipCode,
        contactNumber, email,
        assistanceType
      } = req.body

    // ── LINE 3 ── Check selfie uploaded
      if(!req.file){
        return res.status(400).json({
          message: "Selfie photo is required for identity verification"
        })
      }

      // ── LINE 3b ── Validate all required fields
      if(!lastName || !firstName || !dateOfBirth ||
         !gender || !civilStatus ||
         !houseNo || !street || !barangay ||
         !city || !province || !zipCode ||
         !contactNumber || !assistanceType){
        cleanupUpload(req)
        return res.status(400).json({ message: "All required fields must be filled in" })
      }

            // ── Date of birth must be a real date in the past
      const dob = new Date(dateOfBirth)

      if(isNaN(dob.getTime())){
        cleanupUpload(req)
        return res.status(400).json({ message: "Invalid date of birth" })
      }

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      if(dob >= todayStart){
        cleanupUpload(req)
        return res.status(400).json({ message: "Date of birth must be in the past" })
      }

      const ageMs  = Date.now() - dob.getTime()
      const ageYrs = Math.floor(ageMs / 31557600000)

      if(ageYrs < 18){
        cleanupUpload(req)
        return res.status(400).json({ message: "Applicant must be at least 18 years old" })
      }

    // ── LINE 4 ── Get auto-assigned amount from window
    const assignedAmount = window.amounts?.[assistanceType] || 0


// ── LINE 4b ── Check for duplicate submission
      const duplicate = await Application.findOne({
        applicationWindow: window._id,
        firstName:   { $regex: new RegExp("^" + escapeRegex(firstName) + "$", "i") },
        lastName:    { $regex: new RegExp("^" + escapeRegex(lastName) + "$", "i") },
        dateOfBirth: dateOfBirth
      })

            if(duplicate){
        cleanupUpload(req)
        return res.status(400).json({
          message: `A submission already exists for ${firstName} ${lastName} (DOB: ${dateOfBirth}) in this window. Your reference number is: ${duplicate.referenceNumber}`
        })
      }

            // ── LINE 4c ── Cooling-off: 3 months must pass since the last payout
      const nameFilter = {
        firstName:   { $regex: new RegExp("^" + escapeRegex(firstName) + "$", "i") },
        lastName:    { $regex: new RegExp("^" + escapeRegex(lastName) + "$", "i") },
        dateOfBirth: dateOfBirth
      }

      const lastPaid = await Application.findOne({
        ...nameFilter,
        status: "paid"
      }).sort({ paidAt: -1, payDate: -1 })

      if(lastPaid){
        const paidOn = lastPaid.paidAt || lastPaid.payDate || lastPaid.reviewedAt

        if(paidOn){
          const eligibleOn = new Date(paidOn)
          eligibleOn.setMonth(eligibleOn.getMonth() + 3)

          if(now < eligibleOn){
            cleanupUpload(req)

            const fmt = d => new Date(d).toLocaleDateString("en-PH", {
              year: "numeric", month: "long", day: "numeric"
            })

            return res.status(400).json({
              message: "Thank you for your interest. Our records show you received " +
                "assistance on " + fmt(paidOn) + " (Ref: " + lastPaid.referenceNumber + "). " +
                "To help us serve as many families as possible, applicants may reapply " +
                "three months after their last payout. You will be eligible again on " +
                fmt(eligibleOn) + ". If your situation is urgent, please visit City Hall."
            })
          }
        }
      }


 const refNum = "FA-" + new Date().getFullYear() + "-" +
  Date.now().toString(36).toUpperCase().slice(-5)


    // ── LINE 6 ── Create application
    const application = await Application.create({
      applicationWindow: window._id,
      referenceNumber:   refNum,
      lastName,
      firstName,
      middleName:        middleName || "",
      dateOfBirth,
      gender,
      civilStatus,
      houseNo,
      street,
      barangay,
      city,
      province,
      zipCode,
      contactNumber:     normalizePhone(contactNumber),
      email:             email || "",
      assistanceType,
      selfiePhotoPath:   req.file.path,
      amountAssigned:    assignedAmount,
      status:            "pending",
      submittedAt:       now
    })

    // ── LINE 7 ── Send SMS confirmation
    // ── LINE 7 ── Send SMS + Email confirmation
      const smsMessage =
        "City Hall Financial Assistance\n" +
        "Application received.\n" +
        "Ref No: " + refNum + "\n" +
        "Type: " + assistanceType + "\n" +
        "Status: PENDING\n" +
        "You will be notified of updates."

  const smsOk = await sendSMS(contactNumber, smsMessage)
if(!smsOk){
  console.warn("⚠️ SMS not delivered for " + refNum)
}

const emailOk = await sendSubmissionEmail(email, {
  referenceNumber: refNum,
  name:            firstName + " " + lastName,
  assistanceType
})
if(!emailOk && email){
  console.warn("⚠️ Submission email not delivered for " + refNum)
}

    res.status(201).json({
      message:         "Application submitted successfully",
      referenceNumber: application.referenceNumber,
      name:            `${firstName} ${lastName}`,
      assistanceType:  application.assistanceType,
      amountAssigned:  application.amountAssigned
    })

    } catch(err){
    cleanupUpload(req)
    console.error("Submit error:", err)
    res.status(500).json({ message: "Failed to submit application" })
  }
})


//To be continue tommorrow by Mon Dev:) 07-24-2026
// ========================
// GET ALL APPLICATIONS (STAFF)
// ========================
router.get("/all", protectStaff, async (req, res) => {
  try {
    const { status, windowId, search } = req.query
    let filter = {}

    if(status)   filter.status            = status
    if(windowId) filter.applicationWindow = windowId

    // ── Search by name, barangay or reference number
    if(search){
      filter.$or = [
        { firstName:       { $regex: search, $options: "i" } },
        { lastName:        { $regex: search, $options: "i" } },
        { barangay:        { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
        { contactNumber:   { $regex: search, $options: "i" } }
      ]
    }



    const applications = await Application.find(filter)
      .populate("applicationWindow", "title startDate endDate")
      .sort({ submittedAt: -1 })

    res.json(applications)
  } catch(err){
    res.status(500).json({ message: "Failed to load applications" })
  }
})

// ========================
// CLAIM HISTORY FOR ONE APPLICANT (STAFF)
// ========================
router.get("/history/:id", protectStaff, async (req, res) => {
  try {
    const mongoose = require("mongoose")

    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(400).json({ message: "Invalid application ID" })
    }

    const application = await Application.findById(req.params.id)

    if(!application){
      return res.status(404).json({ message: "Application not found" })
    }

    // ── Same person, any other window
    const history = await Application.find({
      _id:         { $ne: application._id },
      firstName:   { $regex: new RegExp("^" + escapeRegex(application.firstName) + "$", "i") },
      lastName:    { $regex: new RegExp("^" + escapeRegex(application.lastName) + "$", "i") },
      dateOfBirth: application.dateOfBirth
    })
      .populate("applicationWindow", "title")
      .sort({ submittedAt: -1 })
      .limit(10)

    const totalReceived = history
      .filter(h => h.status === "paid")
      .reduce((sum, h) => sum + (h.approvedAmount || 0), 0)

    res.json({
      count:         history.length,
      totalReceived,
      claims: history.map(h => ({
        referenceNumber: h.referenceNumber,
        window:          h.applicationWindow?.title || "—",
        assistanceType:  h.assistanceType,
        status:          h.status,
        amount:          h.approvedAmount || h.amountAssigned || 0,
        date:            h.paidAt || h.payDate || h.submittedAt
      }))
    })

  } catch(err){
    console.error("History error:", err)
    res.status(500).json({ message: "Failed to load claim history" })
  }
})

// ========================
// REVIEW APPLICATION (STAFF)
// ========================
router.put("/review/:id", protectStaff, async (req, res) => {
  try {
    const {
      status,
      approvedAmount,
      payDate,
      rejectionReason,
      remarks
    } = req.body

    if(!["approved", "rejected"].includes(status)){
  return res.status(400).json({ message: "Invalid status" })
}
    const application = await Application.findById(req.params.id)

    if(!application){
      return res.status(404).json({ message: "Application not found" })
    }

    if(application.status !== "pending"){
      return res.status(400).json({ message: "Application already reviewed" })
    }

    application.status     = status
    application.reviewedBy = req.staff.id
    application.reviewedAt = new Date()
    application.remarks    = remarks || ""

           if(status === "approved"){
      application.approvedAmount = application.amountAssigned
      // Approval email is sent by batchRoutes when a payout batch is assigned —
      // payDate and time slot don't exist yet at this point.
    }

    if(status === "rejected"){
      application.rejectionReason = rejectionReason || ""
    }

    await application.save()

    // ── Send SMS notification
    if(application.contactNumber){
        let smsMessage = ""

        if(status === "approved"){
          smsMessage =
            "City Hall Financial Assistance\n" +
            "Ref No: " + application.referenceNumber + "\n" +
            "Status: APPROVED\n" +
            "Amount: PHP " + Number(application.amountAssigned).toLocaleString() + "\n" +
            "You will be notified of your payout schedule soon.\n" +
            "Please wait for further instructions."

        } else {
          smsMessage =
            "City Hall Financial Assistance\n" +
            "Ref No: " + application.referenceNumber + "\n" +
            "Status: REJECTED\n" +
            "Reason: " + (rejectionReason || "See City Hall for details")

            const emailOk = await sendRejectionEmail(application.email, {
            referenceNumber: application.referenceNumber,
            name:            application.firstName + " " + application.lastName,
            rejectionReason
          })
          if(application.email && !emailOk){
            console.warn("⚠️ Rejection email not delivered for " + application.referenceNumber)
          }
        }

        const smsOk = await sendSMS(application.contactNumber, smsMessage)
        if(!smsOk){
          console.warn("⚠️ SMS not delivered for " + application.referenceNumber)
        }
      }

    res.json({ message: `Application ${status} successfully` })

  } catch(err){
    console.error("Review error:", err)
    res.status(500).json({ message: "Failed to review application" })
  }
})

// ========================
// MARK AS PAID (STAFF)
// ========================
router.put("/paid/:id", protectStaff, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)

    if(!application){
      return res.status(404).json({ message: "Application not found" })
    }

    if(application.status !== "approved"){
      return res.status(400).json({
        message: "Only approved applications can be marked as paid"
      })
    }

       application.status = "paid"
    application.paidAt = new Date()
    application.paidBy = req.staff.id
    await application.save()

    if(application.contactNumber){
            {
        const smsOk = await sendSMS(application.contactNumber,
          "City Hall Financial Assistance\n" +
          "Ref No: " + application.referenceNumber + "\n" +
          "Status: PAID\n" +
          "Your financial assistance has been released. Thank you."
        )
        if(!smsOk){
          console.warn("⚠️ Paid SMS not delivered for " + application.referenceNumber)
        }
      }
    }

      const paidEmailOk = await sendPaidEmail(application.email, {
      referenceNumber: application.referenceNumber,
      name:            application.firstName + " " + application.lastName
    })
    if(application.email && !paidEmailOk){
      console.warn("⚠️ Paid email not delivered for " + application.referenceNumber)
    }

    res.json({ message: "Marked as paid successfully" })

  } catch(err){
    res.status(500).json({ message: "Failed to mark as paid" })
  }
})

// ========================
// CHECK STATUS BY REFERENCE NUMBER (PUBLIC)
// ========================
router.get("/status/:refNum", async (req, res) => {
  try {
    const application = await Application.findOne({
      referenceNumber: req.params.refNum.toUpperCase()
    })
    .populate("applicationWindow", "title startDate endDate")
    .populate("payoutBatch", "batchName batchNumber payDate startTime endTime notes")

    if(!application){
      return res.status(404).json({
        message: "No application found with that reference number. Please check and try again."
      })
    }

    // ── Return only what claimant needs to see
    res.json({
      referenceNumber: application.referenceNumber,
      name:            application.firstName + " " + application.lastName,
      assistanceType:  application.assistanceType,
      status:          application.status,
      amountAssigned:  application.amountAssigned,
      approvedAmount:  application.approvedAmount,
      payDate:         application.payDate,
      rejectionReason: application.rejectionReason,
      remarks:         application.remarks,
      submittedAt:     application.submittedAt,
      window:          application.applicationWindow?.title,
      batch: application.payoutBatch ? {
        batchName:   application.payoutBatch.batchName,
        batchNumber: application.payoutBatch.batchNumber,
        payDate:     application.payoutBatch.payDate,
        startTime:   application.payoutBatch.startTime,
        endTime:     application.payoutBatch.endTime,
        notes:       application.payoutBatch.notes
      } : null
    })

  } catch(err){
    console.error("Status check error:", err)
    res.status(500).json({ message: "Failed to check status" })
  }
})

// ========================
// EXPORT TO EXCEL (STAFF)
// ========================
router.get("/export/:windowId", protectStaff, async (req, res) => {
  try {
    const ExcelJS = require("exceljs")

    const { status } = req.query
    let filter = { applicationWindow: req.params.windowId }
    if(status) filter.status = status

    const applications = await Application.find(filter)
      .populate("applicationWindow", "title startDate endDate")
      .sort({ submittedAt: -1 })

    if(applications.length === 0){
      return res.status(404).json({ message: "No applications found to export" })
    }

    // ── Create workbook
    const workbook  = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Applications")

    // ── Header style
    const headerStyle = {
      font:      { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
      fill:      { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top:    { style: "thin" },
        left:   { style: "thin" },
        bottom: { style: "thin" },
        right:  { style: "thin" }
      }
    }

    // ── Define columns
    worksheet.columns = [
      { header: "Reference No.",    key: "refNum",        width: 18 },
      { header: "Last Name",        key: "lastName",      width: 18 },
      { header: "First Name",       key: "firstName",     width: 18 },
      { header: "Middle Name",      key: "middleName",    width: 16 },
      { header: "Date of Birth",    key: "dateOfBirth",   width: 15 },
      { header: "Gender",           key: "gender",        width: 10 },
      { header: "Civil Status",     key: "civilStatus",   width: 14 },
      { header: "House No.",        key: "houseNo",       width: 12 },
      { header: "Street",           key: "street",        width: 18 },
      { header: "Barangay",         key: "barangay",      width: 18 },
      { header: "City",             key: "city",          width: 18 },
      { header: "Province",         key: "province",      width: 18 },
      { header: "Zip Code",         key: "zipCode",       width: 10 },
      { header: "Contact Number",   key: "contact",       width: 16 },
      { header: "Email",            key: "email",         width: 24 },
      { header: "Assistance Type",  key: "type",          width: 16 },
     // { header: "Reason",           key: "reason",        width: 30 }, 08-19-2026
      { header: "Amount Assigned",  key: "amountAssigned",width: 16 },
      { header: "Status",           key: "status",        width: 12 },
      { header: "Approved Amount",  key: "approvedAmount",width: 16 },
      { header: "Pay Date",         key: "payDate",       width: 15 },
      { header: "Remarks",          key: "remarks",       width: 24 },
      { header: "Date Submitted",   key: "submittedAt",   width: 18 }
    ]

    // ── Apply header styles
    worksheet.getRow(1).eachCell(cell => {
      Object.assign(cell, headerStyle)
    })
    worksheet.getRow(1).height = 30

    // ── Add data rows
    applications.forEach((app, index) => {
      const row = worksheet.addRow({
        refNum:         app.referenceNumber,
        lastName:       app.lastName,
        firstName:      app.firstName,
        middleName:     app.middleName || "",
        dateOfBirth:    app.dateOfBirth,
        gender:         app.gender,
        civilStatus:    app.civilStatus,
        houseNo:        app.houseNo,
        street:         app.street,
        barangay:       app.barangay,
        city:           app.city,
        province:       app.province,
        zipCode:        app.zipCode,
        contact:        app.contactNumber,
        email:          app.email || "",
        type:           app.assistanceType,
      //  reason:         app.reason, 08-19-2026
        amountAssigned: app.amountAssigned || 0,
        status:         app.status.toUpperCase(),
        approvedAmount: app.approvedAmount || 0,
        payDate:        app.payDate
          ? new Date(app.payDate).toLocaleDateString("en-PH")
          : "",
        remarks:        app.remarks || "",
        submittedAt:    new Date(app.submittedAt).toLocaleDateString("en-PH")
      })

      // ── Alternate row colors
      if(index % 2 === 1){
        row.eachCell(cell => {
          cell.fill = {
            type: "pattern", pattern: "solid",
            fgColor: { argb: "FFFEF2F2" }
          }
        })
      }

      // ── Status color
      const statusCell = row.getCell("status")
      switch(app.status){
        case "approved":
          statusCell.font = { bold: true, color: { argb: "FF166534" } }
          break
        case "rejected":
          statusCell.font = { bold: true, color: { argb: "FF991B1B" } }
          break
        case "paid":
          statusCell.font = { bold: true, color: { argb: "FF1D4ED8" } }
          break
        default:
          statusCell.font = { bold: true, color: { argb: "FF92400E" } }
      }

      // ── Amount formatting
      row.getCell("amountAssigned").numFmt = "₱#,##0.00"
      row.getCell("approvedAmount").numFmt = "₱#,##0.00"
    })


//To be resumed by Mon Dev within this day:) 08-06-2026

    // ── Add summary row at bottom
    worksheet.addRow([])
    const summaryRow = worksheet.addRow([
      "TOTAL APPLICATIONS:", applications.length,
      "APPROVED:", applications.filter(a => a.status === "approved").length,
      "REJECTED:", applications.filter(a => a.status === "rejected").length,
      "PAID:", applications.filter(a => a.status === "paid").length,
      "PENDING:", applications.filter(a => a.status === "pending").length
    ])
    summaryRow.font = { bold: true }

    // ── Window title as sheet title
    const windowTitle = applications[0]?.applicationWindow?.title || "Applications"
    const safeTitle   = windowTitle.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30)

    // ── Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}-${new Date().toISOString().slice(0,10)}.xlsx"`
    )

    await workbook.xlsx.write(res)
    res.end()

  } catch(err){
    console.error("Export error:", err)
    res.status(500).json({ message: "Failed to export applications" })
  }
})

// ========================
// ANALYTICS (STAFF)
// ========================
router.get("/analytics/:windowId", protectStaff, async (req, res) => {
  try {

    const filter = { applicationWindow: req.params.windowId }

    // ── Total counts per status
    const total    = await Application.countDocuments(filter)
    const pending  = await Application.countDocuments({ ...filter, status: "pending" })
    const approved = await Application.countDocuments({ ...filter, status: "approved" })
    const rejected = await Application.countDocuments({ ...filter, status: "rejected" })
    const paid     = await Application.countDocuments({ ...filter, status: "paid" })

    // ── Applications by assistance type
    const byType = await Application.aggregate([
      { $match: filter },
      { $group: { _id: "$assistanceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    // ── Applications by barangay (top 10)
    const byBarangay = await Application.aggregate([
      { $match: filter },
      { $group: { _id: "$barangay", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // ── Applications by gender
    const byGender = await Application.aggregate([
      { $match: filter },
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ])

    // ── Applications by civil status
    const byCivilStatus = await Application.aggregate([
      { $match: filter },
      { $group: { _id: "$civilStatus", count: { $sum: 1 } } }
    ])

    // ── Total amount disbursed
    const amountData = await Application.aggregate([
      { $match: { ...filter, status: { $in: ["approved", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } }
    ])

    // ── Daily submissions
    const byDate = await Application.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ])

    res.json({
      summary: { total, pending, approved, rejected, paid },
      totalAmountDisbursed: amountData[0]?.total || 0,
      approvalRate: total > 0
        ? Math.round((approved + paid) / total * 100)
        : 0,
      byType:        byType.map(d => ({ name: d._id, value: d.count })),
      byBarangay:    byBarangay.map(d => ({ name: d._id, value: d.count })),
      byGender:      byGender.map(d => ({ name: d._id, value: d.count })),
      byCivilStatus: byCivilStatus.map(d => ({ name: d._id, value: d.count })),
      byDate:        byDate.map(d => ({ date: d._id, count: d.count }))
    })

  } catch(err){
    console.error("Analytics error:", err)
    res.status(500).json({ message: "Failed to load analytics" })
  }
})

// ========================
// BULK APPROVE (STAFF)
// ========================
router.put("/bulk-approve", protectStaff, async (req, res) => {
  try {
    const { applicationIds, remarks } = req.body

    if(!applicationIds || applicationIds.length === 0){
      return res.status(400).json({ message: "No applications selected" })
    }

    const results = { success: 0, failed: 0, errors: [] }

       // ── Phase 1: update every record first (fast, no network calls)
    const approved = []

    for(const id of applicationIds){
      try {
        const application = await Application.findById(id)

        if(!application){
          results.failed++
          results.errors.push(id + ": Not found")
          continue
        }

        if(application.status !== "pending"){
          results.failed++
          results.errors.push(application.referenceNumber + ": Already reviewed")
          continue
        }

        application.status         = "approved"
        application.approvedAmount = application.amountAssigned
        application.remarks        = remarks || ""
        application.reviewedBy     = req.staff.id
        application.reviewedAt     = new Date()
        await application.save()

        approved.push(application)
        results.success++

      } catch(err){
        results.failed++
        results.errors.push(id + ": " + err.message)
      }
    }

    // ── Phase 2: respond immediately, before any notifications
    res.json({
      message: results.success + " application(s) approved successfully." +
        (results.failed > 0 ? " " + results.failed + " failed." : ""),
      results
    })

    // ── Phase 3: notify in the background. The response is already sent,
    //    so nothing here may throw uncaught or attempt to respond again.
    for(const app of approved){
      if(!app.contactNumber) continue

      const smsOk = await sendSMS(app.contactNumber,
        "City Hall Financial Assistance\n" +
        "Ref No: " + app.referenceNumber + "\n" +
        "Status: APPROVED\n" +
        "Amount: PHP " + Number(app.amountAssigned).toLocaleString() + "\n" +
        "Payout schedule to follow."
      )
      if(!smsOk){
        console.warn("⚠️ SMS not delivered for " + app.referenceNumber)
      }
    }

  } catch(err){
    console.error("Bulk approve error:", err)
    res.status(500).json({ message: "Bulk approve failed" })
  }
})


module.exports = router