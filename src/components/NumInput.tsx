import { forwardRef, useEffect, useState } from 'react'
import { fmtNum } from '../logic'

interface Props {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  decimal?: boolean
  label: string
  max?: number
}

const parse = (s: string, decimal: boolean): number | null | undefined => {
  const t = s.trim().replace(',', '.')
  if (t === '') return null
  if (decimal ? !/^\d{1,4}(\.\d{0,2})?$/.test(t) : !/^\d{1,3}$/.test(t)) return undefined
  return Number(t)
}

export const NumInput = forwardRef<HTMLInputElement, Props>(function NumInput(
  { value, onChange, placeholder, decimal = false, label, max = 9999 },
  ref,
) {
  const [draft, setDraft] = useState(fmtNum(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setDraft(fmtNum(value))
  }, [value, focused])

  return (
    <input
      ref={ref}
      className={`num${value != null ? ' filled' : ''}`}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="next"
      autoComplete="off"
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      onFocus={(e) => {
        setFocused(true)
        e.currentTarget.select()
      }}
      onBlur={() => {
        setFocused(false)
        setDraft(fmtNum(value))
      }}
      onChange={(e) => {
        const s = e.target.value
        const v = parse(s, decimal)
        if (v === undefined) return
        if (v != null && v > max) return
        setDraft(s)
        if (v !== value) onChange(v)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input.num'))
          const i = inputs.indexOf(e.currentTarget)
          inputs[i + 1]?.focus()
        }
      }}
    />
  )
})
