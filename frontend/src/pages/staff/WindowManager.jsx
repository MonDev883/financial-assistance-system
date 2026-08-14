import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function WindowManager(){

  const [windows, setWindows]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [stats, setStats]       = useState({})

  const [form, setForm] = useState({
    title:       "",
    description: "",
    startDate:   "",
    endDate:     "",
    amounts: {
      Medical:     "",
      Burial:      "",
      Educational: "",
      Calamity:    "",
      Other:       ""
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage]       = useState("")
  const navigate                    = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem("staff")
    if(!stored){
      navigate("/staff/login")
      return
    }
    loadWindows()
  }, [])

  async function loadWindows(){
    try {
      const res = await API.get("/windows/all")
      setWindows(res.data)

      // ── Load stats for each window
      const statsMap = {}
      await Promise.all(
        res.data.map(async w => {
          try {
            const s = await API.get("/windows/stats/" + w._id)
            statsMap[w._id] = s.data
          } catch(err){
            statsMap[w._id] = { total: 0, pending: 0, approved: 0, rejected: 0, paid: 0, totalAmount: 0 }
          }
        })
      )
      setStats(statsMap)

    } catch(err){
      console.error("Failed to load windows:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e){
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleAmount(type, value){
    setForm({
      ...form,
      amounts: { ...form.amounts, [type]: value }
    })
  }

  async function handleCreate(e){
    e.preventDefault()
    setMessage("")

    if(!form.title || !form.startDate || !form.endDate){
      setMessage("❌ Title, start date and end date are required")
      return
    }

    if(new Date(form.startDate) >= new Date(form.endDate)){
      setMessage("❌ End date must be after start date")
      return
    }

    setSubmitting(true)

    try {
      await API.post("/windows/create", form)
      setMessage("✅ Window created! Share the application link with residents.")
      await loadWindows()
      setForm({
        title: "", description: "",
        startDate: "", endDate: "",
        amounts: {
          Medical: "", Burial: "",
          Educational: "", Calamity: "", Other: ""
        }
      })
      setShowForm(false)
      loadWindows()
    } catch(err){
      setMessage("❌ " + (err.response?.data?.message || "Failed to create window"))
    } finally {
      setSubmitting(false)
    }
  }

  async function closeWindow(id){
    if(!confirm("Close this application window? Claimants will no longer be able to submit applications.")) return

    try {
      await API.put(`/windows/close/${id}`)
      loadWindows()
    } catch(err){
      alert(err.response?.data?.message || "Failed to close window")
    }
  }

  function getWindowStatus(w){
    const now  = new Date()
    const start = new Date(w.startDate)
    const end   = new Date(w.endDate)

    if(!w.isActive)         return { label: "Closed",    style: "bg-gray-100 text-gray-600" }
    if(now < start)         return { label: "Scheduled", style: "bg-blue-100 text-blue-700" }
    if(now >= start && now <= end) return { label: "Open", style: "bg-green-100 text-green-700" }
    return { label: "Expired", style: "bg-red-100 text-red-700" }
  }

  function formatDateTime(date){
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">🏛️ City Hall Staff</h1>
          <p className="text-red-200 text-xs">Application Window Management</p>
        </div>
        <Link
          to="/staff/dashboard"
          className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📅 Application Windows</h2>
            <p className="text-gray-500 text-sm mt-1">
              Create and manage financial assistance application periods.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
          >
            {showForm ? "✕ Cancel" : "+ Create New Window"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm mb-6 ${
            message.startsWith("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">
              Create New Application Window
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">

              <div>
                <label className={labelClass}>Window Title</label>
                <input
                  className={inputClass}
                  name="title"
                  placeholder="e.g. 2nd Quarter Financial Assistance 2026"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Description (optional)</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  name="description"
                  rows={3}
                  placeholder="Additional information for applicants..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date & Time</label>
                  <input
                    className={inputClass}
                    name="startDate"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>End Date & Time</label>
                  <input
                    className={inputClass}
                    name="endDate"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Assistance Amount Per Type (₱)
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Set the fixed amount each approved applicant will receive per assistance type.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["Medical", "Burial", "Educational", "Calamity", "Other"].map(type => (
                    <div key={type}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {type}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-400 text-sm">₱</span>
                        <input
                          className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          type="number"
                          placeholder="0"
                          value={form.amounts[type]}
                          onChange={e => handleAmount(type, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                ⚠️ Once created, claimants can submit applications during the specified window period.
                You can manually close a window at any time.
              </div>

              <button
                disabled={submitting}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition
                  ${submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 cursor-pointer"
                  }`}
              >
                {submitting ? "Creating..." : "Create Window"}
              </button>

            </form>
          </div>
        )}

        {/* Windows List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            ⏳ Loading windows...
          </div>
        ) : windows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No windows created yet
            </h3>
            <p className="text-gray-400 text-sm">
              Click "Create New Window" to open an application period.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {windows.map(w => {
              const status = getWindowStatus(w)
              return (
                <div
                  key={w._id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.style}`}>
                          {status.label}
                        </span>
                        {w.maxAmount > 0 && (
                          <span className="text-xs text-gray-400">
                            Max: ₱{Number(w.maxAmount).toLocaleString()} per applicant
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-800 mb-3">
                        {w.title}
                      </h3>

                      {w.description && (
                        <p className="text-sm text-gray-500 mb-3">{w.description}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Opens</p>
                          <p className="font-semibold text-gray-700">
                            {formatDateTime(w.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Closes</p>
                          <p className="font-semibold text-gray-700">
                            {formatDateTime(w.endDate)}
                          </p>
                        </div>

                        {/* Application counts */}
                     
                        {stats[w._id] && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2">

                            <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                              <p className="text-xs text-gray-400 truncate">Total</p>
                              <p className="text-2xl font-bold text-gray-700 leading-tight">
                                {stats[w._id].total}
                              </p>
                            </div>

                            <div className="flex-1 min-w-0 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                              <p className="text-xs text-yellow-600 truncate">Pending</p>
                              <p className="text-2xl font-bold text-yellow-700 leading-tight">
                                {stats[w._id].pending}
                              </p>
                            </div>

                            <div className="flex-1 min-w-0 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                              <p className="text-xs text-green-600 truncate">Approved</p>
                              <p className="text-2xl font-bold text-green-700 leading-tight">
                                {stats[w._id].approved}
                              </p>
                            </div>

                            <div className="flex-1 min-w-0 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                              <p className="text-xs text-red-600 truncate">Rejected</p>
                              <p className="text-2xl font-bold text-red-700 leading-tight">
                                {stats[w._id].rejected}
                              </p>
                            </div>

                            <div className="flex-1 min-w-0 bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                              <p className="text-xs text-blue-600 truncate">Paid</p>
                              <p className="text-2xl font-bold text-blue-700 leading-tight">
                                {stats[w._id].paid}
                              </p>
                            </div>

                          </div>

                          {stats[w._id].totalAmount > 0 && (
                            <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                              <p className="text-xs text-green-600">Total Amount Released</p>
                              <p className="text-xl font-bold text-green-700">
                                ₱{Number(stats[w._id].totalAmount).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                     
                        {w.createdBy && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Created By</p>
                            <p className="font-semibold text-gray-700">
                              {w.createdBy.fullName}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Created</p>
                          <p className="font-semibold text-gray-700">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {w.isActive && (
                        <button
                          onClick={() => closeWindow(w._id)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          🔒 Close Window
                        </button>
                      )}
                      <Link
                        to={"/staff/dashboard?window=" + w._id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                      >
                        View Applications
                      </Link>
                      <Link
                        to={"/staff/analytics/" + w._id}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                      >
                        📊 Analytics
                      </Link>
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/apply/${w._id}`
                          navigator.clipboard.writeText(link)
                          alert("Application link copied to clipboard!\n\n" + link)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        📋 Copy Link
                      </button>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default WindowManager