import { useEffect } from 'react'
import { WEEKS, fmtRange, rirTarget, type DayId, type Exercise } from '../plan'
import { getSession, setKey, useData } from '../store'
import { bestOfWeek, fmtDate, fmtNum, fmtSet, isLogged, progression } from '../logic'
import { Icon } from './Icon'

export function HistoryTable({ exercise: e, day, currentWeek }: { exercise: Exercise; day: DayId; currentWeek?: number }) {
  const data = useData()
  const rows = Array.from({ length: WEEKS }, (_, w) => w + 1)
  return (
    <ul className="hist-list">
      {rows.map((w) => {
        const sess = getSession(data, w, day)
        const b = bestOfWeek(data, w, day, e)
        const sets = Array.from({ length: e.sets }, (_, i) => sess?.sets[setKey(e.id, i)])
        return (
          <li key={w} className={w === currentWeek ? 'current' : ''}>
            <span className="hist-week">
              T{w}
              {sess?.date && <small>{fmtDate(sess.date)}</small>}
            </span>
            <span className="hist-sets">
              {b.logged === 0 ? <span className="muted">–</span> : sets.map((s, i) => (isLogged(s) ? <span key={i}>{fmtSet(s)}</span> : null))}
            </span>
            <span className="hist-best">
              {b.logged > 0 && (e.main ? b.best1rm != null && <>{fmtNum(b.best1rm)}<small>e1RM</small></> : <>{fmtNum(b.volume)}<small>kg obj.</small></>)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function HistorySheet({ exercise: e, day, currentWeek, onClose }: { exercise: Exercise; day: DayId; currentWeek: number; onClose: () => void }) {
  const data = useData()
  const prog = progression(data, currentWeek, day, e)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Historia: ${e.name}`} onClick={(ev) => ev.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">Historia ćwiczenia</div>
            <h2>{e.name}</h2>
            <div className="muted small">
              Cel: {e.sets} × {fmtRange(e.reps)} powt. · RIR {fmtRange(rirTarget(e, currentWeek))} · tempo {e.tempo}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <Icon name="x" />
          </button>
        </div>
        {prog.kind === 'up' && (
          <p className="pill good block-pill">
            <Icon name="up" size={14} /> W tygodniu {prog.fromWeek} wszystkie serie na górze zakresu – zwiększ ciężar.
          </p>
        )}
        {prog.kind === 'hold' && (
          <p className="muted small">W tygodniu {prog.fromWeek} nie wszystkie serie osiągnęły {e.reps[1]} powt. – zostań przy ciężarze i dokładaj powtórzenia.</p>
        )}
        <HistoryTable exercise={e} day={day} currentWeek={currentWeek} />
        <p className="muted small">Zapis: kg × powtórzenia @RIR</p>
      </div>
    </div>
  )
}
