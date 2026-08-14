const axios = require("axios")

// ── Send SMS via Semaphore REST API
async function sendSMS(phone, message){
  try {

    // ── LINE 1 ── Format Philippine phone number to 11 digits
    let formattedPhone = phone.replace(/\D/g, "") // remove non-digits

//To be continue by Mon Dev:) 07-13-2026

    if(formattedPhone.startsWith("63")){
      formattedPhone = "0" + formattedPhonehone.slice(2)
    }

    if(!formattedPhone.startsWith("09")){
      console.warn("Invalid Philippine phone number:", phone)
      return false
    }

    // ── LINE 2 ── Send via Semaphore API
    const response = await axios.post(
      "https://api.semaphore.co/api/v4/messages",
      {
        apikey:      process.env.SEMAPHORE_API_KEY,
        number:      formattedPhone,
        message:     message,
        sendername:  process.env.SEMAPHORE_SENDER_NAME || "SEMAPHORE"
      }
    )

    console.log("✅ SMS sent to:", formattedPhone)
    return true

  } catch(err){
    console.error("❌ SMS error:", err.response?.data || err.message)
    return false
  }
}

module.exports = { sendSMS }

