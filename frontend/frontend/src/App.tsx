import { BrowserRouter, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { ChatPage } from "@/pages/ChatPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  )
}
