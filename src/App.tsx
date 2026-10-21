import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconButton, Icon as SharedIcon } from './components/ui'
import './App.css'

export function AppLayout() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const currentPage = location.pathname === '/'
    ? 'Tableau de bord'
    : location.pathname === '/equipements' || location.pathname.startsWith('/equipements/')
      ? 'Équipements'
      : location.pathname === '/incidents' || location.pathname.startsWith('/incidents/')
        ? 'Incidents'
        : location.pathname === '/utilisateurs' || location.pathname.startsWith('/utilisateurs/')
          ? 'Utilisateurs'
          : 'Page introuvable'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="NexusOps, tableau de bord">
          <span className="brand-mark"><SharedIcon name="box" /></span>
          <span>Nexus<span className="brand-light">Ops</span></span>
        </NavLink>
        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav className="primary-nav" aria-label="Navigation principale">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end to="/">
            <SharedIcon name="grid" />
            <span>Tableau de bord</span>
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/equipements">
            <SharedIcon name="box" />
            <span>Équipements</span>
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/incidents">
            <SharedIcon name="alert" />
            <span>Incidents</span>
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/utilisateurs">
            <SharedIcon name="users" />
            <span>Utilisateurs</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">?</span>
            <div><strong>NexusOps</strong><span>Cockpit de supervision</span></div>
            <SharedIcon name="arrow" />
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>NexusOps</span><span>/</span><strong>{currentPage}</strong></div>
          <div className="topbar-actions">
            {searchOpen && (
              <input
                className="global-search"
                type="search"
                aria-label="Rechercher dans les données"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
            )}
            <IconButton
              name="search"
              label={searchOpen ? 'Fermer la recherche' : 'Ouvrir la recherche'}
              expanded={searchOpen}
              onClick={() => {
                setSearchOpen((isOpen) => !isOpen)
                if (searchOpen) setSearchQuery('')
              }}
            />
          </div>
        </header>
        <div className="page-content"><Outlet context={searchQuery} /></div>
      </main>
    </div>
  )
}
