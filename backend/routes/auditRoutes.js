const express  = require("express")
const router   = express.Router()
const mongoose = require("mongoose")
const AuditLog = require("../models/AuditLog")
const { protectAdmin } = require("../middleware/authMiddleware")

// ========================
// GET AUDIT LOG (ADMIN ONLY)
// ========================
router.get("/", protectAdmin, async (req, res) => {
  try {
    const { staff, action, from, to, search } = req.query

    const page  = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Number(req.query.limit) || 50)

    const filter = {}

    if(staff && mongoose.Types.ObjectId.isValid(staff)){
      filter.staff = staff
    }

    if(action) filter.action = action

    // ── Date range on createdAt
    if(from || to){
      filter.createdAt = {}
      if(from) filter.createdAt.$gte = new Date(from)
      if(to){
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)   // include the whole end day
        filter.createdAt.$lte = end
      }
    }

    // ── Free text against the target label (reference number, window title)
    if(search){
      const esc = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      filter.targetLabel = { $regex: esc, $options: "i" }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ])

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    })

  } catch(err){
    console.error("Audit log error:", err)
    res.status(500).json({ message: "Failed to load audit log" })
  }
})

// ========================
// DISTINCT STAFF WHO HAVE ACTED (for the filter dropdown)
// ========================
router.get("/actors", protectAdmin, async (req, res) => {
  try {
    const actors = await AuditLog.aggregate([
      { $group: {
          _id:   "$staff",
          name:  { $first: "$staffName" },
          email: { $first: "$staffEmail" }
      }},
      { $sort: { name: 1 } }
    ])

    res.json(actors)

  } catch(err){
    res.status(500).json({ message: "Failed to load actors" })
  }
})

module.exports = router