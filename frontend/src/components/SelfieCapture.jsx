import { useState, useRef, useEffect } from "react"

function SelfieCapture({ onCapture }){

  const videoRef                      = useRef(null)
  const canvasRef                     = useRef(null)
  const streamRef                     = useRef(null)

  const [step, setStep]               = useState("idle")
  const [capturedImage, setCapturedImage] = useState(null)
  const [error, setError]             = useState("")
  const [cameraReady, setCameraReady] = useState(false)
  const [pendingStream, setPendingStream] = useState(null)

  // ── Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // ── Attach stream to video element AFTER step changes to "camera"
  // ── This ensures the video element is in the DOM first
  useEffect(() => {
    if(step === "camera" && pendingStream && videoRef.current){
      videoRef.current.srcObject = pendingStream
      videoRef.current.play()
        .then(() => setCameraReady(true))
        .catch(err => {
          console.error("Play error:", err)
          setError("Could not start camera preview. Please try again.")
          setStep("idle")
        })
      setPendingStream(null)
    }
  }, [step, pendingStream])

  async function openCamera(){
    setError("")
    setCameraReady(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width:      { ideal: 640 },
          height:     { ideal: 480 }
        },
        audio: false
      })

      streamRef.current = stream

      // ── Store stream in state, then switch step
      // ── useEffect above will attach it to video after render
      setPendingStream(stream)
      setStep("camera")

    } catch(err){
      console.error("Camera error:", err)
      if(err.name === "NotAllowedError"){
        setError("Camera access was denied. Please allow camera access in your browser settings and try again.")
      } else if(err.name === "NotFoundError"){
        setError("No camera found on this device. Please use a device with a camera.")
      } else {
        setError("Could not open camera. Please try again or use a different browser.")
      }
    }
  }

  function stopCamera(){
    if(streamRef.current){
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }

  function takePhoto(){
    const video  = videoRef.current
    const canvas = canvasRef.current
    if(!video || !canvas) return

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext("2d")
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if(!blob) return
      const file = new File([blob], "selfie-" + Date.now() + ".jpg", {
        type: "image/jpeg"
      })
      setCapturedImage({
        url:  URL.createObjectURL(blob),
        file: file
      })
      stopCamera()
      setStep("preview")
    }, "image/jpeg", 0.92)
  }

  function confirmPhoto(){
    if(!capturedImage) return
    onCapture(capturedImage.file)
    setStep("confirmed")
  }

  function retakePhoto(){
    if(capturedImage?.url){
      URL.revokeObjectURL(capturedImage.url)
    }
    setCapturedImage(null)
    onCapture(null)
    setStep("idle")
  }

  return (
    <div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
        <p className="text-blue-700 text-sm font-semibold mb-1">
          📸 Why do we need a selfie?
        </p>
        <p className="text-blue-600 text-xs leading-relaxed">
          To ensure you are personally registering and to prevent others
          from registering on your behalf. Your photo will only be used
          for identity verification by City Hall staff.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* STEP 1 — Idle */}
      {step === "idle" && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-red-400 transition cursor-pointer"
          onClick={openCamera}
        >
          <div className="text-6xl mb-4">🤳</div>
          <p className="text-base font-bold text-gray-700 mb-2">
            Take a Selfie
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Click to open your camera and take a photo
          </p>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); openCamera() }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition"
          >
            📷 Open Camera
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Make sure your face is clearly visible and well-lit
          </p>
        </div>
      )}

      {/* STEP 2 — Live Camera */}
      {step === "camera" && (
        <div className="text-center">

          <div className="relative inline-block rounded-2xl overflow-hidden border-4 border-red-400 shadow-lg">
            <video
              ref={videoRef}
              style={{ transform: "scaleX(-1)" }}
              className="w-full max-w-sm rounded-2xl block"
              playsInline
              muted
            />
            {/* Face guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-56 border-4 border-white border-dashed rounded-full opacity-60" />
            </div>
            {/* Loading overlay */}
            {!cameraReady && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <p className="text-white text-sm">⏳ Starting camera...</p>
              </div>
            )}
          </div>

          <p className="text-gray-500 text-sm mt-3 mb-4">
            Position your face inside the circle and click Take Photo
          </p>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={takePhoto}
              disabled={!cameraReady}
              className={"px-8 py-3 rounded-xl font-bold text-base transition shadow-lg " + (
                cameraReady
                  ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  : "bg-gray-400 text-white cursor-not-allowed"
              )}
            >
              📸 Take Photo
            </button>
            <button
              type="button"
              onClick={() => { stopCamera(); setStep("idle") }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm transition"
            >
              Cancel
            </button>
          </div>

        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* STEP 3 — Preview */}
      {step === "preview" && capturedImage && (
        <div className="text-center">

          <img
            src={capturedImage.url}
            alt="Your selfie"
            className="w-64 h-64 object-cover rounded-2xl border-4 border-gray-300 shadow-lg mx-auto"
          />

          <p className="text-gray-700 font-bold text-base mt-4 mb-2">
            How does your photo look?
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Make sure your face is clear, well-lit, and not blurry.
          </p>

          {/* Quality checklist */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-left mb-5 max-w-xs mx-auto">
            <p className="text-xs font-bold text-gray-600 mb-2">
              Check before confirming:
            </p>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>✅ Face is clearly visible</li>
              <li>✅ Photo is not blurry</li>
              <li>✅ Good lighting</li>
              <li>✅ No sunglasses or hat</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              type="button"
              onClick={confirmPhoto}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg"
            >
              ✅ Looks Good — Use This Photo
            </button>
            <button
              type="button"
              onClick={retakePhoto}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold text-sm transition"
            >
              🔄 Retake
            </button>
          </div>

        </div>
      )}

      {/* STEP 4 — Confirmed */}
      {step === "confirmed" && capturedImage && (
        <div className="text-center">
          <div className="relative inline-block">
            <img
              src={capturedImage.url}
              alt="Confirmed selfie"
              className="w-32 h-32 object-cover rounded-full border-4 border-green-400 shadow-lg mx-auto"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
              ✓
            </div>
          </div>
          <p className="text-green-600 font-bold text-sm mt-3">
            ✅ Selfie confirmed
          </p>
          <button
            type="button"
            onClick={retakePhoto}
            className="mt-2 text-xs text-gray-400 hover:text-red-600 hover:underline"
          >
            🔄 Retake photo
          </button>
        </div>
      )}

      {/* Tips */}
      {step !== "confirmed" && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <p className="text-yellow-700 text-xs leading-relaxed">
            <strong>📱 Tips for a good selfie:</strong> Find a well-lit area,
            face the camera directly, hold the device steady, and make sure
            your face is inside the circle guide.
          </p>
        </div>
      )}

    </div>
  )
}

export default SelfieCapture