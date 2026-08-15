import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function StaffLogin(){

  const [form, setForm]       = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const navigate              = useNavigate()

  function handleChange(e){
    setForm({ ...form, [e.target.name]: e.target.value })
  }


{/*To be continue 07-12-2026 by Mon Dev:) */}


  async function handleSubmit(e){
    e.preventDefault()
    setError("")

    if(!form.email || !form.password){
      setError("Email and password are required")
      return
    }

    setLoading(true)

    try {
      const res = await API.post("/staff/login", form)
      localStorage.setItem("staffToken", res.data.token)
      localStorage.setItem("staff", JSON.stringify(res.data.staff))
      navigate("/staff/dashboard")
    } catch(err){
      setError(err.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-1">
            City Hall Staff
          </h1>
          <p className="text-gray-500 text-sm">
            Financial Assistance Portal — Staff Access
          </p>
        </div>


        {/*To be continue by Mon Dev:)*/}
        
        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              name="email"
              type="email"
              placeholder="Enter your staff email"
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold text-sm transition
              ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
              }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

      </div>
    </div>
  )
}

export default StaffLogin