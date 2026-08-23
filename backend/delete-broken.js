require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")

// ── Must match find-broken.js exactly
const BROKEN_FILTER = {
  $or: [
    { firstName: { $in: [null, ""] } },
    { lastName:  { $in: [null, ""] } },
    { firstName: { $exists: false } },
    { lastName:  { $exists: false } }
  ]
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const col = mongoose.connection.db.collection("applications")

  const count = await col.countDocuments(BROKEN_FILTER)
  console.log("About to delete " + count + " records...")

  const result = await col.deleteMany(BROKEN_FILTER)
  console.log(result.deletedCount + " records deleted")

  process.exit(0)
})
.catch(err => { console.error(err.message); process.exit(1) })