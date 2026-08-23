require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose = require("mongoose")

// ── The filter used by BOTH scripts — keep them identical
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

  // ── Records with no name
  const broken = await col.find(BROKEN_FILTER)
    .project({ referenceNumber: 1, firstName: 1, lastName: 1, status: 1 })
    .toArray()

  console.log("\n=== Records with no name: " + broken.length + " ===")
  broken.forEach(r => {
    console.log("  " + r.referenceNumber + "  [" + r.status + "]  " +
                (r.lastName || "(none)") + ", " + (r.firstName || "(none)"))
  })

  // ── Approved or paid at zero pesos
  const zeroAmount = await col.find({
    amountAssigned: { $in: [0, null] },
    status: { $in: ["approved", "paid"] }
  }).project({ referenceNumber: 1, firstName: 1, lastName: 1, assistanceType: 1 }).toArray()

  console.log("\n=== Approved/paid with no amount: " + zeroAmount.length + " ===")
  zeroAmount.forEach(r => {
    console.log("  " + r.referenceNumber + "  " + r.lastName + ", " +
                r.firstName + "  (" + r.assistanceType + ")")
  })

  console.log("\nTotal applications: " + await col.countDocuments())

  process.exit(0)
})
.catch(err => { console.error(err.message); process.exit(1) })