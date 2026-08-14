const jwt = require("jsonwebtoken")

// ── LINE 1 ── Protect claimant routes
const protectClaimant = (req, res, next) => {
  try {

    // ── LINE 2 ── Get token from Authorization header
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ")){
      return res.status(401).json({ message: "No token provided" })
    }

    // ── LINE 3 ── Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(" ")[1]

    // ── LINE 4 ── Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ── LINE 5 ── Attach claimant info to the request
    req.claimant = decoded

    // ── LINE 6 ── Continue to the next function
    next()

  } catch(err){
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

// ── LINE 7 ── Protect staff routes
const protectStaff = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ")){
      return res.status(401).json({ message: "No token provided" })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ── LINE 8 ── Make sure this token belongs to a staff member
    if(decoded.type !== "staff"){
      return res.status(403).json({ message: "Access denied. Staff only." })
    }

    req.staff = decoded
    next()

  } catch(err){
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

// ── LINE 9 ── Protect admin-only routes
const protectAdmin = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ")){
      return res.status(401).json({ message: "No token provided" })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ── LINE 10 ── Must be staff AND have admin role
    if(decoded.type !== "staff" || decoded.role !== "admin"){
      return res.status(403).json({ message: "Access denied. Admins only." })
    }

    req.staff = decoded
    next()

  } catch(err){
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

module.exports = { protectClaimant, protectStaff, protectAdmin }