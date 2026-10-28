import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export function Icon({ name }: { name: string }) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...shared}>
      {name === 'grid' && <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>}
      {name === 'box' && <><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" /><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21M7.8 5.2l8.4 4.6" /></>}
      {name === 'alert' && <><path d="M10.3 4.6 2.8 18a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L13.7 4.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4.5m0 3h.01" /></>}
      {name === 'users' && <><path d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 18.3V20" /><circle cx="9.5" cy="7.5" r="3.5" /><path d="M17 11a3.5 3.5 0 0 0 0-7m4 16v-1.7a3.3 3.3 0 0 0-2.5-3.2" /></>}
      {name === 'search' && <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>}
      {name === 'arrow' && <><path d="M5 12h14m-6-6 6 6-6 6" /></>}
      {name === 'logout' && <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>}
      {name === 'settings' && <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a7.8 7.8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a7.8 7.8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a7.8 7.8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a7.8 7.8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a7.8 7.8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7.8 7.8 0 0 1-.1 2Z" /></>}
    </svg>
  )
}

export function IconButton({ name, label }: { name: string; label: string }) {
  return <button type="button" className="icon-button" aria-label={label}><Icon name={name} /></button>
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  )
}

export function SectionTitle({ title, description, to, linkLabel }: { title: string; description: string; to?: string; linkLabel?: string }) {
  return (
    <div className="panel-heading">
      <div><h2>{title}</h2><p>{description}</p></div>
      {to && linkLabel && <NavLink className="text-link" to={to}>{linkLabel}<Icon name="arrow" /></NavLink>}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>
}

export function LoadingState() {
  return <div className="request-state" role="status">Chargement des données…</div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="request-error" role="alert">
      <span>{message}</span>
      <button className="filter-button" type="button" onClick={onRetry}>Réessayer</button>
    </div>
  )
}

export function StatusBadge({ children, tone }: { children: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  return <span className={`status status-${tone}`}><span />{children}</span>
}

export function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{label}</span><span className={`metric-icon ${color}`}><Icon name={icon} /></span></div>
      <strong className="metric-value">{value}</strong>
    </article>
  )
}
