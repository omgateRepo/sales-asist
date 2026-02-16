// Blueprint uses sales-asist-api; same URL here so no env var needed
const DEFAULT_API_URL = 'https://sales-asist-api.onrender.com'
export const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL

const baseUrl = (API_BASE || '').replace(/\/$/, '')
const AUTH_STORAGE_KEY = 'app-basic-auth'
let cachedCredentials = null
let authLoaded = false
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

function ensureAuthLoaded() {
  if (authLoaded || !isBrowser) return
  authLoaded = true
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.username && parsed?.password) {
      cachedCredentials = { username: parsed.username, password: parsed.password }
    }
  } catch {
    cachedCredentials = null
  }
}

function getAuthHeader() {
  ensureAuthLoaded()
  if (!cachedCredentials?.username || !cachedCredentials?.password) return null
  const token = btoa(`${cachedCredentials.username}:${cachedCredentials.password}`)
  return `Basic ${token}`
}

function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const authHeader = getAuthHeader()
  if (authHeader) headers.set('Authorization', authHeader)
  return fetch(`${baseUrl}${path}`, { ...options, headers })
}

const API_URL_HELP =
  'Set VITE_API_BASE_URL on the frontend service to your API URL (e.g. https://sales-asist-api.onrender.com) and redeploy the frontend.'

async function handleJsonResponse(res, errorMessage) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    throw new Error(`Got HTML instead of API response. ${API_URL_HELP}`)
  }
  if (res.status === 401) throw new Error('Authentication required')
  if (!res.ok) {
    let details = {}
    try {
      details = await res.json()
    } catch {
      void 0
    }
    throw new Error(details?.error || errorMessage)
  }
  if (res.status === 204) return null
  return res.json()
}

export function getAuthCredentials() {
  ensureAuthLoaded()
  return cachedCredentials
}

export function setAuthCredentials(credentials) {
  cachedCredentials = credentials
  if (isBrowser) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials))
  }
}

export function clearAuthCredentials() {
  cachedCredentials = null
  if (isBrowser) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export async function fetchCurrentUser() {
  const res = await request('/api/me')
  return handleJsonResponse(res, 'Failed to fetch user')
}
