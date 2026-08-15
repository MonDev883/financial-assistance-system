# 🏛️ Financial Assistance System

A full-stack web application for city government financial assistance programs. Eliminates long queues by allowing community members to apply online via a shareable link — no account registration needed.

## 🌐 Live Demo

- **Application Form:** Share the link generated from Staff Dashboard
- **Status Checker:** https://cute-gaufre-42f141.netlify.app/check-status
- **Staff Portal:** https://cute-gaufre-42f141.netlify.app/staff/login

### Demo Credentials (Staff)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cityhall.gov.ph | Admin1234 |

---

## 📸 Screenshots

> Staff Dashboard — Application Management
> Public Application Form — No login required
> Analytics Dashboard — Charts and reports
> Status Checker — QR Code support

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API server
- **MongoDB** + **Mongoose** — Database
- **JWT** — Authentication for staff accounts
- **Nodemailer** — Email notifications via Gmail
- **Semaphore** — SMS notifications (Philippine numbers)
- **ExcelJS** — Excel export
- **Multer** — File uploads
- **Helmet** — Security headers
- **Express Rate Limit** — Brute force protection

### Frontend
- **React** + **Vite** — Frontend framework
- **React Router DOM** — Client-side routing
- **Tailwind CSS** — Styling
- **Recharts** — Analytics charts
- **QRCode.react** — QR code generation
- **Axios** — HTTP requests

### Deployment
- **Backend:** Render.com (Free tier)
- **Frontend:** Netlify (Free tier)
- **Database:** MongoDB Atlas (Free tier)

---

## ✨ Features

### Public (No Login Required)
- ✅ Time-limited application windows set by admin
- ✅ Application form accessible via shareable link only
- ✅ Duplicate detection (name + date of birth)
- ✅ Automatic amount assignment per assistance type
- ✅ Reference number generated on submission
- ✅ QR code on success page for easy status checking
- ✅ SMS confirmation via Semaphore
- ✅ Email confirmation via Gmail
- ✅ Status checker page (enter reference number)

### Staff Portal
- ✅ Secure JWT-based login
- ✅ Create and manage application windows with start/end dates
- ✅ Set fixed assistance amounts per type per window
- ✅ Review applications (Approve / Reject)
- ✅ Bulk approve multiple applications at once
- ✅ Set pay dates for approved applicants
- ✅ Mark applications as Paid
- ✅ Search by name, barangay, or reference number
- ✅ Export applications to Excel
- ✅ Analytics dashboard with charts
- ✅ Multiple staff account management (Admin only)
- ✅ SMS + Email notifications on status updates

### Analytics
- ✅ Applications by