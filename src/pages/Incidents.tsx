import { useState, type FormEvent } from 'react'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { getEquipments } from '../services/equipmentService'
import { createIncident, getIncidents } from '../services/incidentService'
import type { IncidentSeverity } from '../types'
import { IncidentSeverityBadge, IncidentStatusBadge } from './Dashboard'

export default function Incidents() {
  const { data, loading, error, reload } = useApiData(getIncidents)
  const equipmentState = useApiData(getEquipments)
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [equipmentId, setEquipmentId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!equipmentId) {
      setFormError('Sélectionnez un équipement avant de créer l’incident.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await createIncident({ title: title.trim(), severity, status: 'open', equipmentId: Number(equipmentId) })
      setTitle('')
      setSeverity('medium')
      setEquipmentId('')
      reload()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Impossible de créer l’incident.')
    } finally {
      setSubmitting(false)
    }
  }

  const equipmentNames = new Map(equipmentState.data?.map((equipment) => [equipment.id, equipment.name]))

  return (
    <>
      <PageHeading eyebrow="SUPPORT" title="Incidents" description="Consultez les incidents et signalez un nouveau problème." />
      <section className="panel incident-form-panel">
        <div className="panel-heading"><div><h2>Signaler un incident</h2><p>Les champs marqués d’un astérisque sont obligatoires.</p></div></div>
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
          {equipmentState.error && <p className="form-message error-message" role="alert">{equipmentState.error}</p>}
          {formError && <p className="form-message error-message" role="alert">{formError}</p>}
          <button className="primary-button" type="submit" disabled={submitting || equipmentState.loading || !equipmentState.data?.length}>
            {submitting ? 'Envoi…' : 'Créer l’incident'}
          </button>
        </form>
      </section>
      <section className="panel listing-panel incident-listing-panel">
        <div className="panel-heading"><div><h2>Incidents signalés</h2><p>Incidents reçus par NexusOps</p></div></div>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (data.length === 0
          ? <EmptyState message="Aucun incident enregistré dans l’API." />
          : <div className="table-scroll"><table><thead><tr><th>TITRE</th><th>ÉQUIPEMENT</th><th>SÉVÉRITÉ</th><th>STATUT</th></tr></thead>
              <tbody>{data.map((incident) => (
                <tr key={incident.id}>
                  <td><span className="table-primary">{incident.title}</span><span className="table-secondary">Incident #{incident.id}</span></td>
                  <td>{equipmentNames.get(incident.equipmentId) ?? `Équipement #${incident.equipmentId}`}</td>
                  <td><IncidentSeverityBadge severity={incident.severity} /></td>
                  <td><IncidentStatusBadge status={incident.status} /></td>
                </tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
