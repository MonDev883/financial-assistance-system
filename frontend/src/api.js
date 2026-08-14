import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:5001/api"
})

// ── Automatically attach the correct token based on current page
API.interceptors.request.use((config) => {

  const path = window.location.pathname

  // ── If we're on a staff page, use staff token
  if(path.startsWith("/staff")){
    const staffToken = localStorage.getItem("staffToken")
    if(staffToken){
      config.headers.Authorization = `Bearer ${staffToken}`
    }
  } else {
    // ── Otherwise use claimant token
    const claimantToken = localStorage.getItem("claimantToken")
    if(claimantToken){
      config.headers.Authorization = `Bearer ${claimantToken}`
    }
  }

  return config
})

export default API