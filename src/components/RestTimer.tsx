import { fmtTime } from '../logic'
import { restTimer, useTimer } from '../timer'
import { Icon } from './Icon'

export function RestTimerBar() {
  const { t, elapsed } = useTimer()
  if (!t) return null
  const toMin = t.min - elapsed
  const toMax = t.max - elapsed
  const phase = toMin > 0 ? 'rest' : toMax > 0 ? 'ready' : 'over'
  const pct = Math.min(100, (elapsed / t.max) * 100)
  return (
    <div className={`timer timer-${phase}`} role="status" aria-live="polite">
      <div className="timer-progress" style={{ width: `${pct}%` }} />
      <div className="timer-main">
        <Icon name="clock" size={18} />
        <div className="timer-text">
          <strong className="timer-clock">{phase === 'rest' ? fmtTime(toMin) : phase === 'ready' ? `+${fmtTime(elapsed - t.min)}` : `+${fmtTime(elapsed - t.min)}`}</strong>
          <span>
            {phase === 'rest' ? `Przerwa ${t.label}` : phase === 'ready' ? `Możesz zaczynać · max za ${fmtTime(toMax)}` : 'Czas na kolejną serię'} → <b>{t.next}</b>
          </span>
        </div>
      </div>
      <div className="timer-actions">
        <button onClick={() => restTimer.adjust(-15)} aria-label="Skróć o 15 sekund">
          −15
        </button>
        <button onClick={() => restTimer.adjust(15)} aria-label="Wydłuż o 15 sekund">
          +15
        </button>
        <button onClick={() => restTimer.stop()} aria-label="Zamknij minutnik">
          <Icon name="x" size={18} />
        </button>
      </div>
    </div>
  )
}
