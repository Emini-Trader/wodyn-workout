import { useEffect, useState } from 'react'
import { nextSession } from './logic'
import type { DayId } from './plan'
import { store, todayISO } from './store'
import { WorkoutView } from './components/WorkoutView'
import { PlanView } from './components/PlanView'
import { ProgressView } from './components/ProgressView'
import { MoreView } from './components/MoreView'
import { RestTimerBar } from './components/RestTimer'
import { Icon, type IconName } from './components/Icon'

type Tab = 'trening' | 'plan' | 'postepy' | 'wiecej'

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'trening', label: 'Trening', icon: 'dumbbell' },
  { id: 'plan', label: 'Plan', icon: 'list' },
  { id: 'postepy', label: 'Postępy', icon: 'chart' },
  { id: 'wiecej', label: 'Zasady', icon: 'info' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('trening')
  const [sel, setSel] = useState<{ week: number; day: DayId }>(() => nextSession(store.get(), todayISO()))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  const openSession = (week: number, day: DayId) => {
    setSel({ week, day })
    setTab('trening')
  }

  return (
    <div className="app">
      <main className="content">
        {tab === 'trening' && <WorkoutView week={sel.week} day={sel.day} onSelect={setSel} />}
        {tab === 'plan' && <PlanView onOpen={openSession} />}
        {tab === 'postepy' && <ProgressView onOpen={openSession} />}
        {tab === 'wiecej' && <MoreView />}
      </main>
      <RestTimerBar />
      <nav className="tabbar" aria-label="Nawigacja">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
