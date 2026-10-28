import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui'

export default function Login() {
  const { user, loading, initializationError, login, register } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <main className="login-page"><p className="request-state" role="status">Vérification de la session…</p></main>
  }
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (isRegistering) {
        await register(name, email, password)
      } else {
        await login(email, password)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La connexion a échoué.')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleMode() {
    setIsRegistering((current) => !current)
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark"><Icon name="box" /></span>
          <span>Nexus<span className="brand-light">Ops</span></span>
        </div>
        <div className="login-heading">
          <div className="eyebrow">ESPACE DE SUPERVISION</div>
          <h1 id="login-title">{isRegistering ? 'Créer un compte' : 'Bon retour'}</h1>
          <p>{isRegistering ? 'Inscrivez-vous pour accéder à votre espace NexusOps.' : 'Connectez-vous pour accéder à votre espace NexusOps.'}</p>
        </div>
        {initializationError && <p className="form-message error-message" role="alert">{initializationError}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label className="form-field">Nom complet
              <input
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Votre nom"
              />
            </label>
          )}
          <label className="form-field">Adresse e-mail
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.fr"
            />
          </label>
          <label className="form-field">Mot de passe
            <input
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegistering ? '8 caractères minimum' : 'Votre mot de passe'}
            />
          </label>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          <button className="primary-button login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Patientez…' : isRegistering ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegistering ? 'Vous avez déjà un compte ?' : 'Vous n’avez pas de compte ?'}
          {' '}<button type="button" onClick={toggleMode}>{isRegistering ? 'Se connecter' : 'Créer un compte'}</button>
        </p>
      </section>
    </main>
  )
}
