import { useRef, useState } from 'react'
import { MODE_INFO, WEEK_INFO, type Mode } from '../plan'
import { emptyData, isValidData, mergeData, store, todayISO } from '../store'
import { toCSV } from '../logic'
import { getSyncKey, setSyncKey, syncNow, useSyncStatus } from '../sync'
import { Icon } from './Icon'

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function MoreView() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [key, setKey] = useState(getSyncKey())
  const sync = useSyncStatus()

  const onImport = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text())
      if (!isValidData(parsed)) throw new Error()
      const replace = confirm('Zastąpić obecne dane zawartością pliku?\n\nOK – zastąp\nAnuluj – połącz z obecnymi danymi')
      store.replace(replace ? { ...parsed, updatedAt: Date.now() } : mergeData(store.get(), parsed), { local: true })
      setMsg('Zaimportowano dane.')
    } catch {
      setMsg('Nie udało się odczytać pliku – to nie jest kopia z tej aplikacji.')
    }
  }

  return (
    <div className="more">
      <header className="page-head">
        <h1>Zasady planu</h1>
      </header>

      <section className="card rules">
        <div className="card-title">Jak wykonywać bloki</div>
        <dl>
          {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
            <div key={m}>
              <dt>
                <span className={`mode mode-${m === 'SOLO' ? 'solo' : m === 'DWUSERIA' ? 'super' : m === 'TRÓJSERIA' ? 'tri' : 'anta'}`}>{MODE_INFO[m].label}</span>
              </dt>
              <dd>{MODE_INFO[m].how}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card rules">
        <div className="card-title">RIR i progresja</div>
        <p>
          <b>RIR</b> – powtórzenia w zapasie. Cel: 2–3 w bojach, 1–2 w wybranych akcesoriach.
        </p>
        <p>
          <b>Progresja</b> – gdy we wszystkich seriach osiągniesz górny zakres powtórzeń przy celu RIR, zwiększ ciężar. Nie zwiększaj
          wszystkiego naraz. Aplikacja podpowiada to znacznikiem <span className="pill good inline"><Icon name="up" size={12} /> Dołóż ciężar</span>.
        </p>
        <p>
          <b>e1RM</b> = ciężar × (1 + (powtórzenia + RIR) / 30) – orientacyjny trend siły, nie test maksymalny.
        </p>
      </section>

      <section className="card rules">
        <div className="card-title">Tempo</div>
        <dl className="tempo">
          <div>
            <dt>20X0</dt>
            <dd>2 s w dół, bez pauzy, dynamicznie w górę, bez pauzy</dd>
          </div>
          <div>
            <dt>21X0</dt>
            <dd>jak wyżej + 1 s pauzy na dole</dd>
          </div>
          <div>
            <dt>2010</dt>
            <dd>2 s w dół, 1 s w górę</dd>
          </div>
          <div>
            <dt>2011</dt>
            <dd>2 s w dół, 1 s w górę, 1 s napięcia na górze</dd>
          </div>
          <div>
            <dt>3010</dt>
            <dd>3 s w dół, bez pauzy, 1 s w górę</dd>
          </div>
          <div>
            <dt>reset</dt>
            <dd>ustaw pozycję przed każdym powtórzeniem</dd>
          </div>
        </dl>
      </section>

      <section className="card rules">
        <div className="card-title">Periodyzacja – 8 tygodni</div>
        <ol className="phases">
          {WEEK_INFO.map((w) => (
            <li key={w.n}>
              <span className="badge">{w.n}</span>
              <span>
                <b>{w.phase}</b>
                {w.n === 1 || w.n === 4 || w.n === 8 ? <span className="muted"> – {w.hint}</span> : null}
              </span>
            </li>
          ))}
        </ol>
        <p className="muted small">
          Źródło: wariant jednej sesji wg nagrania Wodyna (18:53–19:15), PICP L1 (seria / przerwy / tempo), PICP L2 (dobór ćwiczeń). Konkretne serie, RIR i rozkład A/B/C to adaptacja.
        </p>
      </section>

      <section className="card">
        <div className="card-title">Twoje dane</div>
        <p className="muted small">Wyniki zapisują się automatycznie w tej przeglądarce. Rób od czasu do czasu kopię albo włącz synchronizację.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => download(`wodyn-dziennik-${todayISO()}.json`, JSON.stringify(store.get(), null, 2), 'application/json')}>
            <Icon name="download" size={18} /> Kopia (JSON)
          </button>
          <button className="btn" onClick={() => download(`wodyn-dziennik-${todayISO()}.csv`, '﻿' + toCSV(store.get()), 'text/csv;charset=utf-8')}>
            <Icon name="download" size={18} /> Eksport CSV
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Wczytaj kopię
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>

      <section className="card">
        <div className="card-title">
          <Icon name="cloud" size={18} /> Synchronizacja między urządzeniami
        </div>
        <p className="muted small">
          Opcjonalnie: po skonfigurowaniu bazy Upstash na Vercelu (instrukcja w README) wpisz tutaj hasło <code>SYNC_SECRET</code>. Dane będą wspólne dla telefonu i komputera.
        </p>
        <form
          className="sync-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSyncKey(key.trim())
          }}
        >
          <input className="text" type="password" autoComplete="current-password" placeholder="Hasło synchronizacji" value={key} onChange={(e) => setKey(e.target.value)} />
          <button className="btn primary" type="submit">
            Zapisz
          </button>
        </form>
        <p className="small sync-status">
          {sync.state === 'off' && <span className="muted">Wyłączona – dane tylko na tym urządzeniu.</span>}
          {sync.state === 'syncing' && <span>Synchronizuję…</span>}
          {sync.state === 'ok' && <span className="ok">✓ Zsynchronizowano {new Date(sync.at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>}
          {sync.state === 'error' && <span className="err">{sync.message}</span>}
          {sync.state !== 'off' && (
            <button className="link-btn" onClick={() => void syncNow()}>
              Synchronizuj teraz
            </button>
          )}
        </p>
      </section>

      <section className="card danger">
        <button
          className="btn danger-btn"
          onClick={() => {
            if (confirm('Usunąć wszystkie zapisane wyniki z tego urządzenia? Tej operacji nie można cofnąć.')) {
              setSyncKey('')
              setKey('')
              store.replace(emptyData())
              setMsg('Dane zostały usunięte.')
            }
          }}
        >
          Wyczyść wszystkie dane
        </button>
      </section>
    </div>
  )
}
