import SelfieCapture from "../components/SelfieCapture"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import API from "../api"

function ApplyForm(){

  const { windowId } = useParams()
  const navigate     = useNavigate()

  const [windowInfo, setWindowInfo] = useState(null)
  const [checking,   setChecking]   = useState(true)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState("")

  const [form, setForm] = useState({
    lastName:         "",
    firstName:        "",
    middleName:       "",
    dateOfBirth:      "",
    gender:           "",
    civilStatus:      "",
    houseNo:          "",
    street:           "",
    barangay:         "",
    city:             "",
    province:         "",
    zipCode:          "",
    contactNumber:    "",
    email:            "",
    assistanceType:   ""
  })

  const [selfie, setSelfie] = useState(null)

  useEffect(() => {
    checkWindow()
  }, [])

  async function checkWindow(){
    try {
      // ── Fetch window info directly by ID
      const res = await API.get(`/windows/public/${windowId}`)
      setWindowInfo(res.data)

      if(!res.data.isOpen){
        setError(res.data.message || "This application window is closed.")
      }
    } catch(err){
      setError("Invalid or expired application link.")
    } finally {
      setChecking(false)
    }
  }

  function handleChange(e){
    let value = e.target.value

    // ── Strip formatting from phone numbers as the user types
    if(e.target.name === "contactNumber"){
      value = value.replace(/[\s-()]/g, "")
      if(value.startsWith("+63")) value = "0" + value.slice(3)
      else if(value.startsWith("63") && value.length > 10) value = "0" + value.slice(2)
    }

    setForm({ ...form, [e.target.name]: value })
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError("")

    const required = [
      "lastName", "firstName", "dateOfBirth",
      "gender", "civilStatus",
      "houseNo", "street", "barangay",
      "city", "province", "zipCode",
      "contactNumber", "assistanceType"
    ]

    for(const field of required){
      if(!form[field]){
        setError("Please fill in all required fields.")
        return
      }
    }

    if(!selfie){
      setError("Please upload a selfie photo for identity verification")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value)
      })

      formData.append("selfie", selfie)

      const res = await API.post(`/applications/submit/${windowId}`, formData)

      // ── Redirect to success page with result
      navigate("/success", {
        state: {
          referenceNumber: res.data.referenceNumber,
          name:            res.data.name,
          assistanceType:  res.data.assistanceType,
          amountAssigned:  res.data.amountAssigned
        }
      })

    } catch(err){
      setError(err.response?.data?.message || "Submission failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass  = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  const labelClass  = "block text-sm font-semibold text-gray-700 mb-1"
  const sectionHead = "text-sm font-bold text-red-600 uppercase tracking-wide mb-4"

  if(checking){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">⏳ Loading application form...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-5 text-center shadow">
        <h1 className="text-xl font-bold">🏛️ City Hall Financial Assistance</h1>
        {windowInfo?.isOpen && (
          <p className="text-red-200 text-sm mt-1">{windowInfo.title}</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Closed state */}
        {!windowInfo?.isOpen ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Applications Closed
            </h2>
            <p className="text-gray-500 text-sm">
              {error || "This application window is no longer accepting submissions."}
            </p>
          </div>
        ) : (

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

            {/* Window info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
              <p className="text-green-700 font-semibold text-sm">
                🟢 Applications are currently OPEN
              </p>
              <p className="text-green-600 text-xs mt-1">
                Closes: {new Date(windowInfo.endDate).toLocaleDateString("en-PH", {
                  year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
              {windowInfo.description && (
                <p className="text-green-700 text-sm mt-2">{windowInfo.description}</p>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Application Form
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Fill in all required fields accurately. Fields marked with
              <span className="text-red-500 font-bold"> *</span> are required.
            </p>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* SECTION 1 — Personal Info */}
              <div>
                <h3 className={sectionHead}>1. Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="lastName"
                      placeholder="e.g. dela Cruz"
                      value={form.lastName} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="firstName"
                      placeholder="e.g. Juan"
                      value={form.firstName} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Middle Name</label>
                    <input className={inputClass} name="middleName"
                      placeholder="e.g. Santos (optional)"
                      value={form.middleName} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                      <input className={inputClass} name="dateOfBirth"
                      type="date"
                      max={new Date(Date.now() - 18 * 31557600000).toISOString().split("T")[0]}
                      min="1900-01-01"
                      value={form.dateOfBirth} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 mt-2">
                      {["Male", "Female", "Other"].map(g => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio" name="gender" value={g}
                            checked={form.gender === g}
                            onChange={handleChange}
                            className="accent-red-600"
                          />
                          <span className="text-sm text-gray-700">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Civil Status <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["Single", "Married", "Widowed", "Separated"].map(s => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio" name="civilStatus" value={s}
                            checked={form.civilStatus === s}
                            onChange={handleChange}
                            className="accent-red-600"
                          />
                          <span className="text-sm text-gray-700">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 2 — Address */}
              <div className="border-t pt-6">
                <h3 className={sectionHead}>2. Present Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>
                      House No. <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="houseNo"
                      placeholder="e.g. 123"
                      value={form.houseNo} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Street <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="street"
                      placeholder="e.g. Rizal Street"
                      value={form.street} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Barangay <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="barangay"
                      placeholder="e.g. Barangay Poblacion"
                      value={form.barangay} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      City / Municipality <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="city"
                      placeholder="e.g. Cagayan de Oro City"
                      value={form.city} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Province <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="province"
                      placeholder="e.g. Misamis Oriental"
                      value={form.province} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="zipCode"
                      placeholder="e.g. 9000"
                      value={form.zipCode} onChange={handleChange} />
                  </div>

                </div>
              </div>

              {/* SECTION 3 — Contact */}
              <div className="border-t pt-6">
                <h3 className={sectionHead}>3. Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input className={inputClass} name="contactNumber"
                      placeholder="e.g. 09171234567"
                      pattern="^(09|\+639)\d{9}$"
                      title="Format: 09XXXXXXXXX or +639XXXXXXXXX"
                      value={form.contactNumber} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input className={inputClass} name="email"
                      type="email"
                      placeholder="e.g. juan@email.com (optional)"
                      value={form.email} onChange={handleChange} />
                  </div>

                </div>
              </div>

             {/* SECTION 6 — Assistance Type */}
              <div className="border-t pt-6">
                <h3 className={sectionHead}>6. Type of Assistance</h3>
                <div>
                  <label className={labelClass}>
                    Type of Assistance <span className="text-red-500">*</span>
                  </label>
                  <select className={inputClass} name="assistanceType"
                    value={form.assistanceType} onChange={handleChange}>
                    <option value="">Select type of assistance</option>
                    {["Medical", "Burial", "Educational", "Calamity", "Other"].map(type => (
                      <option key={type} value={type}>
                        {type}
                        {windowInfo?.amounts?.[type] > 0
                          ? " — ₱" + Number(windowInfo.amounts[type]).toLocaleString()
                          : ""}
                      </option>
                    ))}
                  </select>

                  {form.assistanceType && windowInfo?.amounts?.[form.assistanceType] > 0 && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <p className="text-xs text-gray-500">Assistance Amount</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₱{Number(windowInfo.amounts[form.assistanceType]).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Fixed amount set by City Hall for {form.assistanceType} assistance
                      </p>
                    </div>
                  )}
                </div>
              </div>

            {/* SECTION 7 — Selfie Camera Capture */}
              <div className="border-t pt-6">
                <h3 className={sectionHead}>7. Identity Verification</h3>

                <SelfieCapture onCapture={setSelfie} />

              </div>

              {/* Submit */}
              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700 mb-4">
                  ⚠️ Make sure all information is accurate. You can only submit
                  <strong> one application</strong> per application window.
                  An SMS confirmation will be sent to your contact number.
                </div>

                <button
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-bold text-base transition
                    ${loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 cursor-pointer"
                    }`}
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplyForm