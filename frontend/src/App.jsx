import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// ── Public pages
import ApplyForm    from "./pages/Apply"
import SuccessPage  from "./pages/Success"
import StatusChecker from "./pages/StatusChecker"

// ── Staff pages
import StaffLogin     from "./pages/staff/Login"
import StaffDashboard from "./pages/staff/Dashboard"
import WindowManager  from "./pages/staff/WindowManager"
import StaffManager   from "./pages/staff/StaffManager"
import Analytics      from "./pages/staff/Analytics"
import BatchManager   from "./pages/staff/BatchManager"
import AuditLogPage   from "./pages/staff/AuditLog"

function App(){
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Default — public status checker is the front door ── */}
        <Route path="/" element={<Navigate to="/check-status" />} />

        {/* ── Public application form ── */}
        <Route path="/apply/:windowId" element={<ApplyForm />} />
        <Route path="/success"         element={<SuccessPage />} />
        <Route path="/check-status"    element={<StatusChecker />} />

        {/* ── Staff ── */}
        <Route path="/staff/login"     element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/windows"   element={<WindowManager />} />
        <Route path="/staff/accounts"  element={<StaffManager />} />
        <Route path="/staff/analytics/:windowId" element={<Analytics />} />
        <Route path="/staff/batches/:windowId"   element={<BatchManager />} />
        <Route path="/staff/audit"               element={<AuditLogPage />} />
        {/* ── Catch-all for mistyped or outdated URLs ── */}
        <Route path="*" element={<Navigate to="/check-status" />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App