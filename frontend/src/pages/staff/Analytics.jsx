import { useState, useEffect } from "react"
import { useNavigate, Link, useParams } from "react-router-dom"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend, LineChart, Line
} from "recharts"
import API from "../../api"

const COLORS = ["#DC2626", "#16A34A", "#2563EB", "#D97706", "#7C3AED", "#0891B2"]

function Analytics(){

  const { windowId }              = useParams()
  const [data, setData]           = useState(null)
  const [windowInfo, setWindowInfo] = useState(null)
  const [loading, setLoading]     = useState(true)
  const navigate                  = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem("staff")
    if(!stored){
      navigate("/staff/login")
      return
    }
    loadData()
  }, [])

  async function loadData(){
    try {
      const [analyticsRes, windowRes] = await Promise.all([
        API.get("/applications/analytics/" + windowId),
        API.get("/windows/public/" + windowId)
      ])
      setData(analyticsRes.data)
      setWindowInfo(windowRes.data)
    } catch(err){
      console.error("Failed to load analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  if(loading){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">⏳ Loading analytics...</p>
      </div>
    )
  }

  if(!data){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">No data found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">



      {/* To resumed by Mon Dev:) on 08-10-2026 */}

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-ls font-bold">🏛️ City Hall Staff</h1>
          <p className="text-red-200 text-xs">Analytics Dashboard</p>
        </div>
        <Link
          to="/staff/dashboard"
          className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Window title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            📊 Analytics Report
          </h2>
          {windowInfo && (
            <p className="text-gray-500 text-sm mt-1">
              {windowInfo.title}
            </p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-800">{data.summary.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-5 text-center">
            <p className="text-xs text-yellow-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-700">{data.summary.pending}</p>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5 text-center">
            <p className="text-xs text-green-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-700">{data.summary.approved}</p>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5 text-center">
            <p className="text-xs text-red-600 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-700">{data.summary.rejected}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 text-center">
            <p className="text-xs text-blue-600 mb-1">Paid</p>
            <p className="text-3xl font-bold text-blue-700">{data.summary.paid}</p>
          </div>
          <div className="bg-purple-50 rounded-2xl border border-purple-200 p-5 text-center">
            <p className="text-xs text-purple-600 mb-1">Approval Rate</p>
            <p className="text-3xl font-bold text-purple-700">{data.approvalRate}%</p>
          </div>
        </div>

        {/* Total Amount Disbursed */}
        {data.totalAmountDisbursed > 0 && (
          <div className="bg-green-600 rounded-2xl p-6 mb-8 text-white text-center">
            <p className="text-green-100 text-sm mb-1">Total Amount Disbursed</p>
            <p className="text-4xl font-bold">
              ₱{Number(data.totalAmountDisbursed).toLocaleString()}
            </p>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* By Assistance Type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Applications by Assistance Type
            </h3>
            {data.byType.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Applications" radius={[6, 6, 0, 0]}>
                    {data.byType.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>




          {/* By Status Pie To be resumed by Mon Dev:) on 08-10-2026*/}


          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Application Status Distribution
            </h3>
            {data.summary.total === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pending",  value: data.summary.pending },
                      { name: "Approved", value: data.summary.approved },
                      { name: "Rejected", value: data.summary.rejected },
                      { name: "Paid",     value: data.summary.paid }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      name + " " + (percent * 100).toFixed(0) + "%"
                    }
                  >
                    {[
                      "#D97706", "#16A34A", "#DC2626", "#2563EB"
                    ].map((color, index) => (
                      <Cell key={index} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* By Gender */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Applications by Gender
            </h3>



        {/* To be resumed by Mon Dev:) on 08-11-2026 2 */}

            {data.byGender.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.byGender}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      name + " " + (percent * 100).toFixed(0) + "%"
                    }
                  >
                    {data.byGender.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By Civil Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Applications by Civil Status
            </h3>
            {data.byCivilStatus.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byCivilStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Applications" radius={[6, 6, 0, 0]}>
                    {data.byCivilStatus.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* Daily Submissions Line Chart */}
        {data.byDate.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">
              Daily Submissions
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.byDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Submissions"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ fill: "#DC2626", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Barangays */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">
            Top 10 Barangays by Applications
          </h3>
          {data.byBarangay.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.byBarangay}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip />
                <Bar dataKey="value" name="Applications" radius={[0, 6, 6, 0]}>
                  {data.byBarangay.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  )
}

export default Analytics



               