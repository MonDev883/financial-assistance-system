/**
 * seed-demo.js — populate the system with realistic demo data
 *
 * Creates three application windows (one open, two closed), around twenty
 * applications spread across every status, and two payout batches.
 *
 * Run from the backend folder:   node seed-demo.js
 *
 * Staff accounts are never touched. Run wipe-all.js first if you want a
 * clean slate — this script does not delete anything.
 */

require("dotenv").config()

const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

const mongoose          = require("mongoose")
const Application       = require("./models/Application")
const ApplicationWindow = require("./models/ApplicationWindow")
const PayoutBatch       = require("./models/PayoutBatch")
const Staff             = require("./models/Staff")

// ── Placeholder portraits. Generated initials, not photographs of real
//    people — appropriate for a public demo.
function avatar(first, last){
  const name = encodeURIComponent(first + " " + last)
  return "https://ui-avatars.com/api/?name=" + name +
         "&size=400&background=DC2626&color=fff&bold=true&format=png"
}

// ── Reference numbers, sequential so the demo data reads tidily
let refCounter = 0
function nextRef(year){
  refCounter++
  return "FA-" + year + "-D" + String(refCounter).padStart(4, "0")
}

function daysAgo(n){
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysAhead(n){
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ── People. Distinct names and birth dates so the unique index is satisfied.
const PEOPLE = [
  { last: "Dela Cruz", first: "Maricel",  mid: "Santos",   dob: "1985-03-14", gender: "Female", civil: "Married",   brgy: "Barangay Tangos",     phone: "09171234501" },
  { last: "Reyes",     first: "Joselito", mid: "Bautista", dob: "1978-11-02", gender: "Male",   civil: "Married",   brgy: "Barangay Tanza",      phone: "09171234502" },
  { last: "Mendoza",   first: "Angelica", mid: "Cruz",     dob: "2003-06-21", gender: "Female", civil: "Single",    brgy: "Barangay Sipac-Almacen", phone: "09171234503" },
  { last: "Villanueva",first: "Rodel",    mid: "Aquino",   dob: "1992-01-09", gender: "Male",   civil: "Single",    brgy: "Barangay Navotas East", phone: "09171234504" },
  { last: "Bautista",  first: "Corazon",  mid: "Ramos",    dob: "1961-08-30", gender: "Female", civil: "Widowed",   brgy: "Barangay Tangos",     phone: "09171234505" },
  { last: "Santos",    first: "Emmanuel", mid: "Dizon",    dob: "2002-04-17", gender: "Male",   civil: "Single",    brgy: "Barangay Daanghari",  phone: "09171234506" },
  { last: "Aquino",    first: "Rosalinda",mid: "Flores",   dob: "1970-12-05", gender: "Female", civil: "Separated", brgy: "Barangay Tanza",      phone: "09171234507" },
  { last: "Ramos",     first: "Benjamin", mid: "Torres",   dob: "1955-02-11", gender: "Male",   civil: "Widowed",   brgy: "Barangay Navotas West", phone: "09171234508" },
  { last: "Flores",    first: "Jasmine",  mid: "Garcia",   dob: "2004-09-23", gender: "Female", civil: "Single",    brgy: "Barangay Sipac-Almacen", phone: "09171234509" },
  { last: "Garcia",    first: "Arnel",    mid: "Mercado",  dob: "1988-07-19", gender: "Male",   civil: "Married",   brgy: "Barangay Daanghari",  phone: "09171234510" },
  { last: "Torres",    first: "Melinda",  mid: "Pascual",  dob: "1974-05-08", gender: "Female", civil: "Married",   brgy: "Barangay Tangos",     phone: "09171234511" },
  { last: "Castillo",  first: "Ferdinand",mid: "Lim",      dob: "1996-10-27", gender: "Male",   civil: "Single",    brgy: "Barangay Navotas East", phone: "09171234512" },
  { last: "Domingo",   first: "Cristina", mid: "Valdez",   dob: "1983-03-03", gender: "Female", civil: "Married",   brgy: "Barangay Tanza",      phone: "09171234513" },
  { last: "Pascual",   first: "Ronaldo",  mid: "Salazar",  dob: "1967-06-14", gender: "Male",   civil: "Married",   brgy: "Barangay Navotas West", phone: "09171234514" },
  { last: "Salazar",   first: "Divina",   mid: "Ocampo",   dob: "1990-08-25", gender: "Female", civil: "Single",    brgy: "Barangay Daanghari",  phone: "09171234515" },
  { last: "Ocampo",    first: "Michael",  mid: "Rivera",   dob: "2001-11-12", gender: "Male",   civil: "Single",    brgy: "Barangay Sipac-Almacen", phone: "09171234516" },
  { last: "Rivera",    first: "Lourdes",  mid: "Manalo",   dob: "1959-01-28", gender: "Female", civil: "Widowed",   brgy: "Barangay Tangos",     phone: "09171234517" },
  { last: "Manalo",    first: "Gerardo",  mid: "Bernardo", dob: "1980-04-06", gender: "Male",   civil: "Married",   brgy: "Barangay Tanza",      phone: "09171234518" },
  { last: "Bernardo",  first: "Kristine", mid: "Alonzo",   dob: "2005-02-15", gender: "Female", civil: "Single",    brgy: "Barangay Navotas East", phone: "09171234519" },
  { last: "Alonzo",    first: "Teresita", mid: "Cordero",  dob: "1963-09-01", gender: "Female", civil: "Widowed",   brgy: "Barangay Daanghari",  phone: "09171234520" }
]

const STREETS = [
  { no: "12",  street: "Rizal Street" },
  { no: "45",  street: "Bonifacio Avenue" },
  { no: "7",   street: "Mabini Street" },
  { no: "231", street: "M.H. del Pilar Street" },
  { no: "88",  street: "Del Monte Street" },
  { no: "104", street: "Estrella Street" },
  { no: "56",  street: "Gomez Street" },
  { no: "19",  street: "Luna Street" }
]

function addressFor(i){
  const a = STREETS[i % STREETS.length]
  return {
    houseNo:  a.no,
    street:   a.street,
    city:     "Navotas City",
    province: "Metro Manila",
    zipCode:  "1485"
  }
}

mongoose.connect(process.env.MONGO_URI).then(async () => {

  // ── Need a staff member to attribute reviews to
  const admin = await Staff.findOne({ role: "admin" })

  if(!admin){
    console.error("No admin account found. Run your staff seed script first.")
    process.exit(1)
  }

  console.log("Reviewing staff: " + admin.email)

  const year = new Date().getFullYear()

  // ══════════════════════════════════════════════
  // WINDOWS
  // ══════════════════════════════════════════════

  // ── Currently open. This is the one the public link points at.
  const openWindow = await ApplicationWindow.create({
    title:       "Educational Assistance for College Students",
    description: "Tulong-aral para sa mga mag-aaral. Financial support for " +
                 "college students from low-income families in Navotas City. " +
                 "One claim per student per semester.",
    startDate:   daysAgo(3),
    endDate:     daysAhead(11),
    amounts: {
      Medical:     0,
      Burial:      0,
      Educational: 10000,
      Calamity:    0,
      Other:       0
    },
    isActive:  true,
    createdBy: admin._id
  })

  // ── Closed, fully processed — this is where the paid records live
  const medicalWindow = await ApplicationWindow.create({
    title:       "Medical and Burial Assistance Program",
    description: "Ayuda para sa may karamdaman at nasawi. Assistance for " +
                 "hospital bills, medicines, and funeral expenses for " +
                 "indigent families.",
    startDate:   daysAgo(75),
    endDate:     daysAgo(60),
    amounts: {
      Medical:     15000,
      Burial:      20000,
      Educational: 0,
      Calamity:    0,
      Other:       5000
    },
    isActive:  false,
    createdBy: admin._id
  })

  // ── Closed, older
  const calamityWindow = await ApplicationWindow.create({
    title:       "Calamity Relief — Typhoon Response",
    description: "Emergency assistance for families whose homes were damaged " +
                 "by the recent typhoon. Walang maiiwan.",
    startDate:   daysAgo(140),
    endDate:     daysAgo(126),
    amounts: {
      Medical:     0,
      Burial:      0,
      Educational: 0,
      Calamity:    8000,
      Other:       0
    },
    isActive:  false,
    createdBy: admin._id
  })

  console.log("3 application windows created")

  // ══════════════════════════════════════════════
  // BATCHES (on the closed medical window)
  // ══════════════════════════════════════════════

  const batch1 = await PayoutBatch.create({
    applicationWindow: medicalWindow._id,
    batchNumber:  1,
    batchName:    "Batch 1 — Tangos and Tanza",
    payDate:      daysAgo(50),
    startTime:    "08:00",
    endTime:      "12:00",
    maxCapacity:  50,
    barangay:     "Barangay Tangos",
    notes:        "Please bring a valid ID and your reference number.",
    createdBy:    admin._id
  })

  const batch2 = await PayoutBatch.create({
    applicationWindow: medicalWindow._id,
    batchNumber:  2,
    batchName:    "Batch 2 — Daanghari and Sipac-Almacen",
    payDate:      daysAgo(49),
    startTime:    "13:00",
    endTime:      "17:00",
    maxCapacity:  50,
    barangay:     "",
    notes:        "Senior citizens may claim ahead of the queue.",
    createdBy:    admin._id
  })

  console.log("2 payout batches created")

  // ══════════════════════════════════════════════
  // APPLICATIONS
  // ══════════════════════════════════════════════

  const docs = []

  function build(person, i, window, type, status, extra = {}){
    const addr = addressFor(i)

    return {
      applicationWindow: window._id,
      referenceNumber:   nextRef(year),
      lastName:          person.last,
      firstName:         person.first,
      middleName:        person.mid,
      dateOfBirth:       person.dob,
      gender:            person.gender,
      civilStatus:       person.civil,
      houseNo:           addr.houseNo,
      street:            addr.street,
      barangay:          person.brgy,
      city:              addr.city,
      province:          addr.province,
      zipCode:           addr.zipCode,
      contactNumber:     person.phone,
      email:             "",
      assistanceType:    type,
      selfiePhotoPath:   avatar(person.first, person.last),
      amountAssigned:    window.amounts[type] || 0,
      status,
      submittedAt:       extra.submittedAt || daysAgo(2),
      ...extra
    }
  }

  // ── OPEN WINDOW: a realistic mid-review mix
  //    6 pending, 4 approved (awaiting batch assignment), 1 rejected

  docs.push(build(PEOPLE[2],  2,  openWindow, "Educational", "pending", { submittedAt: daysAgo(2) }))
  docs.push(build(PEOPLE[5],  5,  openWindow, "Educational", "pending", { submittedAt: daysAgo(2) }))
  docs.push(build(PEOPLE[8],  8,  openWindow, "Educational", "pending", { submittedAt: daysAgo(1) }))
  docs.push(build(PEOPLE[11], 11, openWindow, "Educational", "pending", { submittedAt: daysAgo(1) }))
  docs.push(build(PEOPLE[15], 15, openWindow, "Educational", "pending", { submittedAt: daysAgo(1) }))
  docs.push(build(PEOPLE[18], 18, openWindow, "Educational", "pending", { submittedAt: new Date() }))

  docs.push(build(PEOPLE[3],  3,  openWindow, "Educational", "approved", {
    submittedAt:    daysAgo(3),
    approvedAmount: 10000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(2),
    remarks:        "Enrollment certificate verified."
  }))
  docs.push(build(PEOPLE[9],  9,  openWindow, "Educational", "approved", {
    submittedAt:    daysAgo(3),
    approvedAmount: 10000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(2)
  }))
  docs.push(build(PEOPLE[13], 13, openWindow, "Educational", "approved", {
    submittedAt:    daysAgo(3),
    approvedAmount: 10000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(1),
    remarks:        "Second-year student, good academic standing."
  }))
  docs.push(build(PEOPLE[19], 19, openWindow, "Educational", "approved", {
    submittedAt:    daysAgo(2),
    approvedAmount: 10000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(1)
  }))

  docs.push(build(PEOPLE[1],  1,  openWindow, "Educational", "rejected", {
    submittedAt:     daysAgo(3),
    reviewedBy:      admin._id,
    reviewedAt:      daysAgo(2),
    rejectionReason: "Applicant is not currently enrolled. Please reapply " +
                     "once enrollment for the semester is confirmed."
  }))

  // ── MEDICAL WINDOW (closed): fully processed, batched, paid

  docs.push(build(PEOPLE[0],  0,  medicalWindow, "Medical", "paid", {
    submittedAt:    daysAgo(70),
    approvedAmount: 15000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(65),
    payoutBatch:    batch1._id,
    payDate:        daysAgo(50),
    paidAt:         daysAgo(50),
    paidBy:         admin._id,
    remarks:        "Hospital billing statement attached."
  }))
  docs.push(build(PEOPLE[4],  4,  medicalWindow, "Burial", "paid", {
    submittedAt:    daysAgo(70),
    approvedAmount: 20000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(65),
    payoutBatch:    batch1._id,
    payDate:        daysAgo(50),
    paidAt:         daysAgo(50),
    paidBy:         admin._id
  }))
  docs.push(build(PEOPLE[7],  7,  medicalWindow, "Medical", "paid", {
    submittedAt:    daysAgo(69),
    approvedAmount: 15000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(64),
    payoutBatch:    batch1._id,
    payDate:        daysAgo(50),
    paidAt:         daysAgo(50),
    paidBy:         admin._id,
    remarks:        "Senior citizen, maintenance medication."
  }))
  docs.push(build(PEOPLE[10], 10, medicalWindow, "Medical", "paid", {
    submittedAt:    daysAgo(68),
    approvedAmount: 15000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(63),
    payoutBatch:    batch2._id,
    payDate:        daysAgo(49),
    paidAt:         daysAgo(49),
    paidBy:         admin._id
  }))
  docs.push(build(PEOPLE[14], 14, medicalWindow, "Other", "paid", {
    submittedAt:    daysAgo(67),
    approvedAmount: 5000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(63),
    payoutBatch:    batch2._id,
    payDate:        daysAgo(49),
    paidAt:         daysAgo(49),
    paidBy:         admin._id
  }))
  docs.push(build(PEOPLE[16], 16, medicalWindow, "Burial", "paid", {
    submittedAt:    daysAgo(66),
    approvedAmount: 20000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(62),
    payoutBatch:    batch2._id,
    payDate:        daysAgo(49),
    paidAt:         daysAgo(49),
    paidBy:         admin._id
  }))

  docs.push(build(PEOPLE[6],  6,  medicalWindow, "Medical", "rejected", {
    submittedAt:     daysAgo(70),
    reviewedBy:      admin._id,
    reviewedAt:      daysAgo(65),
    rejectionReason: "Incomplete requirements — no medical certificate or " +
                     "billing statement submitted."
  }))

  // ── CALAMITY WINDOW (closed, older): a couple of paid records so the
  //    cross-window claim history has something to surface

  docs.push(build(PEOPLE[0],  0,  calamityWindow, "Calamity", "paid", {
    submittedAt:    daysAgo(135),
    approvedAmount: 8000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(130),
    payDate:        daysAgo(125),
    paidAt:         daysAgo(125),
    paidBy:         admin._id,
    remarks:        "Roof damage verified by barangay official."
  }))
  docs.push(build(PEOPLE[12], 12, calamityWindow, "Calamity", "paid", {
    submittedAt:    daysAgo(134),
    approvedAmount: 8000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(130),
    payDate:        daysAgo(125),
    paidAt:         daysAgo(125),
    paidBy:         admin._id
  }))
  docs.push(build(PEOPLE[17], 17, calamityWindow, "Calamity", "paid", {
    submittedAt:    daysAgo(134),
    approvedAmount: 8000,
    reviewedBy:     admin._id,
    reviewedAt:     daysAgo(129),
    payDate:        daysAgo(125),
    paidAt:         daysAgo(125),
    paidBy:         admin._id
  }))

  await Application.insertMany(docs)

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════

  const counts = {
    pending:  await Application.countDocuments({ status: "pending" }),
    approved: await Application.countDocuments({ status: "approved" }),
    rejected: await Application.countDocuments({ status: "rejected" }),
    paid:     await Application.countDocuments({ status: "paid" })
  }

  console.log("\n" + docs.length + " applications created")
  console.log("  pending:  " + counts.pending)
  console.log("  approved: " + counts.approved)
  console.log("  rejected: " + counts.rejected)
  console.log("  paid:     " + counts.paid)

  console.log("\nPublic application link for the open window:")
  console.log("  /apply/" + openWindow._id)

  console.log("\nNote: Maricel Dela Cruz appears in two windows — open her")
  console.log("review modal to see the cross-window claim history panel.")

  process.exit(0)
})
.catch(err => {
  console.error("Seed failed:", err.message)
  process.exit(1)
})
