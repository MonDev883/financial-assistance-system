const express      = require("express")
const router       = express.Router()
const PayoutBatch  = require("../models/PayoutBatch")
const Application  = require("../models/Application")
const { protectStaff } = require("../middleware/authMiddleware")
const { sendSMS }  = require("../services/smsService")
const { recordAudit } = require("../services/auditService")
const {
  sendApprovalEmail
} = require("../services/emailService")

// ── Convert 24-hour time to 12-hour AM/PM format
function formatTime(time24){
  if(!time24) return ""
  const [hourStr, minute] = time24.split(":")
  let hour = parseInt(hourStr)
  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12
  return hour + ":" + minute + " " + ampm
}

// ========================
// CREATE BATCH (STAFF)
// ========================
router.post("/create", protectStaff, async (req, res) => {
  try {
    const {
      applicationWindow,
      batchName,
      payDate,
      startTime,
      endTime,
      maxCapacity,
      barangay,
      notes
    } = req.body

        if(!applicationWindow || !batchName || !payDate ||
       !startTime || !endTime){
      return res.status(400).json({ message: "All fields are required" })
    }

    if(startTime >= endTime){
      return res.status(400).json({ message: "End time must be after start time" })
    }

     // ── Auto-number the batch (highest existing + 1, so deletions don't collide)
    const last = await PayoutBatch.findOne({ applicationWindow })
      .sort({ batchNumber: -1 })
    const nextNumber = (last?.batchNumber || 0) + 1

    const batch = await PayoutBatch.create({
      applicationWindow,
      batchNumber:  nextNumber,
      batchName,
      payDate:      new Date(payDate),
      startTime,
      endTime,
      maxCapacity:  Number(maxCapacity) || 50,
      barangay:     barangay || "",
      notes:        notes || "",
      createdBy:    req.staff.id
    })

    recordAudit(req, {
      action:      "batch_created",
      targetType:  "PayoutBatch",
      targetId:    batch._id,
      targetLabel: batch.batchName,
      details: {
        payDate:     batch.payDate,
        timeSlot:    batch.startTime + " - " + batch.endTime,
        maxCapacity: batch.maxCapacity
      }
    })

    res.status(201).json({
      message: "Batch created successfully",
      batch
    })

  } catch(err){
    console.error("Create batch error:", err)
    res.status(500).json({ message: "Failed to create batch" })
  }
})

// ========================
// GET ALL BATCHES FOR A WINDOW (STAFF)
// ========================
router.get("/window/:windowId", protectStaff, async (req, res) => {
  try {
    const batches = await PayoutBatch.find({
      applicationWindow: req.params.windowId
    }).sort({ batchNumber: 1 })

    // ── Get applicant count per batch
    const batchesWithCount = await Promise.all(
      batches.map(async b => {
        const count = await Application.countDocuments({
          payoutBatch: b._id
        })
        return { ...b.toObject(), applicantCount: count }
      })
    )

    res.json(batchesWithCount)

  } catch(err){
    res.status(500).json({ message: "Failed to load batches" })
  }
})

// ========================
// GET BATCH WITH APPLICANTS (STAFF)
// ========================
router.get("/:id/applicants", protectStaff, async (req, res) => {
  try {
    const batch = await PayoutBatch.findById(req.params.id)

    if(!batch){
      return res.status(404).json({ message: "Batch not found" })
    }

    const applicants = await Application.find({
      payoutBatch: req.params.id
    }).sort({ lastName: 1 })

    const presentCount = applicants.filter(a => a.attendedAt).length

    res.json({ batch, applicants, presentCount })

  } catch(err){
    res.status(500).json({ message: "Failed to load batch applicants" })
  }
})

