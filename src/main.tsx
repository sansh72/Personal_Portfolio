import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App'
import Template from './Landing'
import ChooseMethod from './MethodSelector'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Analytics />
        <Routes>
          <Route path="/" element={<Template />} />
          <Route path="/method-selector" element={<ChooseMethod />} />
          <Route path="/resume" element={<App />} />
          <Route path="/:username" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
