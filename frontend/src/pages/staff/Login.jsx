import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function StaffLogin(){

  const [form, setForm]         = useState({ email: "", password: "" })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [showPass, setShowPass] = useState(false)
  const [capsOn, setCapsOn]     = useState(false)
  const navigate                = useNavigate()

  function handleChange(e){
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function checkCaps(e){
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))
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
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your staff email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                className="w-full border border-gray-300 rounded-lg pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                name="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                onKeyUp={checkCaps}
                onKeyDown={checkCaps}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {capsOn && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Caps Lock is on</p>
            )}
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

        <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Forgot your password? Contact your administrator.
          </p>
          <Link
            to="/check-status"
            className="block text-xs text-red-600 hover:underline"
          >
            ← Check application status
          </Link>
        </div>

      </div>
    </div>
  )
}

export default StaffLogin