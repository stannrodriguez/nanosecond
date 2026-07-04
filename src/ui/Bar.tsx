import type { ReactNode } from 'react'
import { C, CH_COLOR, DANGER_UTIL, type Channel } from '../theme'

// The utilization bar. The 80% danger line is drawn everywhere, always.
export function Bar({
  label,
  u,
  ch,
  note,
  txt,
  pulsing,
}: {
  label: ReactNode
  u: number
  ch?: Channel | string
  note?: string
  /** override the right-hand percentage text (e.g. "THROTTLING") */
  txt?: string
  pulsing?: boolean
}) {
  const base = ch && ch in CH_COLOR ? CH_COLOR[ch as Channel] : typeof ch === 'string' ? ch : C.net
  const col = u >= 1 ? C.alert : u >= DANGER_UTIL ? C.compute : base
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3, gap: 8 }}>
        <span>{label}</span>
        <span
          className="mono"
          style={{ color: col, fontWeight: 600, animation: pulsing && u >= 1 ? 'ns-pulse .8s infinite' : 'none' }}
        >
          {txt ?? `${Math.round(u * 100)}%`}
        </span>
      </div>
      <div style={{ height: 12, background: C.bg, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(u, 1) * 100}%`,
            background: `linear-gradient(90deg, ${col}55, ${col})`,
            transition: 'width .15s linear',
          }}
        />
        <div style={{ position: 'absolute', left: `${DANGER_UTIL * 100}%`, top: 0, bottom: 0, width: 1, background: C.faint }} />
      </div>
      {note && (
        <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>
          {note}
        </div>
      )}
    </div>
  )
}
