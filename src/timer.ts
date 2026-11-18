import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Rest } from './plan'

export interface TimerState {
  startedAt: number
  min: number
  max: number
  label: string
  next: string
  alerted?: boolean
}

let timer: TimerState | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const restTimer = {
  start(rest: Rest, next: string) {
    timer = { startedAt: Date.now(), min: rest.min, max: rest.max, label: rest.label, next }
    unlockAudio()
    emit()
  },
  adjust(delta: number) {
    if (!timer) return
    timer = { ...timer, min: Math.max(5, timer.min + delta), max: Math.max(5, timer.max + delta), alerted: false }
    emit()
  },
  stop() {
    timer = null
    emit()
  },
}

export function useTimer() {
  const t = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => timer,
  )
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!t) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [t])
  const elapsed = t ? (now - t.startedAt) / 1000 : 0
  useEffect(() => {
    if (t && !t.alerted && elapsed >= t.min) {
      t.alerted = true
      beep()
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        /* ignore */
      }
    }
  }, [t, elapsed])
  return { t, elapsed }
}

let ctx: AudioContext | null = null
function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

function beep() {
  if (!ctx) return
  try {
    const t0 = ctx.currentTime
    for (const [i, f] of [880, 1175].entries()) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + i * 0.18)
      g.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.18 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.18 + 0.16)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + i * 0.18)
      o.stop(t0 + i * 0.18 + 0.17)
    }
  } catch {
    /* ignore */
  }
}
