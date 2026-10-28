import { useState, type FormEvent } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { matchesSearch, useSearch } from '../contexts/SearchContext'
import { useApiData } from '../hooks/useApiData'
import { getEquipments } from '../services/equipmentService'
import { createIncident, deleteIncident, getIncidents, updateIncident } from '../services/incidentService'
import type { Incident, IncidentSeverity, IncidentStatus } from '../types'
import { IncidentSeverityBadge, IncidentStatusBadge } from './Dashboard'

export default function Incidents() {
  const { data, loading, error, reload } = useApiData(getIncidents)
  const equipmentState = useApiData(getEquipments)
  const { query } = useSearch()
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [equipmentId, setEquipmentId] = useState('')
  const [status, setStatus] = useState<IncidentStatus>('open')
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const equipmentNames = new Map(equipmentState.data?.map((equipment) => [equipment.id, equipment.name]))

  const filteredIncidents = data?.filter((incident) => matchesSearch(
    query,
    incident.title,
    incident.id,
    equipmentNames.get(incident.equipmentId),
    incident.severity === 'high' ? 'Élevée' : incident.severity === 'medium' ? 'Moyenne' : 'Faible',
    incident.status === 'open' ? 'Ouvert' : incident.status === 'in_progress' ? 'En cours' : 'Résolu',
    incident.equipmentId,
  )) ?? []

  function resetForm() {
    setTitle('')
    setSeverity('medium')
    setEquipmentId('')
    setStatus('open')
    setEditingIncident(null)
    setFormError(null)
  }

  function startEditing(incident: Incident) {
    setEditingIncident(incident)
    setTitle(incident.title)
    setSeverity(incident.severity)
    setEquipmentId(String(incident.equipmentId))
    setStatus(incident.status)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!equipmentId) {
      setFormError('Sélectionnez un équipement avant de créer l’incident.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const incident = {
        title: title.trim(),
        severity,
        status: editingIncident ? status : 'open',
        equipmentId: Number(equipmentId),
      }
      if (editingIncident) await updateIncident(editingIncident.id, incident)
      else await createIncident(incident)
      resetForm()
      reload()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer cet incident.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(incident: Incident) {
    if (!window.confirm(`Supprimer l’incident « ${incident.title} » ?`)) return
    setDeletingId(incident.id)
    setActionError(null)
    try {
      await deleteIncident(incident.id)
      if (editingIncident?.id === incident.id) resetForm()
      reload()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Impossible de supprimer cet incident.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeading eyebrow="SUPPORT" title="Incidents" description="Consultez les incidents et signalez un nouveau problème." />
      <section className="panel incident-form-panel">
        <div className="panel-heading"><div><h2>{editingIncident ? 'Modifier un incident' : 'Signaler un incident'}</h2><p>Les champs marqués d’un astérisque sont obligatoires.</p></div></div>
        <form className="incident-form" onSubmit={handleSubmit}>
          <label className="form-field form-title">Titre de l’incident *
            <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Décrivez le problème" />
          </label>
          <label className="form-field">Sévérité *
            <select required value={severity} onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </label>
          <label className="form-field">Équipement concerné *
            <select required value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)} disabled={equipmentState.loading || !equipmentState.data?.length}>
              <option value="">{equipmentState.loading ? 'Chargement…' : 'Choisir un équipement'}</option>
              {equipmentState.data?.map((equipment) => <option key={equipment.id} value={equipment.id}>{equipment.name} — {equipment.site}</option>)}
            </select>
          </label>
          {editingIncident && (
            <label className="form-field">Statut *
              <select required value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus)}>
                <option value="open">Ouvert</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolu</option>
              </select>
            </label>
          )}
          {equipmentState.error && <p className="form-message error-message" role="alert">{equipmentState.error}</p>}
          {formError && <p className="form-message error-message" role="alert">{formError}</p>}
          <button className="primary-button" type="submit" disabled={submitting || equipmentState.loading || !equipmentState.data?.length}>
            {submitting ? 'Enregistrement…' : editingIncident ? 'Enregistrer les modifications' : 'Créer l’incident'}
          </button>
          {editingIncident && <button className="filter-button" type="button" onClick={resetForm}>Annuler</button>}
        </form>
      </section>
      <section className="panel listing-panel incident-listing-panel">
        <div className="panel-heading"><div><h2>Incidents signalés</h2><p>Incidents reçus par NexusOps · {filteredIncidents.length} résultat(s)</p></div></div>
        {actionError && <p className="form-message error-message" role="alert">{actionError}</p>}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (filteredIncidents.length === 0
          ? <EmptyState message={query ? 'Aucun incident ne correspond à la recherche.' : 'Aucun incident enregistré dans l’API.'} />
          : <div className="table-scroll"><table><thead><tr><th>TITRE</th><th>ÉQUIPEMENT</th><th>SÉVÉRITÉ</th><th>STATUT</th><th>ACTIONS</th></tr></thead>
              <tbody>{filteredIncidents.map((incident) => (
                <tr key={incident.id}>
                  <td><span className="table-primary">{incident.title}</span><span className="table-secondary">Incident #{incident.id}</span></td>
                  <td>{equipmentNames.get(incident.equipmentId) ?? `Équipement #${incident.equipmentId}`}</td>
                  <td><IncidentSeverityBadge severity={incident.severity} /></td>
                  <td><IncidentStatusBadge status={incident.status} /></td>
                  <td className="row-actions">
                    <button className="table-action" type="button" onClick={() => startEditing(incident)}>Modifier</button>
                    <button className="table-action danger-action" type="button" disabled={deletingId === incident.id} onClick={() => void handleDelete(incident)}>{deletingId === incident.id ? 'Suppression…' : 'Supprimer'}</button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
