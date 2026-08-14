const express = require("express")
const router  = express.Router()
const ApplicationWindow = require("../models/ApplicationWindow")
const { protectStaff, protectAdmin } = require("../middleware/authMiddleware")

// ========================
// GET CURRENT ACTIVE WINDOW
// (Public — claimants check this)
// ========================
router.get("/current", async (req, res) => {
  try {
    const now = new Date()

    const window = await ApplicationWindow.findOne({
      isActive:  true,
      startDate: { $lte: now },
      endDate:   { $gte: now }
    }).sort({ createdAt: -1 })

    if(!window){
      return res.json({
        isOpen:  false,
        message: "No active application window at this time."
      })
    }

    res.json({
      isOpen:      true,
      windowId:    window._id,
      title:       window.title,
      description: window.description,
      startDate:   window.startDate,
      endDate:     window.endDate,
      amounts:     window.amounts
    })

  } catch(err){
    console.error("Window check error:", err)
    res.status(500).json({ message: "Failed to check application window" })
  }
})


// ========================
// GET WINDOW BY ID (PUBLIC)
// ========================
router.get("/public/:id", async (req, res) => {
  try {
    const window = await ApplicationWindow.findById(req.params.id)

    if(!window){
      return res.status(404).json({
        isOpen:  false,
        message: "Application window not found."
      })
    }

    const now = new Date()
    const isOpen = window.isActive &&
      now >= new Date(window.startDate) &&
      now <= new Date(window.endDate)

    res.json({
      isOpen,
      windowId:    window._id,
      title:       window.title,
      description: window.description,
      startDate:   window.startDate,
      endDate:     window.endDate,
      amounts:     window.amounts,
      message:     isOpen ? "" : "This application window is closed."
    })

  } catch(err){
    res.status(500).json({
      isOpen:  false,
      message: "Failed to load application window."
    })
  }
})

// ========================
// GET ALL WINDOWS (STAFF)
// ========================
router.get("/all", protectStaff, async (req, res) => {
  try {
    const windows = await ApplicationWindow.find()
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })

    res.json(windows)
    
  } catch(err){
    res.status(500).json({ message: "Failed to load windows" })
  }
})

// ========================
// CREATE WINDOW (ADMIN)
// ========================
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      amounts
    } = req.body

    if(!title || !startDate || !endDate){
      return res.status(400).json({
        message: "Title, start date and end date are required"
      })
    }

    if(new Date(startDate) >= new Date(endDate)){
      return res.status(400).json({
        message: "End date must be after start date"
      })
    }

     const window = await ApplicationWindow.create({
      title,
      description: description || "",
      startDate:   new Date(startDate),
      endDate:     new Date(endDate),
      amounts: {
        Medical:     Number(amounts?.Medical)     || 0,
        Burial:      Number(amounts?.Burial)      || 0,
        Educational: Number(amounts?.Educational) || 0,
        Calamity:    Number(amounts?.Calamity)    || 0,
        Other:       Number(amounts?.Other)       || 0
      },
      isActive:    true,
      createdBy:   req.staff.id
    })

    res.status(201).json({
      message: "Application window created",
      window
    })

  } catch(err){
    console.error("Create window error:", err)
    res.status(500).json({ message: "Failed to create window" })
  }
})

// ========================
// UPDATE WINDOW (ADMIN)
// ========================
router.put("/update/:id", protectAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      maxAmount,
      isActive
    } = req.body

    const window = await ApplicationWindow.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        startDate:  new Date(startDate),
        endDate:    new Date(endDate),
        maxAmount:  Number(maxAmount) || 0,
        isActive
      },
      { new: true }
    )

    if(!window){
      return res.status(404).json({ message: "Window not found" })
    }

    res.json({ message: "Window updated", window })

  } catch(err){
    console.error("Update window error:", err)
    res.status(500).json({ message: "Failed to update window" })
  }
})

// ========================
// CLOSE WINDOW (ADMIN)
// ========================
router.put("/close/:id", protectAdmin, async (req, res) => {
  try {
    const window = await ApplicationWindow.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if(!window){
      return res.status(404).json({ message: "Window not found" })
    }

    res.json({ message: "Window closed successfully" })

  } catch(err){
    res.status(500).json({ message: "Failed to close window" })
  }
})

// ========================
// GET WINDOW STATS (STAFF)
// ========================
router.get("/stats/:id", protectStaff, async (req, res) => {
  try {
    const Application = require("../models/Application")

    const total    = await Application.countDocuments({ applicationWindow: req.params.id })
    const pending  = await Application.countDocuments({ applicationWindow: req.params.id, status: "pending" })
    const approved = await Application.countDocuments({ applicationWindow: req.params.id, status: "approved" })
    const rejected = await Application.countDocuments({ applicationWindow: req.params.id, status: "rejected" })
    const paid     = await Application.countDocuments({ applicationWindow: req.params.id, status: "paid" })

    const totalAmount = await Application.aggregate([
      { $match: { applicationWindow: require("mongoose").Types.ObjectId.createFromHexString(req.params.id), status: { $in: ["approved", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } }
    ])

    res.json({
      total,
      pending,
      approved,
      rejected,
      paid,
      totalAmount: totalAmount[0]?.total || 0
    })

  } catch(err){
    console.error("Stats error:", err)
    res.status(500).json({ message: "Failed to load stats" })
  }
})

module.exports = router