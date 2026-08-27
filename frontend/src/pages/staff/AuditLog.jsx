import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

// ── Human-readable labels for the action enum
const ACTION_LABELS = {
  application_approved: "Approved application",
  application_rejected: "Rejected application",
  application_paid:     "Marked as paid",
  bulk_approved:        "Bulk approved",
  batch_created:        "Created batch",
  batch_assigned:       "Assigned to batch",
  batch_removed:        "Removed from batch",
  window_created:       "Created window",
  window_updated:       "Updated window",
  window_closed:        "Closed window",
  staff_created:        "Created staff account"
}

// ── Colour by the kind of action, so the table scans quickly
function actionStyle(action){
  if(action.includes("approved") || action.includes("created")) return "bg-green-100 text-green-700"
  if(action.includes("rejected") || action.includes("closed") || action.includes("removed")) return "bg-red-100 text-red-700"
  if(action.includes("paid"))     return "bg-blue-100 text-blue-700"
  return "bg-gray-100 text-gray-700"
}

function formatDateTime(d){
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  })
}

// ── Render the details object as readable lines
function renderDetails(details){
  if(!details || Object.keys(details).length === 0) return null

  const parts = []

  if(details.assistanceType) parts.push(details.assistanceType)
  if(details.amount)         parts.push("₱" + Number(details.amount).toLocaleString())
  if(details.count)          parts.push(details.count + " applicant(s)")
  if(details.timeSlot)       parts.push(details.timeSlot)
  if(details.role)           parts.push("role: " + details.role)
  if(details.reason)         parts.push("reason: " + details.reason)
  if(details.remarks)        parts.push("remarks: " + details.remarks)
  if(details.changed)        parts.push("changed: " + details.changed.join(", "))
  if(details.pendingAtClose) parts.push(details.pendingAtClose + " still pending")

  return parts.length > 0 ? parts.join(" · ") : null
}

function AuditLogPage(){

  const navigate = useNavigate()

  const [logs, setLogs]       = useState([])
  const [actors, setActors]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [total, setTotal]     = useState(0)

  const [filters, setFilters] = useState({
    staff:  "",
    action: "",
    from:   "",
    to:     "",
    search: ""
  })

  const [searchInput, setSearchInput] = useState("")

  // ── Admin only
  useEffect(() => {
    const stored = localStorage.getItem("staff")
    if(!stored){ navigate("/staff/login"); return }

    const staffData = JSON.parse(stored)
    if(staffData.role !== "admin"){
      navigate("/staff/dashboard")
      return
    }

    loadActors()
  }, [])

  // ── Debounce the free-text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }))
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    loadLogs()
  }, [filters, page])

  async function loadActors(){
    try {
      const res = await API.get("/audit/actors")
      setActors(res.data)
    } catch(err){
      console.error("Failed to load actors:", err)
    }
  }

  async function loadLogs(){
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if(filters.staff)  params.append("staff",  filters.staff)
      if(filters.action) params.append("action", filters.action)
      if(filters.from)   params.append("from",   filters.from)
      if(filters.to)     params.append("to",     filters.to)
      if(filters.search) params.append("search", filters.search)
      params.append("page", page)

      const res = await API.get("/audit?" + params.toString())

      setLogs(res.data.logs)
      setPages(res.data.pages)
      setTotal(res.data.total)

    } catch(err){
      console.error("Failed to load audit log:", err)
    } finally {
      setLoading(false)
    }
  }

  function updateFilter(key, value){
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  function clearFilters(){
    setFilters({ staff: "", action: "", from: "", to: "", search: "" })
    setSearchInput("")
    setPage(1)
  }

  const hasFilters = filters.staff || filters.action || filters.from ||
                     filters.to || filters.search

  const inputClass = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">🏛️ City Hall Staff</h1>
          <p className="text-red-200 text-xs">Audit Log</p>
        </div>
        <Link
          to="/staff/dashboard"
          className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="text-xl font-bold text-gray-800">📋 Audit Log</h2>
          <p className="text-gray-500 text-sm mt-1">
            Every action that changed an application, batch, window, or staff
            account — who did it and when.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Staff member
              </label>
              <select
                className={inputClass + " w-full"}
                value={filters.staff}
                onChange={e => updateFilter("staff", e.target.value)}
              >
                <option value="">All staff</option>
                {actors.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Action
              </label>
              <select
                className={inputClass + " w-full"}
                value={filters.action}
                onChange={e => updateFilter("action", e.target.value)}
              >
                <option value="">All actions</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                From
              </label>
              <input
                className={inputClass + " w-full"}
                type="date"
                value={filters.from}
                onChange={e => updateFilter("from", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                To
              </label>
              <input
                className={inputClass + " w-full"}
                type="date"
                value={filters.to}
                onChange={e => updateFilter("to", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Reference / title
              </label>
              <input
                className={inputClass + " w-full"}
                placeholder="e.g. FA-2026-..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>

          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-red-600 hover:underline font-semibold"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : total + " record" + (total === 1 ? "" : "s")}
          </p>
          {pages > 1 && (
            <p className="text-sm text-gray-500">Page {page} of {pages}</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">⏳ Loading…</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500">
              {hasFilters
                ? "No records match those filters"
                : "No activity recorded yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">When</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Who</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Target</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={log._id}
                      className={"border-b border-gray-100 " + (i % 2 === 1 ? "bg-gray-50/50" : "")}
                    >
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800">{log.staffName}</p>
                        <p className="text-xs text-gray-400">{log.staffEmail}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={"px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap " + actionStyle(log.action)}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-700">
                        {log.targetLabel || "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-xs">
                        {renderDetails(log.details) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={"px-4 py-2 rounded-lg text-sm font-semibold transition " + (
                page === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className={"px-4 py-2 rounded-lg text-sm font-semibold transition " + (
                page === pages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default AuditLogPage
