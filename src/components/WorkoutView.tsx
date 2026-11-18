import { useMemo, useRef, useState } from 'react'
import { DAYS, MODE_INFO, WEEKS, WEEK_INFO, dayById, fmtRange, rirTarget, type Block, type DayId, type Exercise } from '../plan'
import { getSession, setKey, updateSessionMeta, updateSet, useData, type AppData, type SetLog } from '../store'
import { bestOfWeek, e1rm, fmtNum, fmtSet, isLogged, previousSet, progression, restAfter, sessionStats, weekStats } from '../logic'
import { restTimer } from '../timer'
import { NumInput } from './NumInput'
import { Icon } from './Icon'
import { HistorySheet } from './History'

interface Props {
  week: number
  day: DayId
  onSelect: (s: { week: number; day: DayId }) => void
}

export function WorkoutView({ week, day, onSelect }: Props) {
  const data = useData()
  const d = dayById(day)
  const info = WEEK_INFO[week - 1]
  const stats = sessionStats(data, week, day)
  const sess = getSession(data, week, day)
  const [history, setHistory] = useState<Exercise | null>(null)
  const pct = Math.round((stats.done / stats.total) * 100)
  const dayIdx = DAYS.findIndex((x) => x.id === day)
  const next = dayIdx < DAYS.length - 1 ? { week, day: DAYS[dayIdx + 1].id } : week < WEEKS ? { week: week + 1, day: DAYS[0].id } : null

  return (
    <div className="workout">
      <header className="sticky-head">
        <div className="week-row">
          <button className="icon-btn" disabled={week <= 1} onClick={() => onSelect({ week: week - 1, day })} aria-label="Poprzedni tydzień">
            <Icon name="chev-left" />
          </button>
          <div className="week-title">
            <strong>Tydzień {week}</strong>
            <span className="muted"> / {WEEKS}</span>
            <span className={`phase phase-${info.phase === 'Progresja' ? 'prog' : 'special'}`}>{info.phase}</span>
          </div>
          <button className="icon-btn" disabled={week >= WEEKS} onClick={() => onSelect({ week: week + 1, day })} aria-label="Następny tydzień">
            <Icon name="chev-right" />
          </button>
        </div>
        <div className="week-dots" role="tablist" aria-label="Tygodnie">
          {Array.from({ length: WEEKS }, (_, i) => {
            const ws = weekStats(data, i + 1)
            const cls = ws.done === 0 ? '' : ws.done >= ws.total ? 'full' : 'part'
            return (
              <button
                key={i}
                role="tab"
                aria-selected={week === i + 1}
                className={`dot ${cls} ${week === i + 1 ? 'current' : ''}`}
                onClick={() => onSelect({ week: i + 1, day })}
                aria-label={`Tydzień ${i + 1}: ${ws.done} z ${ws.total} serii`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="day-tabs" role="tablist" aria-label="Dzień treningowy">
          {DAYS.map((x) => {
            const s = sessionStats(data, week, x.id)
            return (
              <button key={x.id} role="tab" aria-selected={x.id === day} className={x.id === day ? 'active' : ''} onClick={() => onSelect({ week, day: x.id })}>
                <span className="day-name">
                  {x.short} <b>{x.session}</b>
                </span>
                <span className="day-meta">{s.done >= s.total ? <Icon name="check" size={14} /> : s.done > 0 ? `${s.done}/${s.total}` : x.title.split(' · ')[0]}</span>
                <span className="day-bar" style={{ width: `${(s.done / s.total) * 100}%` }} />
              </button>
            )
          })}
        </div>
      </header>

      <section className="hero card">
        <div className="hero-top">
          <div>
            <div className="eyebrow">
              {d.weekday} · Trening {d.session}
            </div>
            <h1>{d.title}</h1>
          </div>
          <div className={`ring ${pct >= 100 ? 'done' : ''}`} style={{ ['--p' as string]: pct }} aria-label={`${pct}% wykonane`}>
            <span>{pct}%</span>
          </div>
        </div>
        <div className="hero-meta">
          <label className="date-field">
            <span>Data</span>
            <input type="date" value={sess?.date ?? ''} onChange={(e) => updateSessionMeta(week, day, { date: e.target.value })} />
          </label>
          <span className="muted">
            {stats.done} z {stats.total} serii
          </span>
        </div>
        <p className="hint">{info.hint}</p>
      </section>

      <DayOverview data={data} week={week} day={day} />

      {d.blocks.map((b, bi) => (
        <BlockCard key={`${week}-${day}-${b.letter}`} block={b} nextBlock={d.blocks[bi + 1]} week={week} day={day} data={data} onHistory={setHistory} />
      ))}

      <section className="card notes">
        <label>
          <span className="card-title">
            <Icon name="note" size={18} /> Uwagi po treningu
          </span>
          <textarea
            rows={3}
            placeholder="Samopoczucie, regeneracja, sen, ból, zmiany w planie…"
            defaultValue={sess?.notes ?? ''}
            key={`${week}-${day}-${sess?.t ?? 0}`}
            onBlur={(e) => e.target.value !== (sess?.notes ?? '') && updateSessionMeta(week, day, { notes: e.target.value })}
          />
        </label>
      </section>

      {stats.done >= stats.total && (
        <section className="card done-card">
          <div className="done-icon">
            <Icon name="check" size={28} />
          </div>
          <div>
            <strong>Trening {d.session} zakończony</strong>
            {next && (
              <button className="link-btn" onClick={() => onSelect(next)}>
                Następny: {dayById(next.day).weekday} {dayById(next.day).session}
                {next.week !== week ? ` (tydz. ${next.week})` : ''} →
              </button>
            )}
          </div>
        </section>
      )}

      {history && <HistorySheet exercise={history} day={day} currentWeek={week} onClose={() => setHistory(null)} />}
    </div>
  )
}

function DayOverview({ data, week, day }: { data: AppData; week: number; day: DayId }) {
  const d = dayById(day)
  const sess = getSession(data, week, day)
  return (
    <section className="card overview">
      <div className="card-title">Plan dnia</div>
      <ol>
        {d.blocks.map((b) => {
          const total = b.exercises.reduce((a, e) => a + e.sets, 0)
          const done = b.exercises.reduce((a, e) => a + Array.from({ length: e.sets }, (_, i) => sess?.sets[setKey(e.id, i)]).filter(isLogged).length, 0)
          return (
            <li key={b.letter}>
              <a
                href={`#blok-${b.letter}`}
                onClick={(ev) => {
                  ev.preventDefault()
                  document.getElementById(`blok-${b.letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={done >= total ? 'complete' : ''}
              >
                <span className="badge">{done >= total ? <Icon name="check" size={14} /> : b.letter}</span>
                <span className="ov-names">
                  {b.exercises.map((e) => (
                    <span key={e.id}>
                      {e.name}
                      <span className="muted">
                        {' '}
                        {e.sets}×{fmtRange(e.reps)}
                      </span>
                    </span>
                  ))}
                </span>
                {b.mode !== 'SOLO' && <span className={`mode mode-${modeClass(b)}`}>{MODE_INFO[b.mode].label}</span>}
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const modeClass = (b: Block) => ({ SOLO: 'solo', DWUSERIA: 'super', TRÓJSERIA: 'tri', ANTAGONIŚCI: 'anta' })[b.mode]

function howText(b: Block) {
  if (b.mode === 'SOLO') return `Serie po kolei · przerwa ${b.rest.label}`
  const codes = b.exercises.map((e) => e.code)
  return `${codes.join(` → ${b.between!.label} → `)} → ${b.rest.label} → kolejna runda`
}

interface BlockProps {
  block: Block
  nextBlock?: Block
  week: number
  day: DayId
  data: AppData
  onHistory: (e: Exercise) => void
}

function BlockCard({ block, nextBlock, week, day, data, onHistory }: BlockProps) {
  const sess = getSession(data, week, day)
  const total = block.exercises.reduce((a, e) => a + e.sets, 0)
  const done = block.exercises.reduce((a, e) => a + Array.from({ length: e.sets }, (_, i) => sess?.sets[setKey(e.id, i)]).filter(isLogged).length, 0)
  const [open, setOpen] = useState(() => done < total)
  const solo = block.exercises.length === 1
  const rounds = block.exercises[0].sets
  const refs = useRef<Record<string, HTMLInputElement | null>>({})

  return (
    <section className={`card block ${done >= total ? 'complete' : ''}`} id={`blok-${block.letter}`}>
      <button className="block-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="badge big">{done >= total ? <Icon name="check" size={18} /> : block.letter}</span>
        <span className="block-titles">
          <span className="block-title">{block.title}</span>
          <span className="block-how">{howText(block)}</span>
        </span>
        <span className="block-side">
          <span className={`mode mode-${modeClass(block)}`}>{MODE_INFO[block.mode].label}</span>
          <span className="muted small">
            {done}/{total}
          </span>
        </span>
      </button>

      {open && (
        <div className="block-body">
          {block.exercises.map((e) => (
            <ExerciseHead key={e.id} e={e} week={week} day={day} data={data} solo={solo} onHistory={() => onHistory(e)} />
          ))}

          <div className="sets">
            <div className="set-row head" aria-hidden="true">
              <span>{solo ? 'Seria' : 'Ruch'}</span>
              <span>kg</span>
              <span>powt.</span>
              <span>RIR</span>
              <span />
            </div>
            {Array.from({ length: rounds }, (_, round) => (
              <div key={round} className={solo ? '' : 'round'}>
                {!solo && (
                  <div className="round-label">
                    Runda {round + 1}/{rounds}
                  </div>
                )}
                {block.exercises.map((e, exIdx) => (
                  <SetRow
                    key={e.id}
                    e={e}
                    i={round}
                    label={solo ? `${round + 1}` : e.code}
                    week={week}
                    day={day}
                    data={data}
                    rest={restAfter(block, nextBlock, exIdx, round)}
                    kgRef={(el) => (refs.current[setKey(e.id, round)] = el)}
                    focusKg={() => refs.current[setKey(e.id, round)]?.focus()}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function ExerciseHead({ e, week, day, data, solo, onHistory }: { e: Exercise; week: number; day: DayId; data: AppData; solo: boolean; onHistory: () => void }) {
  const prog = progression(data, week, day, e)
  const prevWeek = prog.fromWeek
  const prevSets = prevWeek
    ? Array.from({ length: e.sets }, (_, i) => getSession(data, prevWeek, day)?.sets[setKey(e.id, i)]).filter(isLogged)
    : []
  const best = e.main ? bestOfWeek(data, week, day, e).best1rm : null
  return (
    <div className="ex-head">
      <div className="ex-name-row">
        {!solo && <span className="code">{e.code}</span>}
        <span className="ex-name">{e.name}</span>
        <button className="icon-btn small" onClick={onHistory} aria-label={`Historia: ${e.name}`} title="Historia z tygodni">
          <Icon name="history" size={18} />
        </button>
      </div>
      <div className="targets">
        <span>
          <b>{e.sets}</b> × <b>{fmtRange(e.reps)}</b> powt.
        </span>
        <span>
          RIR <b>{fmtRange(rirTarget(e, week))}</b>
        </span>
        <span>
          tempo <b>{e.tempo}</b>
        </span>
      </div>
      {(prevSets.length > 0 || prog.kind === 'up' || best != null) && (
        <div className="ex-extra">
          {prog.kind === 'up' && (
            <span className="pill good">
              <Icon name="up" size={14} /> Dołóż ciężar
            </span>
          )}
          {prevSets.length > 0 && (
            <span className="muted small">
              Tydz. {prevWeek}: {prevSets.map(fmtSet).join(' · ')}
            </span>
          )}
          {best != null && <span className="pill">e1RM {fmtNum(best)} kg</span>}
        </div>
      )}
    </div>
  )
}

interface SetRowProps {
  e: Exercise
  i: number
  label: string
  week: number
  day: DayId
  data: AppData
  rest: ReturnType<typeof restAfter>
  kgRef: (el: HTMLInputElement | null) => void
  focusKg: () => void
}

function SetRow({ e, i, label, week, day, data, rest, kgRef, focusKg }: SetRowProps) {
  const key = setKey(e.id, i)
  const s: SetLog | undefined = getSession(data, week, day)?.sets[key]
  const logged = s?.reps != null
  const repsRef = useRef<HTMLInputElement>(null)

  // Propozycja = poprzednia seria z dzisiaj (jeśli jest), w przeciwnym razie ta sama seria z poprzedniego tygodnia
  const suggestion = useMemo(() => {
    const today = i > 0 ? getSession(data, week, day)?.sets[setKey(e.id, i - 1)] : undefined
    if (isLogged(today)) return today
    return previousSet(data, week, day, e.id, i)?.set ?? null
  }, [data, week, day, e.id, i])

  const set = (patch: Partial<SetLog>) => updateSet(week, day, key, patch)
  const empty = !s || (s.kg == null && s.reps == null && s.rir == null)

  const confirm = () => {
    if (!logged) {
      if (empty && suggestion) {
        set({ kg: suggestion.kg, reps: suggestion.reps, rir: suggestion.rir })
      } else if (empty) {
        focusKg()
        return
      } else if (s?.reps == null) {
        repsRef.current?.focus()
        return
      }
    }
    if (rest.rest) restTimer.start(rest.rest, rest.next)
    else restTimer.stop()
  }

  const est = e.main ? e1rm(s) : null

  return (
    <div className={`set-row ${logged ? 'logged' : ''}`}>
      <span className="set-label">
        {label}
        {est != null && <small>{fmtNum(est)}</small>}
      </span>
      <NumInput ref={kgRef} label={`${e.name}, seria ${i + 1}: kg`} decimal value={s?.kg ?? null} placeholder={suggestion?.kg != null ? fmtNum(suggestion.kg) : e.bodyweight ? 'mc' : 'kg'} onChange={(v) => set({ kg: v })} />
      <NumInput ref={repsRef} label={`${e.name}, seria ${i + 1}: powtórzenia`} value={s?.reps ?? null} max={100} placeholder={suggestion?.reps != null ? String(suggestion.reps) : fmtRange(e.reps)} onChange={(v) => set({ reps: v })} />
      <NumInput label={`${e.name}, seria ${i + 1}: RIR`} value={s?.rir ?? null} max={10} placeholder={suggestion?.rir != null ? String(suggestion.rir) : String(rirTarget(e, week)[0])} onChange={(v) => set({ rir: v })} />
      <button
        className={`check ${logged ? 'on' : ''}`}
        onClick={confirm}
        aria-label={logged ? `Seria zapisana – uruchom przerwę (${rest.rest?.label ?? 'koniec'})` : empty && suggestion ? 'Przyjmij propozycję i zapisz serię' : 'Zapisz serię'}
        title={rest.rest ? `Przerwa ${rest.rest.label} → ${rest.next}` : 'Koniec'}
      >
        <Icon name="check" size={20} />
      </button>
    </div>
  )
}