// ========================
// ASSIGN APPLICANTS TO BATCH (STAFF)
// ========================
router.put("/assign", protectStaff, async (req, res) => {
  try {
    const { batchId, applicationIds } = req.body

    if(!batchId || !applicationIds || applicationIds.length === 0){
      return res.status(400).json({ message: "Batch and applications are required" })
    }

    const batch = await PayoutBatch.findById(batchId)

    if(!batch){
      return res.status(404).json({ message: "Batch not found" })
    }

    // ── Check capacity
    const currentCount = await Application.countDocuments({ payoutBatch: batchId })
    const remaining    = batch.maxCapacity - currentCount

    if(applicationIds.length > remaining){
      return res.status(400).json({
        message: "Batch capacity exceeded. This batch can only accept " +
          remaining + " more applicant(s). Currently has " +
          currentCount + " of " + batch.maxCapacity + "."
      })
    }

    // ── Format dates for notifications
    const payDateFormatted = new Date(batch.payDate).toLocaleDateString("en-PH", {
      weekday: "long", year: "numeric",
      month: "long", day: "numeric"
    })

    const results  = { success: 0, failed: 0 }
    const assigned = []

    for(const id of applicationIds){
      try {
        const application = await Application.findById(id)

        if(!application){
          results.failed++
          continue
        }

        if(application.status !== "approved"){
          results.failed++
          continue
        }

        // ── Assign batch and update pay date
        application.payoutBatch = batchId
        application.payDate     = batch.payDate
        await application.save()

        assigned.push(application)
        results.success++

      } catch(err){
        console.error("Assign error for " + id + ":", err)
        results.failed++
      }
    }

    recordAudit(req, {
      action:      "batch_assigned",
      targetType:  "PayoutBatch",
      targetId:    batch._id,
      targetLabel: batch.batchName,
      details: {
        count:      results.success,
        references: assigned.map(a => a.referenceNumber)
      }
    })

    // ── Respond immediately, before any notifications
    res.json({
      message: results.success + " applicant(s) assigned to " + batch.batchName + " successfully." +
        (results.failed > 0 ? " " + results.failed + " failed." : ""),
      results
    })

    // ── Notify in the background. The response is already sent, so nothing
    //    here may throw uncaught or attempt to respond again.
    const startFormatted = formatTime(batch.startTime)
    const endFormatted   = formatTime(batch.endTime)

    for(const app of assigned){
      if(app.contactNumber){
        const smsMessage =
          "City Hall Financial Assistance\n" +
          "Ref No: " + app.referenceNumber + "\n" +
          "PAYOUT SCHEDULE\n" +
          "Batch: " + batch.batchName + "\n" +
          "Date: " + new Date(batch.payDate).toLocaleDateString("en-PH") + "\n" +
          "Time: " + startFormatted + " - " + endFormatted + "\n" +
          "Please be on time. Bring valid ID." +
          (batch.notes ? "\nNote: " + batch.notes : "")

        const smsOk = await sendSMS(app.contactNumber, smsMessage)
        if(!smsOk){
          console.warn("⚠️ Batch SMS not delivered for " + app.referenceNumber)
        }
      }

      const emailOk = await sendApprovalEmail(app.email, {
        referenceNumber: app.referenceNumber,
        name:            app.firstName + " " + app.lastName,
        assistanceType:  app.assistanceType,
        approvedAmount:  app.approvedAmount || app.amountAssigned,
        payDate:         payDateFormatted,
        timeSlot:        startFormatted + " – " + endFormatted,
        batchName:       batch.batchName,
        remarks:         batch.notes || ""
      })
      if(app.email && !emailOk){
        console.warn("⚠️ Batch email not delivered for " + app.referenceNumber)
      }
    }

  } catch(err){
    console.error("Assign batch error:", err)
    res.status(500).json({ message: "Failed to assign batch" })
  }
})

// ========================
// TOGGLE ATTENDANCE AT THE PAYOUT DESK (STAFF)
// ========================
router.put("/attendance/:applicationId", protectStaff, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)

    if(!application){
      return res.status(404).json({ message: "Application not found" })
    }

    if(!application.payoutBatch){
      return res.status(400).json({
        message: "This applicant is not assigned to a batch yet"
      })
    }

    if(application.status === "paid"){
      return res.status(400).json({
        message: "Already marked as paid — attendance can no longer be changed"
      })
    }

    // ── Toggle
    const marking = !application.attendedAt

    application.attendedAt = marking ? new Date() : null
    application.attendedBy = marking ? req.staff.id : null
    await application.save()

    recordAudit(req, {
      action:      marking ? "attendance_marked" : "attendance_cleared",
      targetType:  "Application",
      targetId:    application._id,
      targetLabel: application.referenceNumber,
      details:     { batch: application.payoutBatch }
    })

    res.json({
      message:    marking ? "Marked as present" : "Attendance cleared",
      attendedAt: application.attendedAt
    })

  } catch(err){
    console.error("Attendance error:", err)
    res.status(500).json({ message: "Failed to update attendance" })
  }
})

// ========================
// REMOVE FROM BATCH (STAFF)
// ========================
router.put("/remove/:applicationId", protectStaff, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)

    if(!application){
      return res.status(404).json({ message: "Application not found" })
    }

    const previousBatch = application.payoutBatch

    application.payoutBatch = null
    application.payDate     = null
    await application.save()

    recordAudit(req, {
      action:      "batch_removed",
      targetType:  "Application",
      targetId:    application._id,
      targetLabel: application.referenceNumber,
      details: { previousBatch }
    })

    res.json({ message: "Removed from batch successfully" })

  } catch(err){
    res.status(500).json({ message: "Failed to remove from batch" })
  }
})

// ========================
// GET APPROVED UNASSIGNED APPLICATIONS
// FILTERED BY BARANGAY (STAFF)
// ========================
router.get("/unassigned/:windowId", protectStaff, async (req, res) => {
  try {
    const { barangay } = req.query

    let filter = {
      applicationWindow: req.params.windowId,
      status:            "approved",
      payoutBatch:       null
    }

    // ── Filter by barangay if provided
    if(barangay){
      filter.barangay = { $regex: barangay, $options: "i" }
    }

    const applications = await Application.find(filter)
      .sort({ barangay: 1, lastName: 1 })

    // ── Get unique barangays for dropdown
    const allUnassigned = await Application.find({
      applicationWindow: req.params.windowId,
      status:            "approved",
      payoutBatch:       null
    }).select("barangay")

    const barangays = [...new Set(
      allUnassigned.map(a => a.barangay).filter(Boolean)
    )].sort()

    res.json({ applications, barangays })

  } catch(err){
    console.error("Unassigned error:", err)
    res.status(500).json({ message: "Failed to load unassigned applications" })
  }
})

module.exports = router