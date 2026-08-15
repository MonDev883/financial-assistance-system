import axios from "axios"

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api"
})

API.interceptors.request.use((config) => {
  const path = window.location.pathname

  if(path.startsWith("/staff")){
    const staffToken = localStorage.getItem("staffToken")
    if(staffToken){
      config.headers.Authorization = "Bearer " + staffToken
    }
  } else {
    const claimantToken = localStorage.getItem("claimantToken")
    if(claimantToken){
      config.headers.Authorization = "Bearer " + claimantToken
    }
  }

  return config
})

export default API