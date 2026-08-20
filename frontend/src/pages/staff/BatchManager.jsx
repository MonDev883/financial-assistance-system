import { useState, useEffect } from "react"
import { useNavigate, Link, useParams } from "react-router-dom"
import API from "../../api"

function BatchManager(){

  const { windowId }                  = useParams()
  const navigate                      = useNavigate()
  const [windowInfo, setWindowInfo]   = useState(null)
  const [batches, setBatches]         = useState([])
  const [unassigned, setUnassigned]   = useState([])
  const [barangays, setBarangays]     = useState([])
  const [barangayFilter, setBarangayFilter] = useState("")
  const [selected, setSelected]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [activeBatch, setActiveBatch] = useState(null)
  const [message, setMessage]         = useState("")
  const [submitting, setSubmitting]   = useState(false)
  const [assigning, setAssigning]     = useState(false)
  const [viewBatch, setViewBatch]     = useState(null)
  const [batchApplicants, setBatchApplicants] = useState([])

  const [form, setForm] = useState({
    batchName:   "",
    payDate:     "",
    startTime:   "",
    endTime:     "",
    maxCapacity: "50",
    barangay:    "",
    notes:       ""
  })

  useEffect(() => {
    const stored = localStorage.getItem("staff")
    if(!stored){ navigate("/staff/login"); return }
    loadData()
  }, [])

  useEffect(() => {
    loadUnassigned()
    setSelected([])
  }, [barangayFilter])

  async function loadData(){
    setLoading(true)
    try {
      const [batchRes, windowRes] = await Promise.all([
        API.get("/batches/window/" + windowId),
        API.get("/windows/public/" + windowId)
      ])
      setBatches(batchRes.data)
      setWindowInfo(windowRes.data)
      await loadUnassigned()
    } catch(err){
      console.error("Load error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadUnassigned(){
    try {
      let url = "/batches/unassigned/" + windowId
      if(barangayFilter) url += "?barangay=" + encodeURIComponent(barangayFilter)
      const res = await API.get(url)
      setUnassigned(res.data.applications)
      setBarangays(res.data.barangays)
    } catch(err){
      console.error("Unassigned load error:", err)
    }
  }

  async function handleCreateBatch(e){
    e.preventDefault()
    setMessage("")

    if(!form.batchName || !form.payDate || !form.startTime || !form.endTime){
      setMessage("❌ Batch name, date, and time are required")
      return
    }

    setSubmitting(true)
    try {
      await API.post("/batches/create", {
        ...form,
        applicationWindow: windowId,
        maxCapacity: Number(form.maxCapacity) || 50
      })
      setMessage("✅ Batch created successfully")
      setForm({
        batchName: "", payDate: "", startTime: "",
        endTime: "", maxCapacity: "50", barangay: "", notes: ""
      })
      setShowForm(false)
      loadData()
    } catch(err){
      setMessage("❌ " + (err.response?.data?.message || "Failed to create batch"))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssign(){
    if(!activeBatch){
      setMessage("❌ Please select a batch first")
      return
    }
    if(selected.length === 0){
      setMessage("❌ Please select at least one applicant")
      return
    }

    setAssigning(true)
    setMessage("")
    try {
      const res = await API.put("/batches/assign", {
        batchId:        activeBatch,
        applicationIds: selected
      })
      setMessage("✅ " + res.data.message)
      setSelected([])
      setBarangayFilter("")
      loadData()
    } catch(err){
      setMessage("❌ " + (err.response?.data?.message || "Assignment failed"))
    } finally {
      setAssigning(false)
    }
  }

  async function viewBatchApplicants(batch){
    try {
      const res = await API.get("/batches/" + batch._id + "/applicants")
      setViewBatch(res.data.batch)
      setBatchApplicants(res.data.applicants)
    } catch(err){
      console.error("View batch error:", err)
    }
  }

  async function removeFromBatch(appId){
    if(!confirm("Remove this applicant from the batch?")) return
    try {
      await API.put("/batches/remove/" + appId)
      loadData()
      if(viewBatch){
        viewBatchApplicants(viewBatch)
      }
    } catch(err){
      alert(err.response?.data?.message || "Failed to remove")
    }
  }

  function toggleSelect(id){
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function toggleSelectAll(){
    if(selected.length === unassigned.length){
      setSelected([])
    } else {
      setSelected(unassigned.map(a => a._id))
    }
  }

  function formatDateTime(date, startTime, endTime){
    return new Date(date).toLocaleDateString("en-PH", {
      weekday: "short", year: "numeric",
      month: "short", day: "numeric"
    }) + " | " + startTime + " – " + endTime
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">🏛️ City Hall Staff</h1>
          <p className="text-red-200 text-xs">Payout Batch Management</p>
        </div>
        <Link
          to={"/staff/dashboard?window=" + windowId}
          className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Window info */}
        {windowInfo && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <h2 className="text-xl font-bold text-gray-800">{windowInfo.title}</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage payout batches and assign approved applicants to specific
              date and time slots.
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={"rounded-lg px-4 py-3 text-sm mb-6 " + (
            message.startsWith("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          )}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Batch List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                📦 Batches
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({batches.length})
                </span>
              </h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                {showForm ? "✕ Cancel" : "+ New Batch"}
              </button>
            </div>

            {/* Create Batch Form */}
            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">Create New Batch</h4>
                <form onSubmit={handleCreateBatch} className="space-y-3">

                  <div>
                    <label className={labelClass}>Batch Name</label>
                    <input className={inputClass} name="batchName"
                      placeholder="e.g. Batch 1 — Barangay Poblacion"
                      value={form.batchName}
                      onChange={e => setForm({ ...form, batchName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Pay Date</label>
                      <input className={inputClass} type="date"
                        value={form.payDate}
                        onChange={e => setForm({ ...form, payDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Max Capacity</label>
                      <input className={inputClass} type="number"
                        placeholder="50"
                        value={form.maxCapacity}
                        onChange={e => setForm({ ...form, maxCapacity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start Time</label>
                      <input className={inputClass} type="time"
                        value={form.startTime}
                        onChange={e => setForm({ ...form, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End Time</label>
                      <input className={inputClass} type="time"
                        value={form.endTime}
                        onChange={e => setForm({ ...form, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Barangay
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input className={inputClass} name="barangay"
                      placeholder="e.g. Barangay Poblacion"
                      value={form.barangay}
                      onChange={e => setForm({ ...form, barangay: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Notes
                      <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input className={inputClass} name="notes"
                      placeholder="e.g. Senior citizens only"
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={submitting}
                    className={"w-full py-3 rounded-xl text-white font-semibold text-sm transition " + (
                      submitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 cursor-pointer"
                    )}
                  >
                    {submitting ? "Creating..." : "Create Batch"}
                  </button>

                </form>
              </div>
            )}

            {/* Batch Cards */}
            {loading ? (
              <div className="text-center py-8 text-gray-400">⏳ Loading...</div>
            ) : batches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-500 text-sm">No batches yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {batches.map(batch => (
                  <div
                    key={batch._id}
                    className={"bg-white rounded-2xl border-2 p-5 cursor-pointer transition " + (
                      activeBatch === batch._id
                        ? "border-red-500 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setActiveBatch(
                      activeBatch === batch._id ? null : batch._id
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            Batch {batch.batchNumber}
                          </span>
                          {activeBatch === batch._id && (
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              ✓ Selected for assignment
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-800">{batch.batchName}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          📅 {new Date(batch.payDate).toLocaleDateString("en-PH", {
                            weekday: "long", year: "numeric",
                            month: "long", day: "numeric"
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          🕐 {batch.startTime} – {batch.endTime}
                        </p>
                        {batch.barangay && (
                          <p className="text-sm text-blue-600 font-semibold mt-1">
                            📍 {batch.barangay}
                          </p>
                        )}
                        {batch.notes && (
                          <p className="text-xs text-gray-400 mt-1">
                            📝 {batch.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className={"text-2xl font-bold " + (
                          batch.applicantCount >= batch.maxCapacity
                            ? "text-red-600"
                            : "text-green-600"
                        )}>
                          {batch.applicantCount}
                          <span className="text-gray-400 text-sm font-normal">
                            /{batch.maxCapacity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">assigned</p>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            viewBatchApplicants(batch)
                          }}
                          className="mt-2 text-xs text-red-600 hover:underline font-semibold"
                        >
                          View List →
                        </button>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="mt-3 bg-gray-100 rounded-full h-2">
                      <div
                        className={"h-2 rounded-full transition-all " + (
                          batch.applicantCount >= batch.maxCapacity
                            ? "bg-red-500"
                            : "bg-green-500"
                        )}
                        style={{
                          width: Math.min(
                            (batch.applicantCount / batch.maxCapacity) * 100, 100
                          ) + "%"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Unassigned Applicants */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                👥 Approved — Unassigned
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({unassigned.length})
                </span>
              </h3>
            </div>

            {/* Barangay Filter */}
            <div className="mb-3 flex gap-2">
              <select
                className={inputClass + " flex-1"}
                value={barangayFilter}
                onChange={e => setBarangayFilter(e.target.value)}
              >
                <option value="">All Barangays ({unassigned.length})</option>
                {barangays.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {barangayFilter && (
                <button
                  onClick={() => setBarangayFilter("")}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm text-gray-600 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Select All + Assign Button */}
            {unassigned.length > 0 && (
              <div className="flex justify-between items-center mb-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-red-600 hover:underline"
                >
                  {selected.length === unassigned.length
                    ? "Deselect All"
                    : "Select All (" + unassigned.length + ")"}
                </button>
                {selected.length > 0 && (
                  <button
                    onClick={handleAssign}
                    disabled={assigning || !activeBatch}
                    className={"px-4 py-2 rounded-lg text-white text-sm font-semibold transition " + (
                      assigning || !activeBatch
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 cursor-pointer"
                    )}
                  >
                    {assigning
                      ? "Assigning..."
                      : "Assign " + selected.length + " to " + (
                          activeBatch
                            ? batches.find(b => b._id === activeBatch)?.batchName || "Selected Batch"
                            : "Batch"
                        )
                    }
                  </button>
                )}
              </div>
            )}

            {!activeBatch && unassigned.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700 mb-3">
                ⚠️ Select a batch on the left first before assigning applicants.
              </div>
            )}

            {/* Applicant List */}
            {unassigned.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-gray-500 text-sm">
                  {barangayFilter
                    ? "No unassigned applicants from " + barangayFilter
                    : "All approved applicants have been assigned to batches!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {unassigned.map(app => (
                  <div
                    key={app._id}
                    className={"bg-white rounded-xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition " + (
                      selected.includes(app._id)
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => toggleSelect(app._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(app._id)}
                      onChange={() => toggleSelect(app._id)}
                      className="w-4 h-4 accent-red-600 flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {app.lastName}, {app.firstName} {app.middleName || ""}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        📍 {app.barangay} · {app.assistanceType}
                        {app.amountAssigned > 0 && (
                          <span className="text-green-600 font-semibold ml-1">
                            · ₱{Number(app.amountAssigned).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                      {app.referenceNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Batch Applicants Modal */}
      {viewBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-screen overflow-y-auto">

            <div className="bg-red-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{viewBatch.batchName}</h3>
                  <p className="text-red-200 text-sm mt-1">
                    📅 {new Date(viewBatch.payDate).toLocaleDateString("en-PH", {
                      weekday: "long", year: "numeric",
                      month: "long", day: "numeric"
                    })}
                  </p>
                  <p className="text-red-200 text-sm">
                    🕐 {viewBatch.startTime} – {viewBatch.endTime}
                  </p>
                  {viewBatch.barangay && (
                    <p className="text-red-200 text-sm">📍 {viewBatch.barangay}</p>
                  )}
                </div>
                <button
                  onClick={() => { setViewBatch(null); setBatchApplicants([]) }}
                  className="text-white hover:text-red-200 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 bg-red-700 rounded-lg px-4 py-2 text-sm">
                {batchApplicants.length} of {viewBatch.maxCapacity} slots filled
              </div>
            </div>

            <div className="p-6">

              {batchApplicants.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No applicants assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {batchApplicants.map((app, index) => (
                    <div
                      key={app._id}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <span className="text-gray-400 font-mono text-sm w-6 flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">
                          {app.lastName}, {app.firstName} {app.middleName || ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          📍 {app.barangay} · {app.referenceNumber}
                          {app.approvedAmount > 0 && (
                            <span className="text-green-600 font-semibold ml-1">
                              · ₱{Number(app.approvedAmount).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromBatch(app._id)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Print button */}
              {batchApplicants.length > 0 && (
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition"
                >
                  🖨️ Print Batch List
                </button>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default BatchManager