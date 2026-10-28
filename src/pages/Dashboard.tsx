import { NavLink } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState, MetricCard, PageHeading, SectionTitle, StatusBadge } from '../components/ui'
import { matchesSearch, useSearch } from '../contexts/SearchContext'
import { useApiData } from '../hooks/useApiData'
import { getEquipments } from '../services/equipmentService'
import { getIncidents } from '../services/incidentService'
import { getUsers } from '../services/userService'
import type { Equipment, Incident, User } from '../types'

interface DashboardData {
  equipments: Equipment[]
  incidents: Incident[]
  users: User[]
}

function loadDashboard() {
  return Promise.all([getEquipments(), getIncidents(), getUsers()])
    .then(([equipments, incidents, users]): DashboardData => ({ equipments, incidents, users }))
}

const severityLabels: Record<Incident['severity'], string> = { high: 'Élevée', medium: 'Moyenne', low: 'Faible' }
const severityTones: Record<Incident['severity'], 'danger' | 'warning' | 'neutral'> = { high: 'danger', medium: 'warning', low: 'neutral' }
const incidentStatusLabels: Record<Incident['status'], string> = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu' }
const incidentStatusTones: Record<Incident['status'], 'danger' | 'warning' | 'success'> = { open: 'danger', in_progress: 'warning', resolved: 'success' }

export default function Dashboard() {
  const { data, loading, error, reload } = useApiData(loadDashboard)
  const { query } = useSearch()
  const filteredEquipments = data?.equipments.filter((equipment) => matchesSearch(
    query, equipment.name, equipment.type, equipment.site,
    equipment.status === 'online' ? 'En ligne' : 'Hors ligne',
  )) ?? []
  const equipmentNames = new Map(data?.equipments.map((equipment) => [equipment.id, equipment.name]))
  const filteredIncidents = data?.incidents.filter((incident) => matchesSearch(
    query, incident.title, incident.id, equipmentNames.get(incident.equipmentId),
    severityLabels[incident.severity], incidentStatusLabels[incident.status],
  )) ?? []
  const filteredUsers = data?.users.filter((user) => matchesSearch(query, user.name, user.email, user.role)) ?? []
  const openIncidents = filteredIncidents.filter((incident) => incident.status !== 'resolved')

  return (
    <>
      <PageHeading eyebrow="SUPERVISION" title="Tableau de bord" description="Indicateurs en temps réel de votre parc numérique." />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <section className="metrics-grid" aria-label="Indicateurs du parc">
            <MetricCard label="Équipements" value={filteredEquipments.length} icon="box" color="purple" to="/equipements" />
            <MetricCard label="Incidents ouverts" value={openIncidents.length} icon="alert" color="orange" to="/incidents" />
            <MetricCard label="Utilisateurs" value={filteredUsers.length} icon="users" color="blue" to="/utilisateurs" />
            <MetricCard label="Équipements en ligne" value={filteredEquipments.filter((equipment) => equipment.status === 'online').length} icon="grid" color="green" to="/equipements" />
          </section>
          <section className="dashboard-grid">
            <div className="panel recent-panel">
              <SectionTitle title="Incidents récents" description="Incidents signalés dans le système" to="/incidents" linkLabel="Tous les incidents" />
              {filteredIncidents.length === 0
                ? <EmptyState message={query ? 'Aucun incident ne correspond à cette recherche.' : 'Aucun incident enregistré.'} />
                : <div className="incident-list">
                    {filteredIncidents.slice(0, 4).map((incident) => (
                      <NavLink className="incident-row dashboard-incident-link" key={incident.id} to="/incidents">
                        <div className="incident-info"><strong>{incident.title}</strong><span>Incident #{incident.id}</span></div>
                        <div className="incident-meta">
                          <StatusBadge tone={severityTones[incident.severity]}>{severityLabels[incident.severity]}</StatusBadge>
                          <span>{incidentStatusLabels[incident.status]}</span>
                        </div>
                      </NavLink>
                    ))}
                  </div>}
            </div>
            <div className="panel distribution-panel">
              <SectionTitle title="État des équipements" description="Disponibilité des équipements" to="/equipements" linkLabel="Voir la liste" />
              <div className="equipment-status-list">
                <div><StatusBadge tone="success">En ligne</StatusBadge><strong>{filteredEquipments.filter((item) => item.status === 'online').length}</strong></div>
                <div><StatusBadge tone="danger">Hors ligne</StatusBadge><strong>{filteredEquipments.filter((item) => item.status === 'offline').length}</strong></div>
              </div>
            </div>
          </section>
          <section className="panel equipment-panel">
            <SectionTitle title="Équipements" description="Équipements supervisés" to="/equipements" linkLabel="Tous les équipements" />
            {filteredEquipments.length === 0
              ? <EmptyState message={query ? 'Aucun équipement ne correspond à cette recherche.' : 'Aucun équipement enregistré.'} />
              : <div className="table-scroll"><table><thead><tr><th>NOM</th><th>TYPE</th><th>SITE</th><th>STATUT</th></tr></thead>
                  <tbody>{filteredEquipments.slice(0, 4).map((equipment) => (
                    <tr key={equipment.id}><td><NavLink className="dashboard-table-link" to="/equipements">{equipment.name}</NavLink></td><td>{equipment.type}</td><td>{equipment.site}</td><td><EquipmentStatus status={equipment.status} /></td></tr>
                  ))}</tbody>
                </table></div>}
          </section>
        </>
      )}
    </>
  )
}

export function EquipmentStatus({ status }: { status: Equipment['status'] }) {
  return <StatusBadge tone={status === 'online' ? 'success' : 'danger'}>{status === 'online' ? 'En ligne' : 'Hors ligne'}</StatusBadge>
}

export function IncidentSeverityBadge({ severity }: { severity: Incident['severity'] }) {
  return <StatusBadge tone={severityTones[severity]}>{severityLabels[severity]}</StatusBadge>
}

export function IncidentStatusBadge({ status }: { status: Incident['status'] }) {
  return <StatusBadge tone={incidentStatusTones[status]}>{incidentStatusLabels[status]}</StatusBadge>
}

export function RoleLabel({ role }: { role: User['role'] }) {
  return { admin: 'Administrateur', operator: 'Opérateur', viewer: 'Observateur' }[role]
}
