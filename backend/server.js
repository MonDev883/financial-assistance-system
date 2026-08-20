// ── Load environment variables first
require("dotenv").config()

// ── Force DNS to use Google (fixes MongoDB Atlas SRV lookup)
const dns = require("dns")
dns.setServers(["8.8.8.8", "8.8.4.4"])

// ── Import packages
const express    = require("express")
const mongoose   = require("mongoose")
const cors       = require("cors")
const path       = require("path")
const helmet     = require("helmet")
const rateLimit  = require("express-rate-limit")
const compression = require("compression")

// ── Create Express app
const app = express()

// ── Security headers
// ── Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// ── Compression
app.use(compression())

// ── CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))

// ── Parse JSON
app.use(express.json({ limit: "10mb" }))

// ── Serve uploaded files (before rate limiter — images shouldn't count against the quota)
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// ── Global rate limiter (500 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      500,
  message:  { message: "Too many requests. Please try again after 15 minutes." }
})
app.use(globalLimiter)

// ── Stricter rate limiter for staff login (10 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { message: "Too many login attempts. Please try again after 15 minutes." }
})
app.use("/api/staff/login", loginLimiter)



// ── Routes
app.use("/api/applications", require("./routes/applicationRoutes"))
app.use("/api/staff",        require("./routes/staffRoutes"))
app.use("/api/windows",      require("./routes/windowRoutes"))
app.use("/api/batches",      require("./routes/batchRoutes"))

// ── Health check
app.get("/health", (req, res) => {
  res.json({
    status:    "OK",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime()
  })
})

// ── Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message)
    process.exit(1)
  })

// ── MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected")
})

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected")
})

// ── Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack)
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message
  })
})

// ── 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// ── Start server
const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log("🚀 Server running at http://localhost:" + PORT)
  console.log("📁 Environment: " + process.env.NODE_ENV)
})

// ── Handle uncaught errors
process.on("uncaughtException", err => {
  console.error("❌ Uncaught Exception:", err.message)
  process.exit(1)
})

process.on("unhandledRejection", reason => {
  console.error("❌ Unhandled Rejection:", reason)
  process.exit(1)
})

module.exports = app