const mongoose = require("mongoose")

const staffSchema = new mongoose.Schema({

  // ── Account info ──────────────────────
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

  // ── Role ──────────────────────────────
  role: {
    type: String,
    enum: ["staff", "admin"],
    default: "staff"
  },

  // ── Status ────────────────────────────
  active: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

})

// ── Hash password before saving ───────
staffSchema.pre("save", async function(){
  if(!this.isModified("password")) return

  const bcrypt = require("bcrypt")
  this.password = await bcrypt.hash(this.password, 10)
})

module.exports = mongoose.model("Staff", staffSchema)