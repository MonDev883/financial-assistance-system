require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")
const Staff    = require("./models/Staff")

// ── Change these two lines as needed
const EMAIL        = "mae@cityofnavotas.gov.ph"
const NEW_PASSWORD = "StaffTest123"

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const staff = await Staff.findOne({ email: EMAIL })

  if(!staff){
    console.log("No account found for " + EMAIL)
    process.exit(1)
  }

  // ── Must use .save() — the hashing hook does NOT run on findByIdAndUpdate
  staff.password = NEW_PASSWORD
  await staff.save()

  console.log("Password reset for " + EMAIL)
  console.log("New password: " + NEW_PASSWORD)
  process.exit(0)
})
.catch(err => {
  console.error("Failed:", err.message)
  process.exit(1)
})