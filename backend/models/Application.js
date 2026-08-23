const mongoose = require("mongoose")

const applicationSchema = new mongoose.Schema({

  // ── Link to window ────────────────────
  applicationWindow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ApplicationWindow",
    required: true
  },

  // ── Reference number ──────────────────
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },

  // ── Personal information ──────────────
  lastName: {
    type: String,
    required: true,
    trim: true
  },

  firstName: {
    type: String,
    required: true,
    trim: true
  },

  middleName: {
    type: String,
    default: "",
    trim: true
  },

  dateOfBirth: {
    type: String,
    required: true
  },

  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Other"]
  },

  civilStatus: {
    type: String,
    required: true,
    enum: ["Single", "Married", "Widowed", "Separated"]
  },

  // ── Address ───────────────────────────
  houseNo: {
    type: String,
    required: true
  },

  street: {
    type: String,
    required: true
  },

  barangay: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  province: {
    type: String,
    required: true
  },

  zipCode: {
    type: String,
    required: true
  },

  // ── Contact ───────────────────────────
  contactNumber: {
    type: String,
    required: true
  },

    email: {
    type: String,
    default: "",
    lowercase: true,
    trim: true
  },

  // ── Assistance details ────────────────────
  assistanceType: {
    type: String,
    required: true,
    enum: ["Medical", "Burial", "Educational", "Calamity", "Other"]
  },

  // ── Selfie for identity verification ──────
  selfiePhotoPath: {
    type: String,
    required: true
  },

  

  // ── Auto-assigned amount ──────────────
  amountAssigned: {
    type: Number,
    default: 0
  },

  // ── Submission timestamp ──────────────
  submittedAt: {
    type: Date,
    default: Date.now
  },

// ── Payout batch assignment ───────────────
  payoutBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayoutBatch",
    default: null
  },

  // ── Approval workflow ─────────────────
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "paid"],
    default: "pending"
  },

  approvedAmount: {
    type: Number,
    default: 0
  },

  payDate: {
    type: Date,
    default: null
  },

  remarks: {
    type: String,
    default: ""
  },

  rejectionReason: {
    type: String,
    default: ""
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null
  },

   reviewedAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    default: null
  }
}, { timestamps: true })

// ── Indexes ────────────────────────────
// Dashboard query: equality fields first, sort field last
applicationSchema.index({ applicationWindow: 1, status: 1, submittedAt: -1 })

// Analytics groups by barangay
applicationSchema.index({ barangay: 1 })

// Database-level duplicate prevention, case-insensitive
applicationSchema.index(
  { applicationWindow: 1, lastName: 1, firstName: 1, dateOfBirth: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
)

module.exports = mongoose.model("Application", applicationSchema)