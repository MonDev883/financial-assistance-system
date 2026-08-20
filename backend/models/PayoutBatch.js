const mongoose = require("mongoose")

const payoutBatchSchema = new mongoose.Schema({

  // ── Which window this batch belongs to
  applicationWindow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ApplicationWindow",
    required: true
  },

  // ── Batch number (1, 2, 3...)
  batchNumber: {
    type: Number,
    required: true
  },

  // ── Batch label shown to claimants
  batchName: {
    type: String,
    required: true
  },

  // ── Payout schedule
  payDate: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  // ── Maximum claimants per batch
  maxCapacity: {
    type: Number,
    required: true,
    default: 50
  },

  // ── Barangay assignment (optional)
  barangay: {
    type: String,
    default: ""
  },

  // ── Optional notes
  notes: {
    type: String,
    default: ""
  },

  // ── Who created this batch
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model("PayoutBatch", payoutBatchSchema)