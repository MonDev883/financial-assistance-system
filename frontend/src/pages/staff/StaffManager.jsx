import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function StaffManager(){

  const [staffList, setStaffList] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({
    fullName: "",
    email:    "",
    password: "",
    role:     "staff"
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
    const staffData = JSON.parse(stored)
    if(staffData.role !== "admin"){
      navigate("/staff/dashboard")
      return
    }
    loadStaff()
  }, [])

  async function loadStaff(){
    try {
      const res = await API.get("/staff/all")
      setStaffList(res.data)
    } catch(err){
      console.error("Failed to load staff:", err)
    } finally {
      setLoading(false)
    }
  }

//To be resumed by Mon Dev:) on 08-09-2026


  function handleChange(e){
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleCreate(e){
    e.preventDefault()
    setMessage("")

    if(!form.fullName || !form.email || !form.password){
      setMessage("❌ All fields are required")
      return
    }

    if(form.password.length < 8){
      setMessage("❌ Password must be at least 8 characters")
      return
    }

    setSubmitting(true)

    try {
      await API.post("/staff/create", form)
      setMessage("✅ Staff account created successfully")
      setForm({ fullName: "", email: "", password: "", role: "staff" })
      setShowForm(false)
      loadStaff()
    } catch(err){
      setMessage("❌ " + (err.response?.data?.message || "Failed to create staff"))
    } finally {
      setSubmitting(false)
    }
  }


//To be resumed by Mon Dev on 08-09-2026
  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">🏛️ City Hall Staff</h1>
          <p className="text-red-200 text-xs">Staff Account Management</p>
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
            <h2 className="text-2xl font-bold text-gray-800">👥 Staff Accounts</h2>
            <p className="text-gray-500 text-sm mt-1">
              Create and manage City Hall staff accounts.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
          >
            {showForm ? "✕ Cancel" : "+ Add New Staff"}
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
              Create New Staff Account
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">

              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  className={inputClass}
                  name="fullName"
                  placeholder="e.g. Maria Santos"
                  value={form.fullName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  placeholder="e.g. maria@cityhall.gov.ph"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  className={inputClass}
                  name="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Role</label>
                <select
                  className={inputClass}
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="staff">Staff — Can review applications</option>
                  <option value="admin">Admin — Full access including staff management</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                ⚠️ Share the login credentials securely with the staff member.
                Ask them to change their password after first login.
              </div>

              <button
                disabled={submitting}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition
                  ${submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 cursor-pointer"
                  }`}
              >
                {submitting ? "Creating..." : "Create Staff Account"}
              </button>

            </form>
          </div>
        )}



        {/* Staff List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            ⏳ Loading staff accounts...
          </div>
        ) : staffList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500">No staff accounts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map(s => (
              <div
                key={s._id}
                className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex justify-between items-center flex-wrap gap-4 hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-lg">
                    {s.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{s.fullName}</p>
                    <p className="text-sm text-gray-500">{s.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    s.role === "admin"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {s.role === "admin" ? "👑 Admin" : "👤 Staff"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    s.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default StaffManager