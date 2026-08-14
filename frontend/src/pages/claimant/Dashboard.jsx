import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function ClaimantDashboard(){

  const [claimant, setClaimant]       = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate                      = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem("claimant")
    if(!stored){
      navigate("/claimant/login")
      return
    }
    setClaimant(JSON.parse(stored))
    loadApplications()
  }, [])

/*
// Sample user data collection

const userData = {
  company: "TechNova Solutions",
  activeRegion: "North America",
  totalUsers: 3,

  // An array of objects representing individual users

  users: [
    {
      id: 101,
      name: "Alex Rivera",
      email: "alex.rivera@technova.com",
      role: "Administrator",
      isActive: true,
      skills: ["JavaScript", "React", "Node.js"]
    },
    {
      id: 102,
      name: "Jordan Lee",
      email: "jordan.lee@technova.com",
      role: "Developer",
      isActive: true,
      skills: ["Python", "Django", "PostgreSQL"]
    },
    {
      id: 103,
      name: "Taylor Wong",
      email: "taylor.wong@technova.com",
      role: "Designer",
      isActive: false,
      skills: ["Figma", "UI/UX", "CSS"]
    }
  ]
};

// --- Quick Examples of How to Use This Data ---

// 1. Accessing a specific property

console.log(userData.company); 
// Output: "TechNova Solutions"

// 2. Accessing an item inside the array
console.log(userData.users[0].name); 
// Output: "Alex Rivera"

To be continue 07-11-2026
// 3. Filtering the array (e.g., getting only active users)

const activeUsers = userData.users.filter(user => user.isActive);
console.log(activeUsers);
*/

  async function loadApplications(){
    try {
      const res = await API.get("/applications/my")
      setApplications(res.data)
    } catch(err){
      console.error("Failed to load applications:", err)
    } finally {
      setLoading(false)
    }
  }

  function logout(){
    localStorage.removeItem("claimantToken")
    localStorage.removeItem("claimant")
    navigate("/claimant/login")
  }

  function getStatusStyle(status){
    switch(status){
      case "approved": return "bg-green-100 text-green-700"
      case "rejected": return "bg-red-100 text-red-700"
      case "paid":     return "bg-blue-100 text-blue-700"
      default:         return "bg-yellow-100 text-yellow-700"
    }
  }

  function getStatusLabel(status){
    switch(status){
      case "pending":  return "⏳ Pending Review"
      case "approved": return "✅ Approved"
      case "rejected": return "❌ Rejected"
      case "paid":     return "💵 Paid"
      default:         return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">💰 Financial Assistance</h1>
          <p className="text-red-200 text-xs">City Hall Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:block">
            👋 {claimant?.fullName}
          </span>
          <button
            onClick={logout}
            className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Welcome banner */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Welcome, {claimant?.fullName} 👋
            </h2>
            <p className="text-gray-500 text-sm">
              Track your financial assistance applications here.
            </p>
          </div>
          <Link
            to="/claimant/apply"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition whitespace-nowrap"
          >
            + New Application
          </Link>
        </div>

        {/* Applications list */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            📋 My Applications
          </h3>

          {loading ? (
            <div className="text-center py-16 text-gray-400">
              ⏳ Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">


        {/* To be continue by Mon Dev:) */}
              
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No applications yet
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Submit your first financial assistance application to get started.
              </p>
              <Link
                to="/claimant/apply"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition"
              >
                Apply Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition"
                >
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                    <div>
                      <span className="text-xs text-gray-400 font-mono">
                        {app.referenceNumber}
                      </span>
                      <h4 className="text-base font-bold text-gray-800 mt-1">
                        {app.assistanceType} Assistance
                      </h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Amount Requested</p>
                      <p className="font-semibold text-gray-700">
                        ₱{Number(app.amountRequested).toLocaleString()}
                      </p>
                    </div>
                    {app.approvedAmount > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Approved Amount</p>
                        <p className="font-semibold text-green-600">
                          ₱{Number(app.approvedAmount).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {app.payDate && (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Pay Date</p>
                        <p className="font-semibold text-blue-600">
                          📅 {new Date(app.payDate).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Date Applied</p>
                      <p className="font-semibold text-gray-700">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">ID Type</p>
                      <p className="font-semibold text-gray-700">{app.idType}</p>
                    </div>
                  </div>

                  {/* Rejection reason */}
                  {app.status === "rejected" && app.rejectionReason && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded text-sm text-red-700">
                      <span className="font-semibold">Reason: </span>
                      {app.rejectionReason}
                    </div>
                  )}

                  {/* Approved message */}
                  {app.status === "approved" && app.payDate && (
                    <div className="mt-4 bg-green-50 border-l-4 border-green-500 px-4 py-3 rounded text-sm text-green-700">
                      🎉 Your application is approved! Please visit City Hall on{" "}
                      <span className="font-semibold">
                        {new Date(app.payDate).toLocaleDateString("en-US", {
                          weekday: "long", year: "numeric",
                          month: "long", day: "numeric"
                        })}
                      </span>{" "}
                      to claim your assistance.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClaimantDashboard