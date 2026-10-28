import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon as SharedIcon } from './components/ui'
import { useAuth } from './contexts/AuthContext'
import { useSearch } from './contexts/SearchContext'
import './App.css'

const navigation = [
  { to: '/', label: 'Tableau de bord', icon: 'grid', end: true },
  { to: '/equipements', label: 'Équipements', icon: 'box', end: false },
  { to: '/incidents', label: 'Incidents', icon: 'alert', end: false },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: 'users', end: false },
]

export function AppLayout() {
  const location = useLocation()
  const { user, loading, initializationError, logout } = useAuth()
  const { query, setQuery } = useSearch()
  const pages = user?.role === 'admin'
    ? [...navigation, { to: '/admin', label: 'Administration', icon: 'settings', end: false }]
    : navigation
  const currentPage = pages.find(({ to, end }) => end ? location.pathname === to : location.pathname.startsWith(to))

  if (loading) return <main className="page-content"><p className="request-state" role="status">Vérification de la session…</p></main>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="NexusOps, tableau de bord">
          <span className="brand-mark"><SharedIcon name="box" /></span>
          <span>Nexus<span className="brand-light">Ops</span></span>
        </NavLink>
        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav className="primary-nav" aria-label="Navigation principale">
          {pages.map((page) => (
            <NavLink
              key={page.to}
              end={page.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              to={page.to}
            >
              <SharedIcon name={page.icon} />
              <span>{page.label}</span>
            </NavLink>
          ))}
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
          <div className="breadcrumbs"><span>NexusOps</span><span>/</span><strong>{currentPage?.label ?? 'Page introuvable'}</strong></div>
          <div className="topbar-actions">
            <label className="search-field topbar-search">
              <SharedIcon name="search" />
              <input
                type="search"
                aria-label="Rechercher dans la page"
                placeholder="Rechercher…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="topbar-user"><span className="avatar">{user.name.split(' ').map((part) => part[0]).join('')}</span><span>{user.name}</span></div>
            <button className="logout-button" type="button" onClick={() => { void logout().catch(() => {}) }} aria-label="Se déconnecter" title="Se déconnecter">
              <SharedIcon name="logout" />
            </button>
          </div>
        </header>
        <div className="page-content">
          {initializationError && <p className="form-message error-message" role="alert">{initializationError}</p>}
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <p className="request-state" role="status">Vérification de la session…</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
