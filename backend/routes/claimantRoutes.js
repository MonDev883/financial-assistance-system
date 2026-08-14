const express  = require("express")
const router   = express.Router()
const bcrypt   = require("bcrypt")
const jwt      = require("jsonwebtoken")
const Claimant = require("../models/Claimant")
const { protectClaimant } = require("../middleware/authMiddleware")

// ========================
// REGISTER
// ========================
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body

    // ── LINE 1 ── Validate required fields
    if(!fullName || !email || !password || !phone || !address){
      return res.status(400).json({ message: "All fields are required" })
    }

    // ── LINE 2 ── Check if email already exists
    const existing = await Claimant.findOne({ email })
    if(existing){
      return res.status(400).json({ message: "Email already registered" })
    }

    // ── LINE 3 ── Create the claimant (password auto-hashed by model)
    const claimant = await Claimant.create({
      fullName,
      email,
      password,
      phone,
      address
    })

    // ── LINE 4 ── Return success
    res.status(201).json({
      message: "Account created successfully. You can now login."
    })

  } catch(err){
    console.error("Register error:", err)
    res.status(500).json({ message: "Registration failed" })
  }
})

// ========================
// LOGIN
// ========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // ── LINE 1 ── Validate fields
    if(!email || !password){
      return res.status(400).json({ message: "Email and password required" })
    }

    // ── LINE 2 ── Find claimant by email
    const claimant = await Claimant.findOne({ email })
    if(!claimant){
      return res.status(400).json({ message: "Invalid email or password" })
    }

    //To be continue tomorrow

    // ── LINE 3 ── Check if account is active
    if(!claimant.active){
      return res.status(403).json({ message: "Account is deactivated" })
    }

    // ── LINE 4 ── Compare password with hashed version
    const isMatch = await bcrypt.compare(password, claimant.password)
    if(!isMatch){
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // ── LINE 5 ── Create JWT token
    const token = jwt.sign(
      {
        id:   claimant._id,
        type: "claimant"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    // ── LINE 6 ── Return token and basic info
    res.json({
      token,
      claimant: {
        id:       claimant._id,
        fullName: claimant.fullName,
        email:    claimant.email
      }
    })

  } catch(err){
    console.error("Login error:", err)
    res.status(500).json({ message: "Login failed" })
  }
})

// ========================
// GET PROFILE
// ========================
router.get("/profile", protectClaimant, async (req, res) => {
  try {

    // ── LINE 1 ── Find claimant by ID from token
    const claimant = await Claimant.findById(req.claimant.id)
      .select("-password")

    if(!claimant){
      return res.status(404).json({ message: "Claimant not found" })
    }

    res.json(claimant)

  } catch(err){
    console.error("Profile error:", err)
    res.status(500).json({ message: "Failed to load profile" })
  }
})

module.exports = router