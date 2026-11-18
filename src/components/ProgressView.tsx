import { useState } from 'react'
import { DAYS, MAIN_LIFTS, SETS_PER_WEEK, WEEKS, allExercises, dayById, type DayId } from '../plan'
import { useData } from '../store'
import { bestOfWeek, fmtDate, fmtNum, sessionStats, weekStats } from '../logic'
import { LineChart } from './LineChart'
import { HistoryTable } from './History'

const weeks = Array.from({ length: WEEKS }, (_, i) => i + 1)

export function ProgressView({ onOpen }: { onOpen: (week: number, day: DayId) => void }) {
  const data = useData()
  const exercises = allExercises()
  const [exId, setExId] = useState(exercises[0].id)
  const selected = exercises.find((e) => e.id === exId)!

  let done = 0
  let sessions = 0
  for (const w of weeks) {
    done += weekStats(data, w).done
    for (const d of DAYS) if (sessionStats(data, w, d.id).done > 0) sessions++
  }
  const totalSets = SETS_PER_WEEK * WEEKS

  return (
    <div className="progress">
      <header className="page-head">
        <h1>Postępy</h1>
      </header>

      <section className="stats">
        <div className="stat card">
          <span className="stat-label">Realizacja planu</span>
          <span className="stat-value">{Math.round((done / totalSets) * 100)}%</span>
          <span className="muted small">
            {done} / {totalSets} serii
          </span>
        </div>
        <div className="stat card">
          <span className="stat-label">Treningi</span>
          <span className="stat-value">{sessions}</span>
          <span className="muted small">z {WEEKS * DAYS.length}</span>
        </div>
      </section>

      {MAIN_LIFTS.map((lift) => {
        const e = exercises.find((x) => x.id === lift.exId)!
        const rows = weeks.map((w) => bestOfWeek(data, w, lift.day, e))
        const first = rows.find((r) => r.best1rm != null)?.best1rm
        const last = [...rows].reverse().find((r) => r.best1rm != null)?.best1rm
        const delta = first != null && last != null ? last - first : null
        return (
          <section key={lift.id} className="card lift">
            <div className="lift-head">
              <div>
                <div className="eyebrow">
                  {dayById(lift.day).weekday} · {e.name}
                </div>
                <h2>{lift.name}</h2>
              </div>
              {last != null && (
                <div className="lift-now">
                  <strong>{fmtNum(last)} kg</strong>
                  <span className="muted small">
                    e1RM{delta != null && delta !== 0 ? ` · ${delta > 0 ? '+' : ''}${fmtNum(Math.round(delta * 10) / 10)} od startu` : ''}
                  </span>
                </div>
              )}
            </div>
            <LineChart
              xLabels={weeks.map((w) => `T${w}`)}
              series={[
                { name: 'e1RM', color: 'var(--series-1)', values: rows.map((r) => r.best1rm) },
                { name: 'Max ciężar', color: 'var(--series-2)', values: rows.map((r) => r.maxKg) },
              ]}
            />
          </section>
        )
      })}

      <section className="card">
        <div className="card-title">Tydzień po tygodniu</div>
        <div className="table-wrap">
          <table className="weeks-table">
            <thead>
              <tr>
                <th>Tydz.</th>
                {DAYS.map((d) => (
                  <th key={d.id}>
                    {d.short} {d.session}
                  </th>
                ))}
                <th>Serie</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => {
                const ws = weekStats(data, w)
                return (
                  <tr key={w}>
                    <th scope="row">{w}</th>
                    {DAYS.map((d) => {
                      const s = sessionStats(data, w, d.id)
                      return (
                        <td key={d.id}>
                          <button className={`cell-btn ${s.done >= s.total ? 'full' : s.done > 0 ? 'part' : ''}`} onClick={() => onOpen(w, d.id)}>
                            {s.done > 0 ? (s.date ? fmtDate(s.date) : `${s.done}/${s.total}`) : '–'}
                          </button>
                        </td>
                      )
                    })}
                    <td className="num-cell">
                      {ws.done}/{ws.total}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">e1RM = ciężar × (1 + (powtórzenia + RIR) / 30). To orientacyjny trend, nie test 1RM.</p>
      </section>

      <section className="card">
        <div className="card-title">Historia ćwiczenia</div>
        <select className="select" value={exId} onChange={(e) => setExId(e.target.value)} aria-label="Wybierz ćwiczenie">
          {DAYS.map((d) => (
            <optgroup key={d.id} label={`${d.weekday} · ${d.session}`}>
              {exercises
                .filter((e) => e.day.id === d.id)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} · {e.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <HistoryTable exercise={selected} day={selected.day.id} />
      </section>
    </div>
  )
}
