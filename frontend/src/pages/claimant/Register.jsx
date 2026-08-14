import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function Register(){

  const [form, setForm] = useState({
    fullName: "",
    email:    "",
    password: "",
    phone:    "",
    address:  ""
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()

  function handleChange(e){
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError("")
    setSuccess("")

    if(!form.fullName || !form.email || !form.password ||
       !form.phone    || !form.address){
      setError("All fields are required")
      return
    }

    if(form.password.length < 6){
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const res = await API.post("/claimants/register", form)
      setSuccess(res.data.message)
      setTimeout(() => navigate("/claimant/login"), 2000)
    } catch(err){
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-600 mb-1">
            📋 Financial Assistance
          </h1>
          <p className="text-gray-500 text-sm">
            City Hall — Create your account to apply
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm mb-5">
            ✅ {success} Redirecting to login...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              name="fullName"
              placeholder="e.g. Juan dela Cruz"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              name="email"
              type="email"
              placeholder="e.g. juan@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              name="phone"
              placeholder="e.g. 09171234567"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Address
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              name="address"
              placeholder="e.g. 123 Mabini St, Manila"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <button
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold text-sm mt-2 transition
              ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
              }`}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/claimant/login" className="text-green-600 font-semibold hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register