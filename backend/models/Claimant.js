const mongoose = require("mongoose")

const claimantSchema = new mongoose.Schema({

  // ── Account credentials ──────────────
  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  // ── Account status ────────────────────
  active: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

})

// ── Hash password automatically before saving ──
claimantSchema.pre("save", async function(){
  if(!this.isModified("password")) return

  const bcrypt = require("bcrypt")
  this.password = await bcrypt.hash(this.password, 10)
})

module.exports = mongoose.model("Claimant", claimantSchema)