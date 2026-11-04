import { Navigate, Route, Routes } from "react-router"

import { Booking } from "@/pages/booking"
import { Home } from "@/pages/home"
import { CallTypes } from "@/pages/admin/call-types"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/booking/:duration" element={<Booking />} />
      <Route path="/admin" element={<CallTypes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
