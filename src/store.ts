import { useSyncExternalStore } from 'react'
import type { DayId } from './plan'

export interface SetLog {
  kg: number | null
  reps: number | null
  rir: number | null
  /** znacznik czasu ostatniej zmiany – do scalania przy synchronizacji */
  t: number
}

export interface SessionLog {
  date?: string
  notes?: string
  /** klucz: `${exerciseId}#${indexSerii}` */
  sets: Record<string, SetLog>
  /** znacznik czasu zmiany daty / uwag */
  t?: number
}

export interface AppData {
  v: 1
  weeks: Record<string, Partial<Record<DayId, SessionLog>>>
  updatedAt: number
}

const KEY = 'wodyn-picp-v1'

export const emptyData = (): AppData => ({ v: 1, weeks: {}, updatedAt: 0 })

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.v === 1 && typeof parsed.weeks === 'object') return parsed
    }
  } catch {
    /* brak dostępu do storage – startujemy od zera */
  }
  return emptyData()
}

let state: AppData = load()
const listeners = new Set<() => void>()
const changeListeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* np. tryb prywatny */
  }
}

export const store = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  /** nasłuch na zmiany wprowadzone przez użytkownika (do synchronizacji) */
  onLocalChange(fn: () => void) {
    changeListeners.add(fn)
    return () => changeListeners.delete(fn)
  },
  replace(next: AppData, { local = false } = {}) {
    state = next
    persist()
    listeners.forEach((l) => l())
    if (local) changeListeners.forEach((l) => l())
  },
  update(fn: (draft: AppData) => void) {
    const next: AppData = structuredClone(state)
    fn(next)
    next.updatedAt = Date.now()
    store.replace(next, { local: true })
  },
}

export function useData(): AppData {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

export const setKey = (exId: string, i: number) => `${exId}#${i}`

export function getSession(data: AppData, week: number, day: DayId): SessionLog | undefined {
  return data.weeks[week]?.[day]
}

function ensureSession(d: AppData, week: number, day: DayId): SessionLog {
  const w = (d.weeks[week] ??= {})
  return (w[day] ??= { sets: {} })
}

export const todayISO = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function updateSet(week: number, day: DayId, key: string, patch: Partial<Omit<SetLog, 't'>>) {
  store.update((d) => {
    const s = ensureSession(d, week, day)
    const prev = s.sets[key] ?? { kg: null, reps: null, rir: null, t: 0 }
    s.sets[key] = { ...prev, ...patch, t: Date.now() }
    // pierwsza zapisana seria ustawia datę treningu
    if (!s.date && s.sets[key].reps != null) {
      s.date = todayISO()
      s.t = Date.now()
    }
  })
}

export function updateSessionMeta(week: number, day: DayId, patch: { date?: string; notes?: string }) {
  store.update((d) => {
    const s = ensureSession(d, week, day)
    Object.assign(s, patch)
    s.t = Date.now()
  })
}

/**
 * Scalanie dwóch wersji danych (lokalna + z chmury).
 * Każda seria i metadane sesji mają własny znacznik czasu – wygrywa nowsza zmiana.
 */
export function mergeData(a: AppData, b: AppData): AppData {
  const out: AppData = { v: 1, weeks: {}, updatedAt: Math.max(a.updatedAt, b.updatedAt) }
  const weeks = new Set([...Object.keys(a.weeks), ...Object.keys(b.weeks)])
  for (const w of weeks) {
    const wa = a.weeks[w] ?? {}
    const wb = b.weeks[w] ?? {}
    const days = new Set([...Object.keys(wa), ...Object.keys(wb)]) as Set<DayId>
    out.weeks[w] = {}
    for (const day of days) {
      const sa = wa[day]
      const sb = wb[day]
      if (!sa || !sb) {
        out.weeks[w][day] = structuredClone((sa ?? sb)!)
        continue
      }
      const meta = (sa.t ?? 0) >= (sb.t ?? 0) ? sa : sb
      const sets: Record<string, SetLog> = {}
      for (const k of new Set([...Object.keys(sa.sets), ...Object.keys(sb.sets)])) {
        const x = sa.sets[k]
        const y = sb.sets[k]
        sets[k] = { ...(!x ? y : !y ? x : x.t >= y.t ? x : y)! }
      }
      out.weeks[w][day] = { date: meta.date, notes: meta.notes, t: meta.t, sets }
    }
  }
  return out
}

export function isValidData(x: unknown): x is AppData {
  return !!x && typeof x === 'object' && (x as AppData).v === 1 && typeof (x as AppData).weeks === 'object'
}
