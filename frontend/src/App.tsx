import { Navigate, Route, Routes } from "react-router"

import { CallTypes } from "@/pages/admin/call-types"
import { CallTypeSlots } from "@/pages/guest/call-type-slots"
import { Home } from "@/pages/home"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/call-types/:id" element={<CallTypeSlots />} />
      <Route path="/admin" element={<CallTypes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
