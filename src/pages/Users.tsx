import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { matchesSearch, useSearch } from '../contexts/SearchContext'
import { useApiData } from '../hooks/useApiData'
import { getUsers } from '../services/userService'
import { RoleLabel } from './Dashboard'

export default function Users() {
  const { data, loading, error, reload } = useApiData(getUsers)
  const { query } = useSearch()
  const filteredUsers = data?.filter((user) => matchesSearch(
    query, user.name, user.email, RoleLabel({ role: user.role }), user.id,
  ))

  return (
    <>
      <PageHeading eyebrow="ÉQUIPE" title="Utilisateurs" description="Utilisateurs déclarés dans l’espace NexusOps." />
      <section className="panel listing-panel">
        <div className="panel-heading"><div><h2>Annuaire</h2><p>Comptes associés à la supervision{filteredUsers ? ` · ${filteredUsers.length} résultat(s)` : ''}</p></div></div>
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {filteredUsers && (filteredUsers.length === 0
          ? <EmptyState message={query ? 'Aucun utilisateur ne correspond à cette recherche.' : 'Aucun utilisateur enregistré dans l’API.'} />
          : <div className="table-scroll"><table><thead><tr><th>NOM</th><th>EMAIL</th><th>RÔLE</th></tr></thead>
              <tbody>{filteredUsers.map((user) => (
                <tr key={user.id}><td className="table-primary">{user.name}</td><td><a className="email-link" href={`mailto:${user.email}`}>{user.email}</a></td><td><RoleLabel role={user.role} /></td></tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
