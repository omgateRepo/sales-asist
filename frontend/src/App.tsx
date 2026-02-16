import { useEffect, useState } from 'react'
import './App.css'
import {
  API_BASE,
  clearAuthCredentials,
  fetchCurrentUser,
  fetchPlatformTenants,
  getAuthCredentials,
  setAuthCredentials,
  signupCompany,
  updateTenantStatus,
} from './api'
import { APP_VERSION } from './version'

type User = {
  displayName: string
  role?: string
  tenantId?: string | null
  tenantStatus?: string | null
}

type Tenant = { id: string; name: string; status: string; created_at: string }

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupMessage, setSignupMessage] = useState<string | null>(null)
  const [signupLoading, setSignupLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantLoading, setTenantLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const creds = getAuthCredentials()
      if (!creds) {
        setLoading(false)
        return
      }
      try {
        const me = await fetchCurrentUser()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (user?.role !== 'platform_admin') return
    let cancelled = false
    setTenantLoading(true)
    fetchPlatformTenants()
      .then((list) => { if (!cancelled) setTenants(list) })
      .catch(() => { if (!cancelled) setTenants([]) })
      .finally(() => { if (!cancelled) setTenantLoading(false) })
    return () => { cancelled = true }
  }, [user?.role])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    setLoginError(null)
    if (!username || !password) {
      setLoginError('Username and password are required')
      return
    }
    setAuthCredentials({ username, password })
    try {
      const me = await fetchCurrentUser()
      setUser(me)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
      setUser(null)
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const companyName = (form.elements.namedItem('companyName') as HTMLInputElement).value.trim()
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const displayName = (form.elements.namedItem('displayName') as HTMLInputElement).value.trim()
    setLoginError(null)
    setSignupMessage(null)
    if (!companyName || !email || !password) {
      setLoginError('Company name, email, and password are required')
      return
    }
    setSignupLoading(true)
    try {
      await signupCompany({ companyName, email, password, displayName: displayName || email })
      setSignupMessage('Company created. Pending platform approval. You can log in after approval.')
      setAuthView('login')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setSignupLoading(false)
    }
  }

  async function handleApprove(tenantId: string) {
    try {
      await updateTenantStatus(tenantId, 'active')
      setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status: 'active' } : t)))
    } catch {
      // could set error state
    }
  }

  function handleLogout() {
    clearAuthCredentials()
    setUser(null)
  }

  if (loading) return <div className="app">Loading…</div>

  return (
    <div className="app">
      <h1>SalesAsist</h1>
      <p className="app-version">Version {APP_VERSION}</p>
      <p className="app-api">API: {API_BASE || '(same origin)'}</p>
      {user ? (
        <div className="app-authenticated">
          <p>Hello, {user.displayName}</p>
          {user.role === 'platform_admin' && (
            <section className="app-platform">
              <h2>Platform — Tenants</h2>
              {tenantLoading ? (
                <p>Loading tenants…</p>
              ) : (
                <ul>
                  {tenants.map((t) => (
                    <li key={t.id}>
                      <strong>{t.name}</strong> — {t.status}
                      {t.status === 'pending' && (
                        <button type="button" onClick={() => handleApprove(t.id)}>Approve</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {user.role === 'company_admin' && (
            <section className="app-company">
              {user.tenantStatus === 'pending' ? (
                <p className="app-pending">Your company is pending approval. Contact the platform administrator.</p>
              ) : (
                <p>Dashboard — ServiceTitan connection coming next.</p>
              )}
            </section>
          )}
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      ) : (
        <>
          {authView === 'login' ? (
            <>
              <form className="app-login" onSubmit={handleLogin}>
                <label htmlFor="username">Username</label>
                <input id="username" name="username" type="text" autoComplete="username" required />
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required />
                {loginError && <p className="app-login-error">{loginError}</p>}
                {signupMessage && <p className="app-login-success">{signupMessage}</p>}
                <button type="submit">Log in</button>
              </form>
              <p>
                <button type="button" className="app-link" onClick={() => { setAuthView('signup'); setLoginError(null); setSignupMessage(null); }}>
                  Sign up (new company)
                </button>
              </p>
              <p className="app-login-hint">Platform admin: admin / Password1</p>
            </>
          ) : (
            <>
              <form className="app-login" onSubmit={handleSignup}>
                <h2>Company signup</h2>
                {signupLoading && (
                  <div className="app-loading" aria-live="polite">
                    <span className="app-spinner" />
                    <span>Signing up…</span>
                  </div>
                )}
                <label htmlFor="companyName">Company name</label>
                <input id="companyName" name="companyName" type="text" required disabled={signupLoading} />
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required disabled={signupLoading} />
                <label htmlFor="signup-password">Password</label>
                <input id="signup-password" name="password" type="password" autoComplete="new-password" required disabled={signupLoading} />
                <label htmlFor="displayName">Display name (optional)</label>
                <input id="displayName" name="displayName" type="text" disabled={signupLoading} />
                {loginError && <p className="app-login-error">{loginError}</p>}
                <button type="submit" disabled={signupLoading}>Sign up</button>
              </form>
              <p>
                <button type="button" className="app-link" onClick={() => { setAuthView('login'); setLoginError(null); setSignupMessage(null); }} disabled={signupLoading}>
                  Back to log in
                </button>
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
