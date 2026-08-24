require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose   = require("mongoose")
const cloudinary = require("cloudinary").v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db

  const apps    = await db.collection("applications").deleteMany({})
  const batches = await db.collection("payoutbatches").deleteMany({})
  const windows = await db.collection("applicationwindows").deleteMany({})

  console.log(apps.deletedCount    + " applications deleted")
  console.log(batches.deletedCount + " batches deleted")
  console.log(windows.deletedCount + " windows deleted")

  // ── Remove the orphaned selfies too
  try {
    const r = await cloudinary.api.delete_resources_by_prefix("financial-assistance/selfies")
    console.log(Object.keys(r.deleted || {}).length + " selfies deleted from Cloudinary")
  } catch(e){
    console.error("Cloudinary cleanup failed:", e.message)
  }

  // ── Confirm staff survived
  const staff = await db.collection("staffs")
    .find({}, { projection: { email: 1, role: 1, active: 1 } })
    .toArray()

  console.log("\nStaff accounts kept: " + staff.length)
  staff.forEach(s => console.log("  " + s.email + "  [" + s.role + "]  active: " + s.active))

  process.exit(0)
})
.catch(err => { console.error(err.message); process.exit(1) })