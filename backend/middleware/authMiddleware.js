const jwt   = require("jsonwebtoken")
const Staff = require("../models/Staff")

// ── Pull the token out of the Authorization header
function extractToken(req){
  const authHeader = req.headers.authorization
  if(!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null
  return authHeader.split(" ")[1] || null
}

// ── Distinguish an expired session from a broken token
function handleError(res, err){
  if(err.name === "TokenExpiredError"){
    return res.status(401).json({
      message: "Session expired. Please log in again.",
      code:    "TOKEN_EXPIRED"
    })
  }
  return res.status(401).json({ message: "Invalid token", code: "TOKEN_INVALID" })
}

// ── Factory: builds both the staff and admin guards from one implementation
const buildStaffGuard = (requireAdmin = false) => async (req, res, next) => {
  try {
    const token = extractToken(req)
    if(!token){
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if(decoded.type !== "staff"){
      return res.status(403).json({ message: "Access denied. Staff only." })
    }

    // ── Live DB check — this is what makes deactivation actually work
    const staff = await Staff.findById(decoded.id).select("-password")

    if(!staff || staff.active === false){
      return res.status(401).json({ message: "Account no longer active" })
    }

    // ── Role read from the DB, not the token — demotions apply immediately
    if(requireAdmin && staff.role !== "admin"){
      return res.status(403).json({ message: "Access denied. Admins only." })
    }

    req.staff = { id: staff._id, role: staff.role, fullName: staff.fullName }
    next()

  } catch(err){
    return handleError(res, err)
  }
}

const protectClaimant = (req, res, next) => {
  try {
    const token = extractToken(req)
    if(!token){
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ── Was missing before: a staff token used to pass as a claimant
    if(decoded.type !== "claimant"){
      return res.status(403).json({ message: "Access denied. Claimants only." })
    }

    req.claimant = decoded
    next()

  } catch(err){
    return handleError(res, err)
  }
}

module.exports = {
  protectClaimant,
  protectStaff: buildStaffGuard(false),
  protectAdmin: buildStaffGuard(true)
}