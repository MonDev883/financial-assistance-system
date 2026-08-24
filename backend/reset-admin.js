require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")
const Staff    = require("./models/Staff")

const EMAIL        = "admin@cityhall.gov.ph"
const NEW_PASSWORD = "MonDev6058"   // ← change this

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const staff = await Staff.findOne({ email: EMAIL }).select("+password")

  if(!staff){
    console.log("No account found for " + EMAIL)
    process.exit(1)
  }

  staff.password = NEW_PASSWORD
  await staff.save()

  console.log("Password reset for " + EMAIL)
  process.exit(0)
})
.catch(err => { console.error(err.message); process.exit(1) })