import { useState, type FormEvent } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { matchesSearch, useSearch } from '../contexts/SearchContext'
import { useAuth } from '../contexts/AuthContext'
import { useApiData } from '../hooks/useApiData'
import {
  createEquipment,
  deleteEquipment,
  deleteIncident,
  deleteUser,
  getAdminUsers,
  updateEquipment,
  updateIncident,
  updateUserRole,
} from '../services/adminService'
import { getEquipments } from '../services/equipmentService'
import { getIncidents } from '../services/incidentService'
import type { Equipment, Incident, User, UserRole } from '../types'

type AdminSection = 'users' | 'equipments' | 'incidents'

interface AdminData {
  users: User[]
  equipments: Equipment[]
  incidents: Incident[]
}

function loadAdminData() {
  return Promise.all([getAdminUsers(), getEquipments(), getIncidents()])
    .then(([users, equipments, incidents]): AdminData => ({ users, equipments, incidents }))
}

const roleLabels: Record<UserRole, string> = { admin: 'Administrateur', operator: 'Opérateur', viewer: 'Observateur' }
const sections: Array<{ id: AdminSection; label: string }> = [
  { id: 'users', label: 'Comptes' },
  { id: 'equipments', label: 'Équipements' },
  { id: 'incidents', label: 'Incidents' },
]

