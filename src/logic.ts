import {
  DAYS,
  RETIRED,
  WEEKS,
  dayById,
  rirTarget,
  setsInDay,
  type Block,
  type DayId,
  type Exercise,
  type Rest,
} from './plan'
import { getSession, setKey, type AppData, type SetLog } from './store'

export const isLogged = (s?: SetLog | null): s is SetLog => !!s && s.reps != null

/** e1RM wg wzoru z arkusza: kg × (1 + (powt. + RIR) / 30) */
export function e1rm(s?: SetLog | null): number | null {
  if (!s || s.kg == null || s.reps == null || s.rir == null) return null
  return Math.round(s.kg * (1 + (s.reps + s.rir) / 30) * 10) / 10
}

export function sessionStats(data: AppData, week: number, day: DayId) {
  const d = dayById(day)
  const total = setsInDay(d)
  const sess = getSession(data, week, day)
  // liczymy tylko serie ćwiczeń z bieżącego planu – zapisy ćwiczeń usuniętych z planu (RETIRED) zostają w danych,
  // ale nie zawyżają realizacji
  let done = 0
  if (sess)
    for (const b of d.blocks)
      for (const e of b.exercises) for (let i = 0; i < e.sets; i++) if (isLogged(sess.sets[setKey(e.id, i)])) done++
  return { done, total, date: sess?.date }
}

export function weekStats(data: AppData, week: number) {
  let done = 0
  let total = 0
  for (const d of DAYS) {
    const s = sessionStats(data, week, d.id)
    done += s.done
    total += s.total
  }
  return { done, total }
}

/** Następny trening do zrobienia: ostatnia rozpoczęta sesja, jeśli trwa dziś, w przeciwnym razie kolejna. */
export function nextSession(data: AppData, today: string): { week: number; day: DayId } {
  const order: { week: number; day: DayId }[] = []
  for (let w = 1; w <= WEEKS; w++) for (const d of DAYS) order.push({ week: w, day: d.id })
  let lastIdx = -1
  order.forEach((o, i) => {
    if (sessionStats(data, o.week, o.day).done > 0) lastIdx = i
  })
  if (lastIdx === -1) return order[0]
  const last = order[lastIdx]
  const st = sessionStats(data, last.week, last.day)
  if (st.date === today && st.done < st.total) return last
  return order[Math.min(lastIdx + 1, order.length - 1)]
}

/** Wynik tej samej serii z ostatniego wcześniejszego tygodnia, w którym ją zapisano. */
export function previousSet(data: AppData, week: number, day: DayId, exId: string, i: number) {
  for (let w = week - 1; w >= 1; w--) {
    const s = getSession(data, w, day)?.sets[setKey(exId, i)]
    if (isLogged(s)) return { week: w, set: s }
  }
  return null
}

export type Suggestion = 'up' | 'hold' | null

/**
 * Reguła progresji z arkusza: gdy w ostatnim zapisanym tygodniu wszystkie serie
 * osiągnęły górny zakres powtórzeń przy celu RIR – zwiększ ciężar.
 */
export function progression(data: AppData, week: number, day: DayId, e: Exercise): { kind: Suggestion; fromWeek?: number } {
  for (let w = week - 1; w >= 1; w--) {
    const sess = getSession(data, w, day)
    const sets = Array.from({ length: e.sets }, (_, i) => sess?.sets[setKey(e.id, i)])
    if (!sets.some(isLogged)) continue
    if (!sets.every(isLogged)) return { kind: null, fromWeek: w }
    const [rirMin] = rirTarget(e, w)
    const top = sets.every((s) => s!.reps! >= e.reps[1] && (s!.rir == null || s!.rir >= rirMin))
    return { kind: top ? 'up' : 'hold', fromWeek: w }
  }
  return { kind: null }
}

export interface RestStep {
  rest: Rest | null
  /** dokąd prowadzi przerwa, np. "B2", "runda 2", "blok C" */
  next: string
}

export function restAfter(block: Block, nextBlock: Block | undefined, exIdx: number, round: number): RestStep {
  const solo = block.exercises.length === 1
  const sets = block.exercises[0].sets
  const end = (): RestStep =>
    nextBlock && block.transition
      ? { rest: block.transition, next: `blok ${nextBlock.letter}` }
      : { rest: null, next: 'koniec sesji' }
  if (solo) {
    if (round < sets - 1) return { rest: block.rest, next: `seria ${round + 2}` }
    return end()
  }
  if (exIdx < block.exercises.length - 1)
    return { rest: block.between ?? block.rest, next: block.exercises[exIdx + 1].code }
  if (round < sets - 1) return { rest: block.rest, next: `runda ${round + 2}` }
  return end()
}

export function fmtTime(sec: number) {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const fmtNum = (n: number | null | undefined) =>
  n == null ? '' : Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',')

export const fmtSet = (s: SetLog) =>
  `${s.kg != null ? fmtNum(s.kg) : '—'}×${s.reps ?? '—'}${s.rir != null ? ` @${s.rir}` : ''}`

export function fmtDate(iso?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', opts)
}

/** Najlepsze wartości ćwiczenia w danym tygodniu */
export function bestOfWeek(data: AppData, week: number, day: DayId, e: Exercise) {
  const sess = getSession(data, week, day)
  let maxKg: number | null = null
  let best1rm: number | null = null
  let volume = 0
  let logged = 0
  for (let i = 0; i < e.sets; i++) {
    const s = sess?.sets[setKey(e.id, i)]
    if (!isLogged(s)) continue
    logged++
    if (s.kg != null) maxKg = Math.max(maxKg ?? 0, s.kg)
    const r = e1rm(s)
    if (r != null) best1rm = Math.max(best1rm ?? 0, r)
    volume += (s.kg ?? 0) * (s.reps ?? 0)
  }
  return { maxKg, best1rm, volume, logged }
}

export function toCSV(data: AppData): string {
  const rows = [['tydzien', 'dzien', 'data', 'blok', 'kod', 'cwiczenie', 'seria', 'kg', 'powtorzenia', 'rir', 'e1rm', 'uwagi_sesji']]
  for (let w = 1; w <= WEEKS; w++)
    for (const d of DAYS) {
      const sess = getSession(data, w, d.id)
      if (!sess) continue
      // bieżący plan + archiwalne ćwiczenia (usunięte z planu), żeby eksport zawierał pełną historię
      const entries = [
        ...d.blocks.flatMap((b) => b.exercises.map((e) => ({ block: b.letter, e, retired: false }))),
        ...RETIRED.filter((e) => e.day === d.id).map((e) => ({ block: e.code[0], e, retired: true })),
      ]
      for (const { block, e, retired } of entries)
        for (let i = 0; i < e.sets; i++) {
          const s = sess.sets[setKey(e.id, i)]
          if (!isLogged(s)) continue
          rows.push([
            String(w),
            d.weekday,
            sess.date ?? '',
            block,
            e.code,
            retired ? `${e.name} (archiwalne)` : e.name,
            String(i + 1),
            s.kg == null ? '' : String(s.kg),
            String(s.reps),
            s.rir == null ? '' : String(s.rir),
            String(e1rm(s) ?? ''),
            sess.notes ?? '',
          ])
        }
    }
  return rows.map((r) => r.map((c) => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(';')).join('\n')
}
