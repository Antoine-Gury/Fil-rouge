import { useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import { createUser, deleteUser, getUsers, updateUser } from '../services/userService'
import type { NewUser, User, UserRole } from '../types'
import { RoleLabel } from './Dashboard'

const emptyUser: NewUser = { name: '', email: '', role: 'viewer' }

export default function Users() {
  const { data, loading, error, reload } = useApiData(getUsers)
  const searchQuery = useOutletContext<string>()
  const [form, setForm] = useState<NewUser>(emptyUser)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filteredUsers = (data ?? []).filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLocaleLowerCase()
      .includes(searchQuery.trim().toLocaleLowerCase()),
  )

  function openCreateForm() {
    setEditingUser(null)
    setForm(emptyUser)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(user: User) {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, role: user.role })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const user = { ...form, name: form.name.trim(), email: form.email.trim() }
      if (editingUser) {
        await updateUser(editingUser.id, user)
      } else {
        await createUser(user)
      }
      setFormOpen(false)
      setEditingUser(null)
      setForm(emptyUser)
      reload()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer cet utilisateur.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`Supprimer l’utilisateur « ${user.name} » ?`)) return
    setDeletingId(user.id)
    setActionError(null)
    try {
      await deleteUser(user.id)
      reload()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Impossible de supprimer cet utilisateur.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="ÉQUIPE"
        title="Utilisateurs"
        description="Consultez, ajoutez et modifiez les utilisateurs déclarés dans l’espace NexusOps."
        action={<button className="primary-button" type="button" onClick={openCreateForm}><span aria-hidden="true">+</span>Ajouter un utilisateur</button>}
      />
      {formOpen && (
        <section className="panel incident-form-panel" aria-labelledby="user-form-title">
          <div className="panel-heading">
            <div><h2 id="user-form-title">{editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}</h2><p>Renseignez les informations du compte.</p></div>
          </div>
          <form className="incident-form entity-form" onSubmit={handleSubmit}>
            <label className="form-field">Nom *
              <input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="form-field">E-mail *
              <input required type="email" maxLength={160} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="form-field">Rôle *
              <select required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
                <option value="admin">Administrateur</option>
                <option value="operator">Opérateur</option>
                <option value="viewer">Observateur</option>
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
      <section className="panel listing-panel">
        <div className="panel-heading"><div><h2>Annuaire</h2><p>Comptes associés à la supervision · {filteredUsers.length} résultat(s)</p></div></div>
        {actionError && <p className="form-message error-message" role="alert">{actionError}</p>}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (filteredUsers.length === 0
          ? <EmptyState message={searchQuery ? 'Aucun utilisateur ne correspond à la recherche.' : 'Aucun utilisateur enregistré dans l’API.'} />
          : <div className="table-scroll"><table><thead><tr><th>NOM</th><th>EMAIL</th><th>RÔLE</th><th>ACTIONS</th></tr></thead>
              <tbody>{filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="table-primary">{user.name}</td>
                  <td><a className="email-link" href={`mailto:${user.email}`}>{user.email}</a></td>
                  <td><RoleLabel role={user.role} /></td>
                  <td className="row-actions">
                    <button className="table-action" type="button" onClick={() => openEditForm(user)}>Modifier</button>
                    <button className="table-action danger-action" type="button" disabled={deletingId === user.id} onClick={() => void handleDelete(user)}>{deletingId === user.id ? 'Suppression…' : 'Supprimer'}</button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>)}
      </section>
    </>
  )
}
