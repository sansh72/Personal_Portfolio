import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Analytics />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/:username" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
