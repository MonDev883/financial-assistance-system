import { useEffect, useState } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import API from "../../api"

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5001"
  : "https://financial-assistance-system.onrender.com"

function StaffDashboard(){

  const [staff, setStaff]               = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [search, setSearch]             = useState("")
  const [searchInput, setSearchInput]   = useState("")
  const [selected, setSelected]         = useState([])
  const [showBulk, setShowBulk]         = useState(false)
  const [bulkForm, setBulkForm]         = useState({
    approvedAmount: "",
    payDate:        "",
    remarks:        ""
  })
  const [bulkLoading, setBulkLoading]   = useState(false)
  const [bulkMessage, setBulkMessage]   = useState("")
  const [reviewing, setReviewing]       = useState(null)
  const [expanded, setExpanded]         = useState(null)
  const [reviewForm, setReviewForm]     = useState({
    status:          "approved",
    approvedAmount:  "",
    payDate:         "",
    rejectionReason: "",
    remarks:         ""
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [message, setMessage]             = useState("")
  const navigate                          = useNavigate()
  const location                          = useLocation()


//To be resumed by Mon Dev:) on 08-13-2026
  const windowId = new URLSearchParams(location.search).get("window")
// ── Wait 400ms after typing stops before searching
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const stored = localStorage.getItem("staff")
    if(!stored){
      navigate("/staff/login")
      return
    }
    setStaff(JSON.parse(stored))
  }, [])

   useEffect(() => {
    if(staff) loadApplications()
  }, [statusFilter, windowId, search, staff])

  // ── Clear selections when the visible set changes
  useEffect(() => {
    setSelected([])
  }, [statusFilter, windowId, search])

  async function loadApplications(){
    setLoading(true)
    try {
      let url = "/applications/all?status=" + statusFilter
      if(windowId) url += "&windowId=" + windowId
      if(search)   url += "&search=" + encodeURIComponent(search)
      const res = await API.get(url)
      setApplications(res.data)
    } catch(err){
      console.error("Failed to load:", err)
    } finally {
      setLoading(false)
    }
  }

  function logout(){
    localStorage.removeItem("staffToken")
    localStorage.removeItem("staff")
    navigate("/staff/login")
  }

  function openReview(app){
    setReviewing(app)
    setReviewForm({
      status:          "approved",
      approvedAmount:  app.amountAssigned || "",
      payDate:         "",
      rejectionReason: "",
      remarks:         ""
    })
    setMessage("")
  }

  function closeReview(){
    setReviewing(null)
    setMessage("")
  }

  async function submitReview(){
    setSubmitLoading(true)
    setMessage("")
    try {
      await API.put("/applications/review/" + reviewing._id, reviewForm)
      setMessage("✅ Application reviewed successfully")
      setTimeout(() => {
        closeReview()
        loadApplications()
      }, 1500)
    } catch(err){
      setMessage("❌ " + (err.response?.data?.message || "Review failed"))
    } finally {
      setSubmitLoading(false)
    }
  }


//To be resumed by Mon Dev:) within this day 08-13-2026

  async function markPaid(id){
    if(!confirm("Mark this application as paid?")) return
    try {
      await API.put("/applications/paid/" + id)
      loadApplications()
    } catch(err){
      alert(err.response?.data?.message || "Failed to mark as paid")
    }
  }

  function toggleSelect(id){
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  function toggleSelectAll(){
    const pendingIds = applications
      .filter(a => a.status === "pending")
      .map(a => a._id)
    if(selected.length === pendingIds.length){
      setSelected([])
    } else {
      setSelected(pendingIds)
    }
  }


//To be resumed by Mon Dev on 08-14-2026:)

  async function handleBulkApprove(){
    setBulkMessage("")
    if(!bulkForm.approvedAmount || !bulkForm.payDate){
      setBulkMessage("❌ Amount and pay date are required")
      return
    }
    setBulkLoading(true)
    try {
      const res = await API.put("/applications/bulk-approve", {
        applicationIds: selected,
        approvedAmount: bulkForm.approvedAmount,
        payDate:        bulkForm.payDate,
        remarks:        bulkForm.remarks
      })
      setBulkMessage("✅ " + res.data.message)
      setSelected([])
      setBulkForm({ approvedAmount: "", payDate: "", remarks: "" })
      setTimeout(() => {
        setShowBulk(false)
        setBulkMessage("")
        loadApplications()
      }, 2000)
    } catch(err){
      setBulkMessage("❌ " + (err.response?.data?.message || "Bulk approve failed"))
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleExport(){
    try {
      const token = localStorage.getItem("staffToken")
      const url   = `${API_URL}/api/applications/export/${windowId}?status=${statusFilter}`
      const res   = await fetch(url, {
        headers: { Authorization: "Bearer " + token }
      })

      if(!res.ok){
        const err = await res.json()
        alert(err.message || "Export failed")
        return
      }

      const blob = await res.blob()
      const link = document.createElement("a")
      link.href  = URL.createObjectURL(blob)
      link.download = "applications-" + statusFilter + "-" +
                      new Date().toISOString().slice(0,10) + ".xlsx"
      link.click()
      URL.revokeObjectURL(link.href)
    } catch(err){
      alert("Export failed. Please try again.")
    }
  }

  function getStatusStyle(status){
    switch(status){
      case "approved": return "bg-green-100 text-green-700"
      case "rejected": return "bg-red-100 text-red-700"
      case "paid":     return "bg-blue-100 text-blue-700"
      default:         return "bg-yellow-100 text-yellow-700"
    }
  }

  function formatDate(date){
    if(!date) return "—"
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric", month: "long", day: "numeric"
    })
  }

  function getFullName(app){
    return app.lastName + ", " + app.firstName +
      (app.middleName ? " " + app.middleName : "")
  }

  function getFullAddress(app){
    return app.houseNo + " " + app.street + ", Brgy. " +
      app.barangay + ", " + app.city + ", " +
      app.province + " " + app.zipCode
  }

  const pendingCount = applications.filter(a => a.status === "pending").length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">🏛️ City Hall Staff</h1>
          <p className="text-red-200 text-xs">Financial Assistance Portal</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/staff/windows"
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            📅 Windows
          </Link>
          {JSON.parse(localStorage.getItem("staff") || "{}").role === "admin" && (
            <Link
              to="/staff/accounts"
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              👥 Staff
            </Link>
          )}
          <span className="text-sm hidden sm:block">
            👤 {staff?.fullName}
            <span className="ml-2 bg-red-800 text-xs px-2 py-0.5 rounded-full">
              {staff?.role}
            </span>
          </span>
          <button
            onClick={logout}
            className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Search bar */}
        <div className="mb-4">
          <input
            className="w-full sm:w-96 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            placeholder="🔍 Search by name, barangay, or reference number..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["pending", "approved", "rejected", "paid"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setSelected([]) }}
              className={"px-5 py-2 rounded-full text-sm font-semibold transition capitalize " + (
                statusFilter === s
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Header row */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {statusFilter} Applications
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({applications.length})
              </span>
            </h2>
            {statusFilter === "pending" && applications.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs text-red-600 hover:underline mt-1"
              >
                {selected.length === pendingCount
                  ? "Deselect All"
                  : "Select All Pending"}
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {selected.length > 0 && (
              <button
                onClick={() => setShowBulk(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                ✅ Bulk Approve ({selected.length})
              </button>
            )}
            {windowId && applications.length > 0 && (
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                📥 Export Excel
              </button>
            )}
            {windowId && (
              <Link
                to={"/staff/analytics/" + windowId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                📊 Analytics
              </Link>
            )}
          </div>
        </div>

        {/* Applications list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">⏳ Loading...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">
              {search
                ? "No results found for \"" + search + "\""
                : "No " + statusFilter + " applications found"}
            </p>
            {search && (
              <button
                onClick={() => setSearchInput("")}
                className="mt-3 text-sm text-red-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start gap-3">

                    {/* Checkbox for pending */}
                    {app.status === "pending" && (
                      <input
                        type="checkbox"
                        checked={selected.includes(app._id)}
                        onChange={() => toggleSelect(app._id)}
                        className="mt-1.5 w-4 h-4 accent-red-600 cursor-pointer flex-shrink-0"
                      />
                    )}

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpanded(expanded === app._id ? null : app._id)}
                    >
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-400">
                              {app.referenceNumber}
                            </span>
                            <span className={"px-3 py-1 rounded-full text-xs font-semibold " + getStatusStyle(app.status)}>
                              {app.status.toUpperCase()}
                            </span>
                            {app.applicationWindow && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {app.applicationWindow.title}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {getFullName(app)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {app.assistanceType} Assistance
                            {app.amountAssigned > 0 && (
                              <span className="ml-2 text-green-600 font-semibold">
                                — ₱{Number(app.amountAssigned).toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          {app.status === "pending" && (
                            <button
                              onClick={e => { e.stopPropagation(); openReview(app) }}
                              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                            >
                              Review
                            </button>
                          )}
                          {app.status === "approved" && (
                            <button
                              onClick={e => { e.stopPropagation(); markPaid(app._id) }}
                              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
                            >
                              Mark Paid
                            </button>
                          )}
                          <span className="text-xs text-gray-400">
                            {expanded === app._id ? "▲ Hide" : "▼ Details"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded === app._id && (
                  <div className="border-t border-gray-100 px-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">

                      {/* Personal Info */}
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">
                          Personal Information
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Full Name</p>
                            <p className="font-semibold">{getFullName(app)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Date of Birth</p>
                            <p className="font-semibold">{app.dateOfBirth}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Gender</p>
                            <p className="font-semibold">{app.gender}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Civil Status</p>
                            <p className="font-semibold">{app.civilStatus}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Address */}
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">
                          Contact & Address
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Contact Number</p>
                            <p className="font-semibold">{app.contactNumber}</p>
                          </div>
                          {app.email && (
                            <div>
                              <p className="text-gray-400 text-xs">Email</p>
                              <p className="font-semibold">{app.email}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400 text-xs">Present Address</p>
                            <p className="font-semibold leading-relaxed">
                              {getFullAddress(app)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Assistance Details */}
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">
                          Assistance Details
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Type</p>
                            <p className="font-semibold">{app.assistanceType}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Amount Assigned</p>
                            <p className="font-bold text-green-600 text-base">
                              ₱{Number(app.amountAssigned || 0).toLocaleString()}
                            </p>
                          </div>
                          {app.approvedAmount > 0 && (
                            <div>
                              <p className="text-gray-400 text-xs">Approved Amount</p>
                              <p className="font-bold text-green-700 text-base">
                                ₱{Number(app.approvedAmount).toLocaleString()}
                              </p>
                            </div>
                          )}
                          {app.payDate && (
                            <div>
                              <p className="text-gray-400 text-xs">Pay Date</p>
                              <p className="font-semibold text-blue-600">
                                📅 {formatDate(app.payDate)}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400 text-xs">Date Submitted</p>
                            <p className="font-semibold">{formatDate(app.submittedAt)}</p>
                          </div>
                        </div>
                      </div>

                    </div>

                   {/* Selfie Photo */}
                    {app.selfiePhotoPath && (
                      <div className="mt-5">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                          Identity Verification — Selfie
                        </p>
                        <div className="flex items-center gap-4">
                          <img
                            src={`${API_URL}/uploads/${app.selfiePhotoPath.split(/[\\/]/).pop()}`}
                            alt="Applicant selfie"
                            onError={e => { e.target.onerror = null; e.target.src = "/placeholder-avatar.png" }}
                            className="w-24 h-24 object-cover rounded-full border-4 border-gray-200"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {app.lastName}, {app.firstName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Selfie taken during application submission
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {app.status === "rejected" && app.rejectionReason && (
                      <div className="mt-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded text-sm text-red-700">
                        <span className="font-semibold">Rejection Reason: </span>
                        {app.rejectionReason}
                      </div>
                    )}

                    {app.remarks && (
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded text-sm text-blue-700">
                        <span className="font-semibold">Remarks: </span>
                        {app.remarks}
                      </div>
                    )}

                    {app.status === "approved" && app.payDate && (
                      <div className="mt-4 bg-green-50 border-l-4 border-green-500 px-4 py-3 rounded text-sm text-green-700">
                        ✅ Claimant should visit City Hall on{" "}
                        <span className="font-semibold">{formatDate(app.payDate)}</span>{" "}
                        with valid ID to claim ₱{Number(app.approvedAmount).toLocaleString()}.
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">

            <h3 className="text-xl font-bold text-gray-800 mb-1">Review Application</h3>
            <p className="text-sm text-gray-500 mb-1">{reviewing.referenceNumber}</p>
            <p className="text-base font-semibold text-gray-800 mb-6">
              {getFullName(reviewing)} — {reviewing.assistanceType}
              {reviewing.amountAssigned > 0 && (
                <span className="text-green-600 ml-2">
                  (₱{Number(reviewing.amountAssigned).toLocaleString()})
                </span>
              )}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Decision</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewForm({ ...reviewForm, status: "approved" })}
                  className={"flex-1 py-2 rounded-lg text-sm font-semibold border transition " + (
                    reviewForm.status === "approved"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-600 border-gray-300"
                  )}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => setReviewForm({ ...reviewForm, status: "rejected" })}
                  className={"flex-1 py-2 rounded-lg text-sm font-semibold border transition " + (
                    reviewForm.status === "rejected"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-600 border-gray-300"
                  )}
                >
                  ❌ Reject
                </button>
              </div>
            </div>

           {/* Approve info — no pay date needed here */}
            {reviewForm.status === "approved" && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-green-700 text-sm font-semibold mb-1">
                  ✅ Application will be marked as Approved
                </p>
                <p className="text-green-600 text-xs">
                  Pay date and batch schedule will be assigned later via
                  Batch Manager. The claimant will be notified by SMS and
                  email when a batch is assigned.
                </p>
              </div>
            )}

            {reviewForm.status === "rejected" && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
                  rows={3}
                  placeholder="Explain why this application is being rejected..."
                  value={reviewForm.rejectionReason}
                  onChange={e => setReviewForm({ ...reviewForm, rejectionReason: e.target.value })}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Remarks <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
                placeholder="e.g. Cash release on July 25"
                value={reviewForm.remarks}
                onChange={e => setReviewForm({ ...reviewForm, remarks: e.target.value })}
              />
            </div>

            {message && (
              <div className={"px-4 py-3 rounded-lg text-sm mb-4 " + (
                message.startsWith("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}>
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={submitReview}
                disabled={submitLoading}
                className={"flex-1 py-3 rounded-lg text-white font-semibold text-sm transition " + (
                  submitLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 cursor-pointer"
                )}
              >
                {submitLoading ? "Submitting..." : "Submit Review"}
              </button>
              <button
                onClick={closeReview}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">

            <h3 className="text-xl font-bold text-gray-800 mb-1">Bulk Approve</h3>
            <p className="text-sm text-gray-500 mb-6">
              Approving{" "}
              <span className="font-bold text-red-600">{selected.length}</span>{" "}
              selected applications with the same pay date and amount.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Approved Amount (₱) per applicant
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-400"
                  type="number"
                  placeholder="e.g. 5000"
                  value={bulkForm.approvedAmount}
                  onChange={e => setBulkForm({ ...bulkForm, approvedAmount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pay Date</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-400"
                  type="date"
                  value={bulkForm.payDate}
                  onChange={e => setBulkForm({ ...bulkForm, payDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Remarks <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none"
                  placeholder="e.g. Cash release on July 25"
                  value={bulkForm.remarks}
                  onChange={e => setBulkForm({ ...bulkForm, remarks: e.target.value })}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                ⚠️ This will approve all {selected.length} selected applications and
                send SMS + email notifications to each applicant.
              </div>
            </div>

            {bulkMessage && (
              <div className={"px-4 py-3 rounded-lg text-sm mt-4 " + (
                bulkMessage.startsWith("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}>
                {bulkMessage}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className={"flex-1 py-3 rounded-lg text-white font-semibold text-sm transition " + (
                  bulkLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 cursor-pointer"
                )}
              >
                {bulkLoading ? "Approving..." : "Approve All " + selected.length}
              </button>
              <button
                onClick={() => { setShowBulk(false); setBulkMessage("") }}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default StaffDashboard