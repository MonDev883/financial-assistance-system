import { useLocation, Link } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import { useRef } from "react"

function SuccessPage(){

  const location = useLocation()
  const data     = location.state
  const qrRef    = useRef()

  if(!data){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No submission data found.</p>
          <Link to="/" className="text-red-600 text-sm mt-2 block">Go back</Link>
        </div>
      </div>
    )
  }

  // ── QR code value links to status checker
  const qrValue = window.location.origin + "/check-status?ref=" + data.referenceNumber

  function downloadQR(){
    const svg    = qrRef.current.querySelector("svg")
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas  = document.createElement("canvas")
    const ctx     = canvas.getContext("2d")
    const img     = new Image()
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url     = URL.createObjectURL(svgBlob)

    img.onload = () => {
      canvas.width  = img.width
      canvas.height = img.height
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const link     = document.createElement("a")
      link.download  = "QR-" + data.referenceNumber + ".png"
      link.href      = canvas.toDataURL("image/png")
      link.click()
      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center p-5">
      <div className="w-full max-w-lg">

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Success icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Application Submitted!
            </h1>
            <p className="text-gray-500 text-sm">
              Your application has been received. Check your phone and email for confirmation.
            </p>
          </div>

          {/* Reference number */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-center">
            <p className="text-xs text-gray-500 mb-1">Your Reference Number</p>
            <p className="text-3xl font-bold text-red-600 tracking-wider">
              {data.referenceNumber}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Save this number to track your application status
            </p>
          </div>

          {/* Details + QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

            {/* Details */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-semibold text-gray-800 text-right">{data.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold text-gray-800">{data.assistanceType}</span>
              </div>
              {data.amountAssigned > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-green-600">
                    ₱{Number(data.amountAssigned).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-yellow-600">Pending Review</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-3 text-center">
                Scan to check status
              </p>
              <div ref={qrRef}>
                <QRCodeSVG
                  value={qrValue}
                  size={130}
                  bgColor="#ffffff"
                  fgColor="#DC2626"
                  level="M"
                  includeMargin={true}
                />
              </div>
              <button
                onClick={downloadQR}
                className="mt-3 text-xs text-red-600 hover:underline font-semibold"
              >
                📥 Download QR Code
              </button>
            </div>

          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 mb-4">
            📱 You will receive an SMS and email notification when your application is approved or rejected.
            Please visit City Hall on your designated pay date with a valid ID and this QR code.
          </div>

          {/* Check status link */}
          <Link
            to="/check-status"
            className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition"
          >
            🔍 Check Application Status
          </Link>

          {/* Staff login link */}
          <div className="mt-4 text-center">
            <Link
              to="/staff/login"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Staff Login →
            </Link>
          </div>

        </div>

      </div>
    </div>
  )
}

export default SuccessPage