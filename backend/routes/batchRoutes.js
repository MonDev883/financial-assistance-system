const express      = require("express")
const router       = express.Router()
const PayoutBatch  = require("../models/PayoutBatch")
const Application  = require("../models/Application")
const { protectStaff } = require("../middleware/authMiddleware")
const { sendSMS }  = require("../services/smsService")
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

    res.json({ batch, applicants })

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

    const results = { success: 0, failed: 0 }

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

       

              // ── Format times to 12-hour
        const startFormatted = formatTime(batch.startTime)
        const endFormatted   = formatTime(batch.endTime)

        // ── Send SMS with batch details
        if(application.contactNumber){
          const smsMessage =
            "City Hall Financial Assistance\n" +
            "Ref No: " + application.referenceNumber + "\n" +
            "PAYOUT SCHEDULE\n" +
            "Batch: " + batch.batchName + "\n" +
            "Date: " + new Date(batch.payDate).toLocaleDateString("en-PH") + "\n" +
            "Time: " + startFormatted + " - " + endFormatted + "\n" +
            "Please be on time. Bring valid ID." +
            (batch.notes ? "\nNote: " + batch.notes : "")

          const smsOk = await sendSMS(application.contactNumber, smsMessage)
          if(!smsOk){
            console.warn("⚠️ Batch SMS not delivered for " + application.referenceNumber)
          }
        }

        // ── Send email with batch details
        if(application.email){
          try {
            await sendApprovalEmail(application.email, {
              referenceNumber: application.referenceNumber,
              name:            application.firstName + " " + application.lastName,
              assistanceType:  application.assistanceType,
              approvedAmount:  application.approvedAmount || application.amountAssigned,
              payDate:         payDateFormatted,
              timeSlot:        startFormatted + " – " + endFormatted,
              batchName:       batch.batchName,
              remarks:         batch.notes || ""
            })
          } catch(e){
            console.error("Batch email failed for " + application.referenceNumber + ":", e.message)
          }
        }

        results.success++

      } catch(err){
        console.error("Assign error for " + id + ":", err)
        results.failed++
      }
    }

    res.json({
      message: results.success + " applicant(s) assigned to " + batch.batchName + " successfully." +
        (results.failed > 0 ? " " + results.failed + " failed." : ""),
      results
    })

  } catch(err){
    console.error("Assign batch error:", err)
    res.status(500).json({ message: "Failed to assign batch" })
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

    application.payoutBatch = null
    application.payDate     = null
    await application.save()

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