import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { AppLayout } from './App.tsx'
import Dashboard from './pages/Dashboard'
import Equipments from './pages/Equipments'
import Incidents from './pages/Incidents'
import Users from './pages/Users'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="equipements" element={<Equipments />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="utilisateurs" element={<Users />} />
          <Route path="*" element={<section className="page-content"><h1>Page introuvable</h1><NavLink className="text-link" to="/">Retour au tableau de bord</NavLink></section>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
