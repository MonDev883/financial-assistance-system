import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../api"

function ApplyForm(){

  const [form, setForm] = useState({
    fullName:         "",
    age:              "",
    contactNumber:    "",
    purok:            "",
    barangay:         "",
    municipality:     "",
    householdMembers: "",
    householdIncome:  "",
    idType:           "",
    idNumber:         "",
    assistanceType:   "",
    reason:           ""
  })

  const [idPhoto,       setIdPhoto]       = useState(null)
  const [barangayCert,  setBarangayCert]  = useState(null)
  const [window,        setWindow]        = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [checking,      setChecking]      = useState(true)
  const [error,         setError]         = useState("")
  const [success,       setSuccess]       = useState("")
  const navigate                          = useNavigate()

  useEffect(() => {
    checkWindow()
  }, [])

  async function checkWindow(){
    try {
      const res = await API.get("/windows/current")
      setWindow(res.data)
      if(!res.data.isOpen){
        setError(res.data.message || "Applications are currently closed.")
      }
    } catch(err){
      setError("Failed to check application window.")
    } finally {
      setChecking(false)
    }
  }

  function handleChange(e){
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError("")
    setSuccess("")

    if(!window?.isOpen){
      setError("Applications are currently closed.")
      return
    }

    // Validate all fields
    const required = [
      "fullName", "age", "contactNumber",
      "purok", "barangay", "municipality",
      "householdMembers", "householdIncome",
      "idType", "idNumber",
      "assistanceType", "reason"
    ]

    for(const field of required){
      if(!form[field]){
        setError("All fields are required")
        return
      }
    }

    if(!idPhoto){
      setError("Please upload a photo of your Government ID")
      return
    }

    if(!barangayCert){
      setError("Please upload your Barangay Certificate or Certificate of Indigency")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value)
      })

      formData.append("idPhoto",      idPhoto)
      formData.append("barangayCert", barangayCert)

      const res = await API.post("/applications/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      setSuccess(
        `✅ Application submitted successfully!\n` +
        `Your reference number is: ${res.data.referenceNumber}\n` +
        `An SMS confirmation will be sent to your phone.`
      )

      setTimeout(() => navigate("/claimant/dashboard"), 4000)

    } catch(err){
      setError(err.response?.data?.message || "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1"
  const sectionTitle = "text-sm font-bold text-red-600 uppercase tracking-wide mb-4"

  if(checking){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">⏳ Checking application window...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-lg font-bold">💰 Financial Assistance</h1>
          <p className="text-red-200 text-xs">City Hall Portal</p>
        </div>
        <Link
          to="/claimant/dashboard"
          className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
        >
          ← Back
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Window info banner */}
        {window?.isOpen && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-green-700 font-semibold text-sm">
              🟢 {window.title}
            </p>
            <p className="text-green-600 text-xs mt-1">
              Closes: {new Date(window.endDate).toLocaleDateString("en-PH", {
                year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit"
              })}
            </p>
            {window.maxAmount > 0 && (
              <p className="text-green-600 text-xs mt-1">
                Maximum assistance: ₱{Number(window.maxAmount).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Closed banner */}
        {!window?.isOpen && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-red-700 font-bold text-lg mb-2">
              Applications are Closed
            </h3>
            <p className="text-red-600 text-sm">
              {window?.message || "There is no active application window at this time."}
            </p>
            <Link
              to="/claimant/dashboard"
              className="inline-block mt-4 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Form — only show if window is open */}
        {window?.isOpen && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                📋 Application Form
              </h2>
              <p className="text-gray-500 text-sm">
                Fill in all fields accurately. Incomplete applications will not be processed.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-4 text-sm mb-6 whitespace-pre-line font-semibold">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* SECTION 1 — Personal Info */}
              <div>
                <h3 className={sectionTitle}>1. Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Full Name</label>
                    <input className={inputClass} name="fullName"
                      placeholder="e.g. Juan dela Cruz"
                      value={form.fullName} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Age</label>
                    <input className={inputClass} name="age" type="number"
                      placeholder="e.g. 65"
                      value={form.age} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <input className={inputClass} name="contactNumber"
                      placeholder="e.g. 09171234567"
                      value={form.contactNumber} onChange={handleChange} />
                  </div>

                </div>
              </div>

              {/* SECTION 2 — Address */}
              <div className="border-t pt-6">
                <h3 className={sectionTitle}>2. Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>Purok / Street</label>
                    <input className={inputClass} name="purok"
                      placeholder="e.g. Purok 3 / Rizal St"
                      value={form.purok} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Barangay</label>
                    <input className={inputClass} name="barangay"
                      placeholder="e.g. Barangay Poblacion"
                      value={form.barangay} onChange={handleChange} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Municipality / City</label>
                    <input className={inputClass} name="municipality"
                      placeholder="e.g. Cagayan de Oro City"
                      value={form.municipality} onChange={handleChange} />
                  </div>

                </div>
              </div>

              {/* SECTION 3 — Household Info */}
              <div className="border-t pt-6">
                <h3 className={sectionTitle}>3. Household Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>Number of Household Members</label>
                    <input className={inputClass} name="householdMembers" type="number"
                      placeholder="e.g. 5"
                      value={form.householdMembers} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Monthly Household Income (₱)</label>
                    <input className={inputClass} name="householdIncome" type="number"
                      placeholder="e.g. 5000"
                      value={form.householdIncome} onChange={handleChange} />
                  </div>

                </div>
              </div>

              {/* SECTION 4 — Government ID */}
              <div className="border-t pt-6">
                <h3 className={sectionTitle}>4. Government ID</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <label className={labelClass}>ID Type</label>
                    <select className={inputClass} name="idType"
                      value={form.idType} onChange={handleChange}>
                      <option value="">Select ID Type</option>
                      <option>SSS</option>
                      <option>GSIS</option>
                      <option>PhilHealth</option>
                      <option>TIN</option>
                      <option>Postal ID</option>
                      <option>Voter's ID</option>
                      <option>Senior Citizen ID</option>
                      <option>PWD ID</option>
                      <option>Driver's License</option>
                      <option>Passport</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>ID Number</label>
                    <input className={inputClass} name="idNumber"
                      placeholder="Enter your ID number"
                      value={form.idNumber} onChange={handleChange} />
                  </div>

                  {/* ID Photo upload */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Upload Government ID Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition cursor-pointer">
                      <input type="file" accept="image/*"
                        onChange={e => setIdPhoto(e.target.files[0])}
                        className="hidden" id="idPhotoInput" />
                      <label htmlFor="idPhotoInput" className="cursor-pointer">
                        {idPhoto ? (
                          <div className="text-green-600 font-semibold text-sm">
                            ✅ {idPhoto.name}
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl mb-2">🪪</div>
                            <p className="text-sm text-gray-500">Click to upload ID photo</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP — max 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 5 — Barangay Certificate */}
              <div className="border-t pt-6">
                <h3 className={sectionTitle}>5. Proof of Residency</h3>
                <div>
                  <label className={labelClass}>
                    Barangay Certificate / Certificate of Indigency
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Upload a clear photo or scanned copy of your Barangay Certificate or Certificate of Indigency.
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition cursor-pointer">
                    <input type="file" accept="image/*,application/pdf"
                      onChange={e => setBarangayCert(e.target.files[0])}
                      className="hidden" id="barangayCertInput" />
                    <label htmlFor="barangayCertInput" className="cursor-pointer">
                      {barangayCert ? (
                        <div className="text-green-600 font-semibold text-sm">
                          ✅ {barangayCert.name}
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl mb-2">📄</div>
                          <p className="text-sm text-gray-500">Click to upload Barangay Certificate</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP or PDF — max 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 6 — Assistance Details */}
              <div className="border-t pt-6">
                <h3 className={sectionTitle}>6. Assistance Details</h3>
                <div className="space-y-4">

                  <div>
                    <label className={labelClass}>Type of Assistance Needed</label>
                    <select className={inputClass} name="assistanceType"
                      value={form.assistanceType} onChange={handleChange}>
                      <option value="">Select Type</option>
                      <option>Medical</option>
                      <option>Burial</option>
                      <option>Educational</option>
                      <option>Calamity</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Reason for Application</label>
                    <textarea className={`${inputClass} resize-none`}
                      name="reason" rows={4}
                      placeholder="Briefly explain your situation and why you need financial assistance..."
                      value={form.reason} onChange={handleChange} />
                  </div>

                  {/* Show auto-assigned amount */}
                  {form.assistanceType && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4">
                      <p className="text-xs text-gray-500 mb-1">Assistance Amount</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₱{Number(window?.amounts?.[form.assistanceType] || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        This is the fixed amount set by City Hall for {form.assistanceType} assistance.
                      </p>
                    </div>
                  )}
                 
                </div>
              </div>

              {/* Submit */}
              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700 mb-4">
                  ⚠️ Make sure all information is accurate and documents are clear before submitting.
                  You can only submit <strong>one application</strong> per application window.
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