const express = require("express")
const router  = express.Router()
const bcrypt  = require("bcrypt")
const jwt     = require("jsonwebtoken")
const Staff   = require("../models/Staff")
const { protectStaff, protectAdmin } = require("../middleware/authMiddleware")

// ========================
// STAFF LOGIN
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if(!email || !password){
      return res.status(400).json({ message: "Email and password required" })
    }

    // ── Find staff by email
    const staff = await Staff.findOne({ email }).select("+password")
    if(!staff){
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // ── Check if account is active
    if(!staff.active){
      return res.status(403).json({ message: "Account is deactivated" })
    }

    // ── Compare password
    const isMatch = await bcrypt.compare(password, staff.password)
    if(!isMatch){
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // ── Create JWT token with type: "staff"
    const token = jwt.sign(
      {
        id:   staff._id,
        type: "staff",
        role: staff.role
      },
           process.env.JWT_SECRET,
      { expiresIn: "8h" }
    )

    // ── Audit trail
    staff.lastLogin = new Date()
    await staff.save()

    res.json({
      token,
      staff: {
        id:       staff._id,
        fullName: staff.fullName,
        email:    staff.email,
        role:     staff.role
      }
    })

  } catch(err){
    console.error("Staff login error:", err)
    res.status(500).json({ message: "Login failed" })
  }
})

// ========================
// GET STAFF PROFILE
// ========================
router.get("/profile", protectStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff.id).select("-password")
    if(!staff){
      return res.status(404).json({ message: "Staff not found" })
    }
    res.json(staff)
  } catch(err){
    res.status(500).json({ message: "Failed to load profile" })
  }
})

// ========================
// CREATE STAFF (ADMIN ONLY)
// ========================
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body

        if(!fullName || !email || !password){
      return res.status(400).json({ message: "All fields required" })
    }

    if(password.length < 8){
      return res.status(400).json({ message: "Password must be at least 8 characters" })
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      return res.status(400).json({ message: "Invalid email format" })
    }

    const existing = await Staff.findOne({ email })
    if(existing){
      return res.status(400).json({ message: "Email already exists" })
    }

    const staff = await Staff.create({
      fullName,
      email,
      password,
      role: role || "staff"
    })

    res.status(201).json({
      message: "Staff account created",
      staff: {
        id:       staff._id,
        fullName: staff.fullName,
        email:    staff.email,
        role:     staff.role
      }
    })

     } catch(err){
    if(err.name === "ValidationError"){
      return res.status(400).json({ message: Object.values(err.errors)[0].message })
    }
    if(err.code === 11000){
      return res.status(400).json({ message: "Email already exists" })
    }
    console.error("Create staff error:", err)
    res.status(500).json({ message: "Failed to create staff" })
  }
})

// ========================
// GET ALL STAFF (ADMIN ONLY)
// ========================
router.get("/all", protectAdmin, async (req, res) => {
  try {
    const staffList = await Staff.find().select("-password")
    res.json(staffList)
  } catch(err){
    res.status(500).json({ message: "Failed to load staff" })
  }
})

module.exports = router