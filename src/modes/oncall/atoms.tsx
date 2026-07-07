import type { ReactNode } from 'react'
import { C } from '../../theme'

export function Card({ title, col, children }: { title: string; col: string; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 620, margin: '20px auto', background: C.panel, border: `1px solid ${col}55`, borderRadius: 12, padding: 20 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, color: col, marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export function Choice({ title, sub, onClick, disabled }: { title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: C.panelUp,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        padding: '11px 14px',
        marginTop: 10,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? C.faint : C.text,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.dim, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
    </button>
  )
}

export function Step({
  label,
  val,
  canDec,
  canInc,
  onDec,
  onInc,
  col,
  price,
}: {
  label: string
  val: number
  canDec: boolean
  canInc: boolean
  onDec: () => void
  onInc: () => void
  col: string
  price: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 12.5 }}>
        {label}{' '}
        <span className="mono" style={{ color: C.gold, fontSize: 11 }}>
          ${price}
        </span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          disabled={!canDec}
          onClick={onDec}
          aria-label={`sell ${label}`}
          style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, color: canDec ? C.text : C.faint, border: `1px solid ${C.line}`, cursor: canDec ? 'pointer' : 'default', fontSize: 14 }}
        >
          −
        </button>
        <span className="mono" style={{ minWidth: 20, textAlign: 'center', color: col, fontWeight: 600, fontSize: 13 }}>
          {val}
        </span>
        <button
          disabled={!canInc}
          onClick={onInc}
          aria-label={`buy ${label}`}
          style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, color: canInc ? C.text : C.faint, border: `1px solid ${C.line}`, cursor: canInc ? 'pointer' : 'default', fontSize: 14 }}
        >
          +
        </button>
      </div>
    </div>
  )
}
