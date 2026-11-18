import { useSyncExternalStore } from 'react'
import { isValidData, mergeData, store, type AppData } from './store'

// Opcjonalna synchronizacja z chmurą (Vercel Function + Upstash Redis).
// Bez skonfigurowanego klucza aplikacja działa w 100% lokalnie.

const KEY_STORAGE = 'wodyn-sync-key'

export type SyncStatus =
  | { state: 'off' }
  | { state: 'syncing' }
  | { state: 'ok'; at: number }
  | { state: 'error'; message: string }

let status: SyncStatus = { state: getSyncKey() ? 'syncing' : 'off' }
const listeners = new Set<() => void>()
const setStatus = (s: SyncStatus) => {
  status = s
  listeners.forEach((l) => l())
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => status,
  )
}

export function getSyncKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function setSyncKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* ignore */
  }
  if (!key) setStatus({ state: 'off' })
  else void syncNow()
}

async function call(method: 'GET' | 'PUT', key: string, body?: AppData) {
  const res = await fetch('/api/sync', {
    method,
    headers: { 'x-sync-key': key, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) throw new Error('Nieprawidłowy klucz synchronizacji')
  if (res.status === 501) throw new Error('Synchronizacja nie jest skonfigurowana na serwerze')
  if (!res.ok) throw new Error(`Błąd serwera (${res.status})`)
  return res.json() as Promise<{ data: AppData | null }>
}

let running: Promise<void> | null = null
let again = false

export function syncNow(): Promise<void> {
  const key = getSyncKey()
  if (!key) return Promise.resolve()
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    setStatus({ state: 'syncing' })
    try {
      do {
        again = false
        const { data: remote } = await call('GET', key)
        const local = store.get()
        const merged = remote && isValidData(remote) ? mergeData(local, remote) : local
        if (JSON.stringify(merged.weeks) !== JSON.stringify(local.weeks)) store.replace(merged)
        if (!remote || JSON.stringify(merged.weeks) !== JSON.stringify(remote.weeks)) await call('PUT', key, merged)
      } while (again)
      setStatus({ state: 'ok', at: Date.now() })
    } catch (e) {
      setStatus({ state: 'error', message: navigator.onLine ? (e as Error).message : 'Brak połączenia – dane są zapisane lokalnie' })
    } finally {
      running = null
    }
  })()
  return running
}

let timer: number | undefined
export function initSync() {
  store.onLocalChange(() => {
    if (!getSyncKey()) return
    clearTimeout(timer)
    timer = window.setTimeout(() => void syncNow(), 1500)
  })
  const kick = () => document.visibilityState === 'visible' && void syncNow()
  document.addEventListener('visibilitychange', kick)
  window.addEventListener('online', kick)
  void syncNow()
}
