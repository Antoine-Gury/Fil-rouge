import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminRoute, AppLayout } from './App.tsx'
import Dashboard from './pages/Dashboard'
import Equipments from './pages/Equipments'
import Incidents from './pages/Incidents'
import Users from './pages/Users'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="equipements" element={<Equipments />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="utilisateurs" element={<Users />} />
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<section className="page-content"><h1>Page introuvable</h1><a className="text-link" href="/">Retour au tableau de bord</a></section>} />
            </Route>
          </Routes>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
