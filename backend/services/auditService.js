const AuditLog = require("../models/AuditLog")

/**
 * Record a staff action. Fire-and-forget — an audit failure must never
 * break the operation being audited, but it must be visible in the logs.
 */
function recordAudit(req, { action, targetType, targetId, targetLabel, details }){
  if(!req.staff){
    console.error("⚠️ recordAudit called without req.staff — action: " + action)
    return
  }

  AuditLog.create({
    staff:      req.staff.id,
    staffName:  req.staff.fullName || "Unknown",
    staffEmail: req.staff.email    || "",
    action,
    targetType,
    targetId,
    targetLabel: targetLabel || "",
    details:     details || {},
    ipAddress:   req.ip
  }).catch(e => {
    console.error("⚠️ Audit write failed [" + action + "]:", e.message)
  })
}

module.exports = { recordAudit }