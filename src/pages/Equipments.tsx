import { EquipmentStatus } from './Dashboard'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { getEquipments } from '../services/equipmentService'
import { matchesSearch, useSearch } from '../contexts/SearchContext'

export default function Equipments() {
  const { data, loading, error, reload } = useApiData(getEquipments)
  const { query } = useSearch()
  const filtered = data?.filter((equipment) => matchesSearch(
    query,
    equipment.name,
    equipment.type,
    equipment.site,
    equipment.status === 'online' ? 'En ligne' : 'Hors ligne',
    equipment.id,
  ))

  return (
    <>
      <PageHeading eyebrow="SUPERVISION" title="Équipements" description="Consultez les équipements et leur état de connexion." />
      <section className="panel listing-panel">
        <div className="panel-heading"><div><h2>Parc numérique</h2><p>Équipements par site</p></div></div>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {filtered && (filtered.length === 0
          ? <EmptyState message={query ? 'Aucun équipement ne correspond à cette recherche.' : 'Aucun équipement enregistré dans l’API.'} />
          : <div className="table-scroll"><table><thead><tr><th>NOM</th><th>TYPE</th><th>SITE</th><th>STATUT</th></tr></thead>
              <tbody>{filtered.map((equipment) => (
                <tr key={equipment.id}><td className="table-primary">{equipment.name}</td><td>{equipment.type}</td><td>{equipment.site}</td><td><EquipmentStatus status={equipment.status} /></td></tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
