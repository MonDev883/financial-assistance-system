require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")

async function createStaff(){
  await mongoose.connect(process.env.MONGO_URI)
  console.log("Connected to MongoDB")

  const Staff = require("../models/Staff")

  const existing = await Staff.findOne({ email: "admin@cityhall.gov.ph" })

  if(existing){
    console.log("Staff already exists")
    process.exit(0)
  }

  await Staff.create({
    fullName: "City Hall Admin",
    email:    "admin@cityhall.gov.ph",
    password: "Admin1234",
    role:     "admin",
    active:   true
  })

  console.log("✅ Staff admin created")
  console.log("   Email:    admin@cityhall.gov.ph")
  console.log("   Password: Admin1234")
  console.log("   Role:     admin")
  process.exit(0)
}

createStaff().catch(err => {
  console.error("❌ Failed:", err)
  process.exit(1)
})