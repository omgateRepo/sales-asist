import { useEffect, useState } from 'react'
import './App.css'
import { API_BASE, clearAuthCredentials, fetchCurrentUser, getAuthCredentials, setAuthCredentials } from './api'
import { APP_VERSION } from './version'

export default function App() {
  const [user, setUser] = useState<{ displayName: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)

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

  function handleLogout() {
    clearAuthCredentials()
    setUser(null)
  }

  if (loading) return <div className="app">Loading…</div>

  return (
    <div className="app">
      <h1>App</h1>
      <p className="app-version">Version {APP_VERSION}</p>
      <p className="app-api">API: {API_BASE || '(same origin)'}</p>
      {user ? (
        <div className="app-authenticated">
          <p>Hello, {user.displayName}</p>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      ) : (
        <form className="app-login" onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          {loginError && <p className="app-login-error">{loginError}</p>}
          <button type="submit">Log in</button>
          <p className="app-login-hint">Default: admin / Password1</p>
        </form>
      )}
    </div>
  )
}
