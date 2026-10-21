import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconButton, Icon as SharedIcon } from './components/ui'
import './App.css'

const navigation = [
  { to: '/', label: 'Tableau de bord', icon: 'grid', end: true },
  { to: '/equipements', label: 'Équipements', icon: 'box', end: false },
  { to: '/incidents', label: 'Incidents', icon: 'alert', end: false },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: 'users', end: false },
]

export function AppLayout() {
  const location = useLocation()
  const currentPage = navigation.find(({ to, end }) => end ? location.pathname === to : location.pathname.startsWith(to))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="NexusOps, tableau de bord">
          <span className="brand-mark"><SharedIcon name="box" /></span>
          <span>Nexus<span className="brand-light">Ops</span></span>
        </NavLink>
        <div className="workspace-label">ESPACE DE TRAVAIL</div>
        <nav className="primary-nav" aria-label="Navigation principale">
          {navigation.map((page) => (
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
          <div className="topbar-actions"><IconButton name="search" label="Rechercher" /></div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
