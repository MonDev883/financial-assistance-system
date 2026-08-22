const axios = require("axios")

// ── Send SMS via Semaphore REST API
// Returns true on success, false on failure. Never throws — check the return value.
async function sendSMS(phone, message){
  try {
    // ── LINE 0 ── Fail early if the API key is missing
    if(!process.env.SEMAPHORE_API_KEY){
      console.error("❌ SEMAPHORE_API_KEY is not set — SMS not sent")
      return false
    }

    // ── LINE 1 ── Format Philippine phone number to 11 digits
    let formattedPhone = phone.replace(/\D/g, "")   // remove non-digits

    if(formattedPhone.startsWith("63")){
      formattedPhone = "0" + formattedPhone.slice(2)
    }

    if(!formattedPhone.startsWith("09") || formattedPhone.length !== 11){
      console.warn("⚠️ Invalid Philippine mobile number:", phone)
      return false
    }

    // ── LINE 1b ── Warn on multi-segment messages (Semaphore bills per 160 chars)
    if(message.length > 160){
      console.warn("⚠️ SMS is " + message.length + " chars (" +
        Math.ceil(message.length / 160) + " segments) — billed multiple times")
    }

    // ── LINE 2 ── Send via Semaphore API
    const response = await axios.post(
      "https://api.semaphore.co/api/v4/messages",
      {
        apikey:     process.env.SEMAPHORE_API_KEY,
        number:     formattedPhone,
        message:    message,
        sendername: process.env.SEMAPHORE_SENDER_NAME || "SEMAPHORE"
      }
    )

    // ── LINE 3 ── Semaphore returns HTTP 200 even for rejected messages,
    //              so the real outcome has to be read from the body
    const result = Array.isArray(response.data) ? response.data[0] : response.data

    if(result?.status === "Failed" || result?.status === "Refunded"){
      console.error("❌ SMS rejected by Semaphore:", result)
      return false
    }

    console.log("✅ SMS sent to:", formattedPhone, "— status:", result?.status)
    return true

  } catch(err){
    console.error("❌ SMS error:", err.response?.data || err.message)
    return false
  }
}

module.exports = { sendSMS }