export default function Admin() {
  const { data, loading, error, reload } = useApiData(loadAdminData)
  const { user: currentUser } = useAuth()
  const { query } = useSearch()
  const [section, setSection] = useState<AdminSection>('users')
  const [operationError, setOperationError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [newEquipment, setNewEquipment] = useState({ name: '', type: '', site: '', status: 'online' as Equipment['status'] })

  async function perform<T>(key: string, operation: () => Promise<T>, successMessage: string): Promise<boolean> {
    setPendingId(key)
    setOperationError('')
    setSuccess('')
    try {
      await operation()
      setSuccess(successMessage)
      reload()
      return true
    } catch (reason) {
      setOperationError(reason instanceof Error ? reason.message : 'L’opération a échoué.')
      return false
    } finally {
      setPendingId(null)
    }
  }

  async function handleCreateEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (await perform('equipment-new', () => createEquipment(newEquipment), 'Équipement créé.')) {
      setNewEquipment({ name: '', type: '', site: '', status: 'online' })
    }
  }

  const filteredUsers = data?.users.filter((user) => matchesSearch(query, user.name, user.email, roleLabels[user.role], user.id))
  const filteredEquipments = data?.equipments.filter((equipment) => matchesSearch(
    query, equipment.name, equipment.type, equipment.site, equipment.status === 'online' ? 'En ligne' : 'Hors ligne', equipment.id,
  ))
  const equipmentNames = new Map(data?.equipments.map((equipment) => [equipment.id, equipment.name]))
  const filteredIncidents = data?.incidents.filter((incident) => matchesSearch(
    query, incident.title, incident.id, equipmentNames.get(incident.equipmentId), incident.severity, incident.status,
  ))

  return (
    <>
      <PageHeading eyebrow="ESPACE SÉCURISÉ" title="Administration" description="Gérez les comptes, les équipements et les incidents de NexusOps." />
      {data && (
        <section className="admin-summary" aria-label="Ressources gérées">
          <div className="panel admin-summary-card"><span>Comptes</span><strong>{data.users.length}</strong></div>
          <div className="panel admin-summary-card"><span>Équipements</span><strong>{data.equipments.length}</strong></div>
          <div className="panel admin-summary-card"><span>Incidents</span><strong>{data.incidents.length}</strong></div>
        </section>
      )}
      <section className="panel admin-panel">
        <nav className="admin-tabs" aria-label="Sections d’administration">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-tab${section === item.id ? ' active' : ''}`}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {operationError && <p className="admin-feedback error-message" role="alert">{operationError}</p>}
        {success && <p className="admin-feedback success-message" role="status">{success}</p>}
        {data && section === 'users' && (
          <div className="admin-section">
            <div className="panel-heading"><div><h2>Comptes utilisateurs</h2><p>Modifiez les rôles ou supprimez un compte.</p></div></div>
            {filteredUsers?.length === 0
              ? <EmptyState message={query ? 'Aucun compte ne correspond à cette recherche.' : 'Aucun compte utilisateur.'} />
              : <div className="table-scroll"><table><thead><tr><th>NOM</th><th>EMAIL</th><th>RÔLE</th><th>ACTIONS</th></tr></thead>
                  <tbody>{filteredUsers?.map((user) => (
                    <tr key={`${user.id}-${user.role}`}>
                      <td className="table-primary">{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <UserRoleEditor
                          user={user}
                          disabled={pendingId === `user-role-${user.id}`}
                          locked={currentUser?.id === user.id}
                          onSave={(role) => perform(`user-role-${user.id}`, () => updateUserRole(user.id, role), 'Rôle mis à jour.')}
                        />
                      </td>
                      <td><button className="danger-button" type="button" disabled={pendingId === `user-${user.id}`} onClick={() => {
                        if (window.confirm(`Supprimer définitivement le compte de ${user.name} ?`)) {
                          void perform(`user-${user.id}`, () => deleteUser(user.id), 'Compte supprimé.')
                        }
                      }}>Supprimer</button></td>
                    </tr>
                  ))}</tbody>
                </table></div>}
          </div>
        )}
        {data && section === 'equipments' && (
          <div className="admin-section">
            <div className="panel-heading"><div><h2>Gestion des équipements</h2><p>Ajoutez, modifiez ou supprimez un équipement.</p></div></div>
            <form className="admin-create-form" onSubmit={(event) => { void handleCreateEquipment(event) }}>
              <label className="form-field">Nom<input required maxLength={120} value={newEquipment.name} onChange={(event) => setNewEquipment({ ...newEquipment, name: event.target.value })} /></label>
              <label className="form-field">Type<input required maxLength={80} value={newEquipment.type} onChange={(event) => setNewEquipment({ ...newEquipment, type: event.target.value })} /></label>
              <label className="form-field">Site<input required maxLength={120} value={newEquipment.site} onChange={(event) => setNewEquipment({ ...newEquipment, site: event.target.value })} /></label>
              <label className="form-field">Statut<select value={newEquipment.status} onChange={(event) => setNewEquipment({ ...newEquipment, status: event.target.value as Equipment['status'] })}><option value="online">En ligne</option><option value="offline">Hors ligne</option></select></label>
              <button className="primary-button" type="submit" disabled={pendingId === 'equipment-new'}>Ajouter</button>
            </form>
            {filteredEquipments?.length === 0
              ? <EmptyState message={query ? 'Aucun équipement ne correspond à cette recherche.' : 'Aucun équipement.'} />
              : <div className="admin-record-list">{filteredEquipments?.map((equipment) => (
                  <EquipmentEditor
                    key={equipment.id}
                    equipment={equipment}
                    pending={pendingId === `equipment-${equipment.id}`}
                    onSave={(nextEquipment) => perform(`equipment-${equipment.id}`, () => updateEquipment(equipment.id, nextEquipment), 'Équipement mis à jour.')}
                    onDelete={() => {
                      if (window.confirm(`Supprimer l’équipement ${equipment.name} ?`)) {
                        void perform(`equipment-${equipment.id}`, () => deleteEquipment(equipment.id), 'Équipement supprimé.')
                      }
                    }}
                  />
                ))}</div>}
          </div>
        )}
        {data && section === 'incidents' && (
          <div className="admin-section">
            <div className="panel-heading"><div><h2>Gestion des incidents</h2><p>Modifiez le suivi ou supprimez un incident.</p></div></div>
            {filteredIncidents?.length === 0
              ? <EmptyState message={query ? 'Aucun incident ne correspond à cette recherche.' : 'Aucun incident.'} />
              : <div className="admin-record-list">{filteredIncidents?.map((incident) => (
                  <IncidentEditor
                    key={incident.id}
                    incident={incident}
                    equipments={data.equipments}
                    pending={pendingId === `incident-${incident.id}`}
                    onSave={(nextIncident) => perform(`incident-${incident.id}`, () => updateIncident(incident.id, nextIncident), 'Incident mis à jour.')}
                    onDelete={() => {
                      if (window.confirm(`Supprimer définitivement l’incident « ${incident.title} » ?`)) {
                        void perform(`incident-${incident.id}`, () => deleteIncident(incident.id), 'Incident supprimé.')
                      }
                    }}
                  />
                ))}</div>}
          </div>
        )}
      </section>
    </>
  )
}

function UserRoleEditor({ user, disabled, locked, onSave }: { user: User; disabled: boolean; locked: boolean; onSave: (role: UserRole) => Promise<boolean> }) {
  const [role, setRole] = useState(user.role)
  return (
    <form className="admin-role-form" onSubmit={(event) => { event.preventDefault(); void onSave(role) }}>
      <select aria-label={`Rôle de ${user.name}`} value={role} disabled={locked} onChange={(event) => setRole(event.target.value as UserRole)}>
        {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className="filter-button" type="submit" disabled={disabled || locked || role === user.role}>{disabled ? '…' : 'Enregistrer'}</button>
    </form>
  )
}

function EquipmentEditor({ equipment, pending, onSave, onDelete }: {
  equipment: Equipment
  pending: boolean
  onSave: (equipment: Omit<Equipment, 'id'>) => Promise<boolean>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Omit<Equipment, 'id'>>({
    name: equipment.name, type: equipment.type, site: equipment.site, status: equipment.status,
  })

  if (!editing) {
    return (
      <article className="admin-record">
        <div><strong>{equipment.name}</strong><span>{equipment.type} · {equipment.site} · {equipment.status === 'online' ? 'En ligne' : 'Hors ligne'}</span></div>
        <div className="admin-actions"><button className="filter-button" type="button" onClick={() => setEditing(true)}>Modifier</button><button className="danger-button" type="button" disabled={pending} onClick={onDelete}>Supprimer</button></div>
      </article>
    )
  }

  return (
    <form className="admin-record admin-record-form" onSubmit={(event) => {
      event.preventDefault()
      void onSave(form).then((saved) => { if (saved) setEditing(false) })
    }}>
      <label className="form-field">Nom<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label className="form-field">Type<input required maxLength={80} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /></label>
      <label className="form-field">Site<input required maxLength={120} value={form.site} onChange={(event) => setForm({ ...form, site: event.target.value })} /></label>
      <label className="form-field">Statut<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Equipment['status'] })}><option value="online">En ligne</option><option value="offline">Hors ligne</option></select></label>
      <div className="admin-actions"><button className="primary-button" type="submit" disabled={pending}>{pending ? '…' : 'Enregistrer'}</button><button className="filter-button" type="button" onClick={() => setEditing(false)}>Annuler</button></div>
    </form>
  )
}

function IncidentEditor({ incident, equipments, pending, onSave, onDelete }: {
  incident: Incident
  equipments: Equipment[]
  pending: boolean
  onSave: (incident: Omit<Incident, 'id'>) => Promise<boolean>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Omit<Incident, 'id'>>({
    title: incident.title, severity: incident.severity, status: incident.status, equipmentId: incident.equipmentId,
  })

  if (!editing) {
    return (
      <article className="admin-record">
        <div><strong>{incident.title}</strong><span>Incident #{incident.id} · {equipments.find((item) => item.id === incident.equipmentId)?.name ?? `Équipement #${incident.equipmentId}`} · {incident.status}</span></div>
        <div className="admin-actions"><button className="filter-button" type="button" onClick={() => setEditing(true)}>Modifier</button><button className="danger-button" type="button" disabled={pending} onClick={onDelete}>Supprimer</button></div>
      </article>
    )
  }

  return (
    <form className="admin-record admin-record-form" onSubmit={(event) => {
      event.preventDefault()
      void onSave(form).then((saved) => { if (saved) setEditing(false) })
    }}>
      <label className="form-field">Titre<input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label className="form-field">Équipement<select required value={form.equipmentId} onChange={(event) => setForm({ ...form, equipmentId: Number(event.target.value) })}>{equipments.map((equipment) => <option key={equipment.id} value={equipment.id}>{equipment.name}</option>)}</select></label>
      <label className="form-field">Sévérité<select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value as Incident['severity'] })}><option value="high">Élevée</option><option value="medium">Moyenne</option><option value="low">Faible</option></select></label>
      <label className="form-field">Statut<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Incident['status'] })}><option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="resolved">Résolu</option></select></label>
      <div className="admin-actions"><button className="primary-button" type="submit" disabled={pending || equipments.length === 0}>{pending ? '…' : 'Enregistrer'}</button><button className="filter-button" type="button" onClick={() => setEditing(false)}>Annuler</button></div>
    </form>
  )
}
