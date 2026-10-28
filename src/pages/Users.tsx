import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { getUsers } from '../services/userService'
import { RoleLabel } from './Dashboard'
import { matchesSearch, useSearch } from '../contexts/SearchContext'

export default function Users() {
  const { data, loading, error, reload } = useApiData(getUsers)
  const { query } = useSearch()
  const filtered = data?.filter((user) => matchesSearch(query, user.name, user.email, RoleLabel({ role: user.role }), user.id))

  return (
    <>
      <PageHeading eyebrow="ÉQUIPE" title="Utilisateurs" description="Utilisateurs déclarés dans l’espace NexusOps." />
      <section className="panel listing-panel">
        <div className="panel-heading"><div><h2>Annuaire</h2><p>Comptes associés à la supervision</p></div></div>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {filtered && (filtered.length === 0
          ? <EmptyState message={query ? 'Aucun utilisateur ne correspond à cette recherche.' : 'Aucun utilisateur enregistré dans l’API.'} />
          : <div className="table-scroll"><table><thead><tr><th>NOM</th><th>EMAIL</th><th>RÔLE</th></tr></thead>
              <tbody>{filtered.map((user) => (
                <tr key={user.id}><td className="table-primary">{user.name}</td><td><a className="email-link" href={`mailto:${user.email}`}>{user.email}</a></td><td><RoleLabel role={user.role} /></td></tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
