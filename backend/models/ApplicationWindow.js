const mongoose = require("mongoose")

const applicationWindowSchema = new mongoose.Schema({

  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },

  title:       { type: String, required: true },
  description: { type: String, default: "" },

  // ── Amount per assistance type ────────
  amounts: {
    Medical:     { type: Number, default: 0 },
    Burial:      { type: Number, default: 0 },
    Educational: { type: Number, default: 0 },
    Calamity:    { type: Number, default: 0 },
    Other:       { type: Number, default: 0 }
  },

  isActive: { type: Boolean, default: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff"
  },

  createdAt: { type: Date, default: Date.now }

})

applicationWindowSchema.methods.isOpen = function(){
  const now = new Date()
  return this.isActive &&
    now >= new Date(this.startDate) &&
    now <= new Date(this.endDate)
}

module.exports = mongoose.model("ApplicationWindow", applicationWindowSchema)