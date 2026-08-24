import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import API from "../api"
import html2canvas from "html2canvas-pro"

// ── Convert 24-hour time to 12-hour AM/PM
function formatTime(time24){
  if(!time24) return "—"
  const [hourStr, minute] = time24.split(":")
  let hour = parseInt(hourStr)
  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12
  return hour + ":" + minute + " " + ampm
}

function StatusChecker(){

  const [refNum,  setRefNum]  = useState("")
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  // ── Auto-fill and search if ref is in URL (from QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref    = params.get("ref")
    if(ref){
      setRefNum(ref.toUpperCase())
      checkStatus(ref.toUpperCase())
    }
  }, [])

  async function checkStatus(ref){
    setError("")
    setResult(null)
    setLoading(true)
    try {
      const res = await API.get("/applications/status/" + ref)
      setResult(res.data)
    } catch(err){
      setError(err.response?.data?.message || "Failed to check status")
    } finally {
      setLoading(false)
    }
  }

  async function handleCheck(e){
    e.preventDefault()
    setError("")
    setResult(null)

    if(!refNum.trim()){
      setError("Please enter your reference number")
      return
    }

    const ref = refNum.trim()

    // ── Put the reference in the URL so bookmarks and refreshes work
    window.history.replaceState(null, "", "?ref=" + encodeURIComponent(ref))

    await checkStatus(ref)
  }

  function getStatusStyle(status){
    switch(status){
      case "approved": return "bg-green-100 text-green-700 border-green-200"
      case "rejected": return "bg-red-100 text-red-700 border-red-200"
      case "paid":     return "bg-blue-100 text-blue-700 border-blue-200"
      default:         return "bg-yellow-100 text-yellow-700 border-yellow-200"
    }
  }

  function getStatusIcon(status){
    switch(status){
      case "approved": return "✅"
      case "rejected": return "❌"
      case "paid":     return "💵"
      default:         return "⏳"
    }
  }

  function getStatusMessage(result){
    switch(result.status){
      case "pending":
        return "Your application is currently being reviewed by City Hall staff. Please wait for an update."
      case "approved":
        if(!result.payDate){
          return "Your application has been approved! Your payout schedule is being " +
            "prepared. You will receive an SMS and email once your date and time slot " +
            "are assigned."
        }
        return "Your application has been approved! Please visit City Hall on " +
          new Date(result.payDate).toLocaleDateString("en-PH", {
            weekday: "long", year: "numeric",
            month: "long", day: "numeric"
          }) + " to claim your assistance. Bring a valid ID."
      case "rejected":
        return "Your application was not approved. Reason: " +
          (result.rejectionReason || "See City Hall for details.")
      case "paid":
        return "Your financial assistance has been successfully released. Thank you."
      default:
        return ""
    }
  }

  return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center p-5 print-root">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8 no-print">
          <h1 className="text-2xl font-bold text-white mb-2">
            🏛️ City Hall Financial Assistance
          </h1>
          <p className="text-red-200 text-sm">
            Application Status Checker
          </p>
        </div>

        {/* Search card */}
        <div id="status-card" className="bg-white rounded-2xl shadow-2xl p-8 print-area">

          <div className="no-print">
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Check Your Application
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your reference number to check the status of your application.
            </p>
          </div>

          <form onSubmit={handleCheck} className="flex gap-2 mb-4 no-print">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 uppercase"
              placeholder="e.g. FA-2026-00001"
              value={refNum}
              onChange={e => setRefNum(e.target.value.toUpperCase())}
            />
            <button
              disabled={loading}
              className={"px-5 py-3 rounded-lg text-white font-semibold text-sm transition " +
                (loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 cursor-pointer"
                )}
            >
              {loading ? "..." : "Check"}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">

              {/* Print-only header — the page header is hidden when printing */}
              <div className="hidden print:block text-center mb-4 pb-3 border-b border-gray-300">
                <p className="font-bold text-gray-800">
                  🏛️ City Hall Financial Assistance
                </p>
                <p className="text-xs text-gray-500">Payout Claim Slip</p>
              </div>

              {/* Status badge */}
              <div className={"border rounded-xl px-5 py-4 " + getStatusStyle(result.status)}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <span className="text-lg font-bold capitalize">{result.status}</span>
                </div>
                <p className="text-sm leading-relaxed">{getStatusMessage(result)}</p>
              </div>

              {/* Details */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reference No.</span>
                  <span className="font-bold font-mono text-gray-800">
                    {result.referenceNumber}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="font-semibold text-gray-800">{result.name}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-semibold text-gray-800">{result.assistanceType}</span>
                </div>

                {result.amountAssigned > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {result.status === "pending" ? "Amount (if approved)" : "Approved Amount"}
                    </span>
                    <span className="font-bold text-green-600">
                      ₱{Number(result.approvedAmount || result.amountAssigned).toLocaleString()}
                    </span>
                  </div>
                )}

                {result.payDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pay Date</span>
                    <span className="font-semibold text-blue-600">
                      📅 {new Date(result.payDate).toLocaleDateString("en-PH", {
                        year: "numeric", month: "long", day: "numeric"
                      })}
                    </span>
                  </div>
                )}

                {result.window && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Window</span>
                    <span className="font-semibold text-gray-800">{result.window}</span>
                  </div>
                )}

                {result.batch && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                      Payout Schedule
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
                      <p className="font-bold text-red-700 text-sm">
                        📦 {result.batch.batchName}
                      </p>
                      <p className="text-sm text-gray-700">
                        📅 {new Date(result.batch.payDate).toLocaleDateString("en-PH", {
                          weekday: "long", year: "numeric",
                          month: "long", day: "numeric"
                        })}
                      </p>
                      <p className="text-sm text-gray-700">
                        🕐 {formatTime(result.batch.startTime)} – {formatTime(result.batch.endTime)}
                      </p>
                      {result.batch.notes && (
                        <p className="text-xs text-gray-500">
                          📝 {result.batch.notes}
                        </p>
                      )}
                      <p className="text-xs text-red-600 font-semibold mt-2">
                        ⚠️ Please be at City Hall on time. Bring a valid ID and your reference number.
                      </p>
                    </div>

                    {/* QR code for the payout desk */}
                    <div className="flex flex-col items-center mt-4 pt-4 border-t border-gray-200">
                      <QRCodeSVG
                        value={window.location.origin + "/check-status?ref=" + result.referenceNumber}
                        size={130}
                        level="M"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Show this code at the payout desk
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submitted</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(result.submittedAt).toLocaleDateString("en-PH")}
                  </span>
                </div>

              </div>

              {/* What happens next — pending only */}
              {result.status === "pending" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 no-print">
                  Applications are usually reviewed within 5 working days. You'll receive
                  an SMS and email as soon as a decision is made.
                </div>
              )}

              {/* Print */}
              <button
                onClick={() => window.print()}
                className="w-full py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition no-print"
              >
                🖨️ Print / Save as PDF
              </button>

              {/* Remarks */}
              {result.remarks && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                  <span className="font-semibold">Remarks: </span>
                  {result.remarks}
                </div>
              )}

            </div>
          )}

          {/* Back link */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Questions? Visit City Hall, Monday–Friday, 8:00 AM – 5:00 PM.
            </p>
            <Link
              to="/staff/login"
              className="text-xs text-gray-400 hover:text-gray-600 no-print"
            >
              Staff Login →
            </Link>
          </div>

        </div>

        <p className="text-center text-red-200 text-xs mt-4 no-print">
          Bookmark this page after checking — your reference number is saved in the link.
        </p>

      </div>
    </div>
  )
}

export default StatusChecker