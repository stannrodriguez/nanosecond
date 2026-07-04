import type { CSSProperties, ReactNode } from 'react'
import { C } from '../theme'

export function Stepper({
  label,
  val,
  set,
  min,
  max,
  col,
}: {
  label: ReactNode
  val: number
  set: (v: number) => void
  min: number
  max: number
  col: string
}) {
  const btn = (dis: boolean): CSSProperties => ({
    width: 26,
    height: 26,
    borderRadius: 6,
    background: C.bg,
    color: dis ? C.faint : C.text,
    border: `1px solid ${C.line}`,
    cursor: dis ? 'default' : 'pointer',
    fontSize: 15,
  })
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: `1px solid ${C.line}`,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button aria-label="decrease" disabled={val <= min} onClick={() => set(Math.max(min, val - 1))} style={btn(val <= min)}>
          −
        </button>
        <span className="mono" style={{ minWidth: 22, textAlign: 'center', color: col, fontWeight: 600 }}>
          {val}
        </span>
        <button aria-label="increase" disabled={val >= max} onClick={() => set(Math.min(max, val + 1))} style={btn(val >= max)}>
          +
        </button>
      </div>
    </div>
  )
}
