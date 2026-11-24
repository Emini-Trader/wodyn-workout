import { useState } from 'react'
import { DAYS, MODE_INFO, SETS_PER_WEEK, fmtRange, rirTarget, setsInDay, type DayId } from '../plan'
import { sessionStats } from '../logic'
import { useData } from '../store'

// „2–4 serie” (poza 12–14), w pozostałych przypadkach „serii”
const seriesWord = (n: number) => (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'serie' : 'serii')

export function PlanView({ onOpen }: { onOpen: (week: number, day: DayId) => void }) {
  const [calib, setCalib] = useState(false)
  const week = calib ? 1 : 2
  const data = useData()
  return (
    <div className="plan">
      <header className="page-head">
        <h1>Plan tygodnia</h1>
        <p className="muted">
          3 treningi · {SETS_PER_WEEK} {seriesWord(SETS_PER_WEEK)} tygodniowo · 8 tygodni. Kolejność: PON A → WT C → CZW B.
        </p>
        <div className="seg" role="radiogroup" aria-label="Cele RIR">
          <button role="radio" aria-checked={!calib} className={!calib ? 'active' : ''} onClick={() => setCalib(false)}>
            Tydzień 2–8
          </button>
          <button role="radio" aria-checked={calib} className={calib ? 'active' : ''} onClick={() => setCalib(true)}>
            Tydzień 1 · kalibracja (+1 RIR)
          </button>
        </div>
      </header>

      {DAYS.map((d) => (
        <section key={d.id} className="card plan-day">
          <div className="plan-day-head">
            <div>
              <div className="eyebrow">
                {d.weekday} · Trening {d.session}
              </div>
              <h2>{d.title}</h2>
            </div>
            <span className="muted small">{setsInDay(d)} serii</span>
          </div>
          {d.blocks.map((b) => (
            <div key={b.letter} className={`plan-block ${b.exercises.length > 1 ? 'grouped' : ''}`}>
              <div className="plan-block-head">
                <span className="badge">{b.letter}</span>
                <span className="plan-block-title">{b.title}</span>
                {b.mode !== 'SOLO' && <span className={`mode mode-${b.mode === 'DWUSERIA' ? 'super' : b.mode === 'TRÓJSERIA' ? 'tri' : 'anta'}`}>{MODE_INFO[b.mode].label}</span>}
              </div>
              <ul className="plan-ex">
                {b.exercises.map((e) => (
                  <li key={e.id}>
                    <div className="plan-ex-name">
                      {b.exercises.length > 1 && <span className="code">{e.code}</span>}
                      {e.name}
                    </div>
                    <div className="plan-ex-target">
                      <span className="big-num">
                        {e.sets}×{fmtRange(e.reps)}
                      </span>
                      <span>RIR {fmtRange(rirTarget(e, week))}</span>
                      <span>{e.tempo}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="plan-rest">
                {b.between && <span>między ruchami {b.between.label}</span>}
                <span>
                  {b.mode === 'SOLO' ? 'między seriami' : 'między rundami'} {b.rest.label}
                </span>
              </div>
            </div>
          ))}
          <div className="plan-actions">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
              const s = sessionStats(data, w, d.id)
              return (
                <button key={w} className={`mini-week ${s.done >= s.total ? 'full' : s.done > 0 ? 'part' : ''}`} onClick={() => onOpen(w, d.id)} aria-label={`Otwórz tydzień ${w}`}>
                  {w}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
