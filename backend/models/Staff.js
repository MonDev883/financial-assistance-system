const mongoose = require("mongoose")
const bcrypt   = require("bcrypt")

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
    type:      String,
    required:  true,
    minlength: 8,
    select:    false      // never returned unless explicitly requested
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

  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// ⚠️ This hook only runs on .save() — NOT on findByIdAndUpdate or updateOne.
// To change a password:  staff.password = newPassword; await staff.save()
// Using findByIdAndUpdate stores plaintext and login breaks permanently.
staffSchema.pre("save", async function(){
  if(!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, 12)
})

module.exports = mongoose.model("Staff", staffSchema)