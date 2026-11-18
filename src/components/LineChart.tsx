import { useRef, useState } from 'react'
import { fmtNum } from '../logic'

export interface Series {
  name: string
  color: string // CSS var
  values: (number | null)[]
}

const W = 340
const H = 180
const PAD = { l: 36, r: 44, t: 12, b: 24 }

export function LineChart({ series, xLabels, unit = 'kg' }: { series: Series[]; xLabels: string[]; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null))
  if (all.length === 0) return <div className="chart-empty muted small">Brak danych – zapisz pierwsze serie.</div>

  let lo = Math.min(...all)
  let hi = Math.max(...all)
  const span = Math.max(hi - lo, 10)
  lo = Math.max(0, Math.floor((lo - span * 0.15) / 5) * 5)
  hi = Math.ceil((hi + span * 0.15) / 5) * 5
  const n = xLabels.length
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (n - 1)
  const y = (v: number) => PAD.t + ((hi - v) / (hi - lo)) * (H - PAD.t - PAD.b)
  const ticks = [lo, (lo + hi) / 2, hi]

  const pathFor = (vals: (number | null)[]) => {
    let d = ''
    let pen = false
    vals.forEach((v, i) => {
      if (v == null) {
        pen = false
        return
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      pen = true
    })
    return d
  }

  const onMove = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const lastIdx = (vals: (number | null)[]) => {
    for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i
    return -1
  }

  // etykiety bezpośrednie na końcu linii – rozsunięte, żeby się nie nakładały
  const ends = series
    .map((s) => ({ s, i: lastIdx(s.values) }))
    .filter((e) => e.i >= 0)
    .map((e) => ({ ...e, yy: y(e.s.values[e.i]!) }))
    .sort((a, b) => a.yy - b.yy)
  for (let k = 1; k < ends.length; k++) if (ends[k].yy - ends[k - 1].yy < 13) ends[k].yy = ends[k - 1].yy + 13

  return (
    <div className="chart">
      <div className="legend">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="chart-box">
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={series.map((s) => `${s.name}: ${s.values.map((v) => (v == null ? '–' : fmtNum(v))).join(', ')}`).join('; ')}
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerDown={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="grid" />
              <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="axis">
                {fmtNum(Math.round(t))}
              </text>
            </g>
          ))}
          {xLabels.map((l, i) => (
            <text key={l} x={x(i)} y={H - 6} textAnchor="middle" className="axis">
              {l}
            </text>
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="crosshair" />}
          {series.map((s) => (
            <g key={s.name}>
              <path d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) =>
                v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />,
              )}
            </g>
          ))}
          {ends.map((e) => (
            <text key={e.s.name} x={x(e.i) + 8} y={e.yy + 4} className="end-label">
              {fmtNum(e.s.values[e.i]!)}
            </text>
          ))}
        </svg>
        {hover != null && series.some((s) => s.values[hover] != null) && (
          <div className="tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <div className="tt-title">{xLabels[hover]}</div>
            {series.map((s) => (
              <div key={s.name} className="tt-row">
                <i style={{ background: s.color }} />
                <strong>{s.values[hover] == null ? '–' : `${fmtNum(s.values[hover])} ${unit}`}</strong>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
