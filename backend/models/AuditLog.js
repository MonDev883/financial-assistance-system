const mongoose = require("mongoose")

const auditLogSchema = new mongoose.Schema({
  // ── Who
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },
  staffName:  { type: String, required: true },   // denormalized so the log
  staffEmail: { type: String, required: true },   // survives account deletion

  // ── What
  action: {
    type: String,
    required: true,
    enum: [
      "application_approved",
      "application_rejected",
      "application_paid",
      "bulk_approved",
      "batch_created",
      "batch_assigned",
      "batch_removed",
      "window_created",
      "window_updated",
      "window_closed",
      "staff_created"
    ]
  },

  // ── What it was done to
  targetType: {
    type: String,
    enum: ["Application", "ApplicationWindow", "PayoutBatch", "Staff"],
    required: true
  },
  targetId:    { type: mongoose.Schema.Types.ObjectId },
  targetLabel: { type: String },   // reference number or title, for display

  // ── Context. Keep this minimal — amounts and reasons, not personal details.
  details: { type: Object, default: {} },

  ipAddress: { type: String }
}, { timestamps: true })

// ── Newest first, filterable by staff member
auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ staff: 1, createdAt: -1 })
auditLogSchema.index({ action: 1, createdAt: -1 })

module.exports = mongoose.model("AuditLog", auditLogSchema)