import { useState, type FormEvent } from 'react'
import { EquipmentStatus } from './Dashboard'
import { EmptyState, ErrorState, LoadingState, MetricCard, PageHeading } from '../components/ui'
import { matchesSearch, useSearch } from '../contexts/SearchContext'
import { useApiData } from '../hooks/useApiData'
import { createEquipment, deleteEquipment, getEquipments, updateEquipment } from '../services/equipmentService'
import type { Equipment, EquipmentStatus as EquipmentStatusType, NewEquipment } from '../types'

const emptyEquipment: NewEquipment = { name: '', type: '', site: '', status: 'online' }

export default function Equipments() {
  const { data, loading, error, reload } = useApiData(getEquipments)
  const { query } = useSearch()
  const [form, setForm] = useState<NewEquipment>(emptyEquipment)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filteredEquipments = data?.filter((equipment) => matchesSearch(
    query, equipment.name, equipment.type, equipment.site,
    equipment.status === 'online' ? 'En ligne' : 'Hors ligne', equipment.id,
  )) ?? []

  function openCreateForm() {
    setEditingEquipment(null)
    setForm(emptyEquipment)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(equipment: Equipment) {
    setEditingEquipment(equipment)
    setForm({ name: equipment.name, type: equipment.type, site: equipment.site, status: equipment.status })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const equipment = { ...form, name: form.name.trim(), type: form.type.trim(), site: form.site.trim() }
      if (editingEquipment) await updateEquipment(editingEquipment.id, equipment)
      else await createEquipment(equipment)
      setFormOpen(false)
      setEditingEquipment(null)
      setForm(emptyEquipment)
      reload()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer cet équipement.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(equipment: Equipment) {
    if (!window.confirm(`Supprimer l’équipement « ${equipment.name} » ?`)) return
    setDeletingId(equipment.id)
    setActionError(null)
    try {
      await deleteEquipment(equipment.id)
      reload()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Impossible de supprimer cet équipement.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="SUPERVISION"
        title="Équipements"
        description="Vue en temps réel du parc numérique et de son état de connexion."
        action={<button className="primary-button" type="button" onClick={openCreateForm}><span aria-hidden="true">+</span>Ajouter un équipement</button>}
      />
      {data && (
        <section className="metrics-grid equipment-summary" aria-label="État du parc numérique">
          <MetricCard label="Équipements supervisés" value={data.length} icon="box" color="purple" />
          <MetricCard label="En ligne" value={data.filter((equipment) => equipment.status === 'online').length} icon="grid" color="green" />
          <MetricCard label="Hors ligne" value={data.filter((equipment) => equipment.status === 'offline').length} icon="alert" color="orange" />
        </section>
      )}
      {formOpen && (
        <section className="panel incident-form-panel" aria-labelledby="equipment-form-title">
          <div className="panel-heading">
            <div><h2 id="equipment-form-title">{editingEquipment ? 'Modifier un équipement' : 'Ajouter un équipement'}</h2><p>Renseignez les informations de l’équipement.</p></div>
          </div>
          <form className="incident-form entity-form" onSubmit={handleSubmit}>
            <label className="form-field">Nom *
              <input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="form-field">Type *
              <input required maxLength={80} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
            </label>
            <label className="form-field">Site *
              <input required maxLength={120} value={form.site} onChange={(event) => setForm({ ...form, site: event.target.value })} />
            </label>
            <label className="form-field">Statut *
              <select required value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EquipmentStatusType })}>
                <option value="online">En ligne</option>
                <option value="offline">Hors ligne</option>
              </select>
            </label>
            {formError && <p className="form-message error-message" role="alert">{formError}</p>}
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button className="filter-button" type="button" onClick={() => setFormOpen(false)}>Annuler</button>
            </div>
          </form>
        </section>
      )}
      <section className="panel listing-panel equipment-listing-panel">
        <div className="panel-heading"><div><h2>Parc numérique</h2><p>Équipements par site · {filteredEquipments.length} résultat(s)</p></div></div>
        {actionError && <p className="form-message error-message" role="alert">{actionError}</p>}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (filteredEquipments.length === 0
          ? <EmptyState message={query ? 'Aucun équipement ne correspond à la recherche.' : 'Aucun équipement enregistré dans l’API.'} />
          : <div className="table-scroll"><table className="equipment-table"><colgroup><col className="equipment-name-column" /><col className="equipment-type-column" /><col className="equipment-site-column" /><col className="equipment-status-column" /><col className="equipment-actions-column" /></colgroup><thead><tr><th>NOM</th><th>TYPE</th><th>SITE</th><th>STATUT</th><th>ACTIONS</th></tr></thead>
              <tbody>{filteredEquipments.map((equipment) => (
                <tr key={equipment.id}>
                  <td><span className="table-primary">{equipment.name}</span></td>
                  <td>{equipment.type}</td>
                  <td>{equipment.site}</td>
                  <td><EquipmentStatus status={equipment.status} /></td>
                  <td className="row-actions">
                    <button className="table-action" type="button" onClick={() => openEditForm(equipment)}>Modifier</button>
                    <button className="table-action danger-action" type="button" disabled={deletingId === equipment.id} onClick={() => void handleDelete(equipment)}>{deletingId === equipment.id ? 'Suppression…' : 'Supprimer'}</button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
