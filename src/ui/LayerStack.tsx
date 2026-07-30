// LayerStack (spec 069, networking briefing block 1): the OSI stack as a
// building, drawn top-down L7→L1. The three floors where system design
// happens (L7/L4/L3) are bright and expandable — each opens into the promise
// it GIVES, what it HIDES, what LIVES HERE, and THE FORK you argue about at
// that floor. L5–6 and L1–2 are dim, dashed, and non-interactive: their
// one-line label is the whole lesson. L4 starts open — it is the floor the
// next block takes at full depth.

import { useState, type ReactNode } from 'react'
import { C } from '../theme'
import { VizFrame } from './viz'

interface Floor {
  id: string
  label: string
  note: string
  dim?: boolean
  gives?: ReactNode
  hides?: ReactNode
  lives?: string
  fork?: ReactNode
}

const FLOORS: Floor[] = [
  {
    id: 'l7',
    label: 'L7 · Application',
    note: 'where you design',
    gives: (
      <>
        The conversation gains <b>meaning</b>: verbs and URLs, names, subscriptions, calls — everything you can{' '}
        <span className="mono">curl</span> lives on this floor.
      </>
    ),
    hides: <>That one “request” is really many packets on many routes — and that the connection under it has a lifespan and a price.</>,
    lives: 'HTTP · DNS · WebSocket · SSE · gRPC · WebRTC',
    fork: (
      <>
        REST at the public edge, gRPC where you own both ends, push protocols only for traffic that is genuinely
        push-shaped — every API debate is an L7 debate.
      </>
    ),
  },
  { id: 'l56', label: 'L5–6 · Session · Presentation', note: 'absorbed by L7 in practice', dim: true },
  {
    id: 'l4',
    label: 'L4 · Transport',
    note: 'the foundational trade',
    gives: (
      <>
        Loose packets become an <b>end-to-end conversation</b> — carrying exactly the guarantees you ordered, at exactly
        their price.
      </>
    ),
    hides: <>Loss, duplication, reordering — repaired invisibly (TCP) or handed to you raw (UDP), which is precisely UDP's offer.</>,
    lives: 'TCP · UDP · QUIC',
    fork: (
      <>
        TCP when completeness beats freshness; UDP when a late packet is worse than a lost one. The next block takes
        this floor at full depth.
      </>
    ),
  },
  {
    id: 'l3',
    label: 'L3 · Network',
    note: 'you inherit its geography',
    gives: (
      <>
        Every machine gets an <b>address</b>, plus best-effort delivery to any of them, worldwide. “Best effort” is
        load-bearing: it promises to try, not to succeed.
      </>
    ),
    hides: <>Routing, BGP, peering — the entire backbone of the internet is this floor's implementation detail.</>,
    lives: 'IP',
    fork: (
      <>
        You rarely choose anything here, but you always pay here: regions, availability zones, and the speed-of-light
        round trip are L3 facts your design inherits.
      </>
    ),
  },
  { id: 'l12', label: 'L1–2 · Physical · Data link', note: 'bytes become light', dim: true },
]

function DetailRow({ label, children, bright }: { label: string; children: ReactNode; bright?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(64px, 86px) 1fr', gap: 10, marginTop: 8 }}>
      <span
        className="mono"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: C.faint, textAlign: 'right', paddingTop: 2 }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: bright ? C.text : C.dim, lineHeight: 1.55 }}>{children}</span>
    </div>
  )
}

export function LayerStack({ accent = C.net }: { accent?: string }) {
  // L4 starts open: it is the floor block 2 deepens.
  const [open, setOpen] = useState<string | null>('l4')
  return (
    <VizFrame accent={accent}>
      <div className="mono" style={{ fontSize: 11, color: C.dim, letterSpacing: 0.5, marginBottom: 10 }}>
        seven floors, top down — open the three that matter
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {FLOORS.map((f) => {
          if (f.dim)
            return (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px 10px',
                  flexWrap: 'wrap',
                  border: `1px dashed ${C.line}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                }}
              >
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: C.faint }}>
                  {f.label}
                </span>
                <span style={{ fontSize: 12, color: C.faint, marginLeft: 'auto' }}>{f.note}</span>
              </div>
            )
          const on = open === f.id
          return (
            <div
              key={f.id}
              style={{
                border: `1.5px solid ${on ? accent : accent + '55'}`,
                borderRadius: 8,
                background: on ? accent + '0D' : 'transparent',
                transition: 'border-color .18s, background .18s',
              }}
            >
              <button
                onClick={() => setOpen(on ? null : f.id)}
                aria-expanded={on}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px 10px',
                  flexWrap: 'wrap',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: accent }}>
                  {f.label}
                </span>
                <span style={{ fontSize: 12.5, color: C.dim }}>{f.note}</span>
                <span className="mono" aria-hidden style={{ marginLeft: 'auto', fontSize: 11, color: C.faint }}>
                  {on ? '−' : '+'}
                </span>
              </button>
              {on && (
                <div style={{ padding: '0 12px 12px' }}>
                  <DetailRow label="GIVES" bright>
                    {f.gives}
                  </DetailRow>
                  <DetailRow label="HIDES">{f.hides}</DetailRow>
                  <DetailRow label="LIVES HERE">
                    <span className="mono" style={{ fontSize: 12, color: C.text }}>
                      {f.lives}
                    </span>
                  </DetailRow>
                  <DetailRow label="THE FORK">{f.fork}</DetailRow>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </VizFrame>
  )
}
