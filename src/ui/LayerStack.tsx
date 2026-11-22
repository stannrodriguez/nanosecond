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
        The conversation gains <b>meaning</b>: verbs, URLs, hostnames, subscriptions, and RPC calls. Everything you can{' '}
        <span className="mono">curl</span> lives on this floor.
      </>
    ),
    hides: (
      <>
        A single “request” is really a stream of packets traveling across multiple hops, riding on a connection that has
        its own setup cost and lifespan.
      </>
    ),
    lives: 'HTTP · DNS · WebSocket · SSE · gRPC · WebRTC',
    fork: (
      <>
        REST at the public edge, gRPC where you control both sides, and push protocols only when the traffic actually
        flows server-first. Every API debate happens at L7.
      </>
    ),
  },
  { id: 'l56', label: 'L5-6 · Session · Presentation', note: 'folded into L7 in practice', dim: true },
  {
    id: 'l4',
    label: 'L4 · Transport',
    note: 'the core delivery trade',
    gives: (
      <>
        Loose packets become an <b>end-to-end conversation</b>, delivering the exact guarantees you asked for at the
        exact latency cost they require.
      </>
    ),
    hides: (
      <>
        Dropped, duplicated, and reordered packets. TCP repairs them quietly; UDP hands them straight to your app, which
        is the whole point of choosing UDP.
      </>
    ),
    lives: 'TCP · UDP · QUIC',
    fork: (
      <>
        Pick TCP when completeness matters more than freshness, and UDP when a late packet hurts more than a lost one.
        The next block zooms all the way into this floor.
      </>
    ),
  },
  {
    id: 'l3',
    label: 'L3 · Network',
    note: 'geography you inherit',
    gives: (
      <>
        Every machine gets an <b>address</b> and best-effort packet delivery to any other machine on Earth. “Best
        effort” does real work here: the network promises to try, never to guarantee arrival.
      </>
    ),
    hides: <>Routing tables, BGP, and carrier peering. The entire internet backbone sits hidden underneath this single interface.</>,
    lives: 'IP',
    fork: (
      <>
        You rarely pick a protocol on this floor, yet you pay its bill on every request. Regions, availability zones,
        and speed-of-light round trips are L3 constraints your architecture inherits.
      </>
    ),
  },
  { id: 'l12', label: 'L1-2 · Physical · Data link', note: 'bytes turn into light', dim: true },
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
        seven layers, top down · open the three where design happens
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
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '4px 10px',
                  flexWrap: 'wrap',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '9px 26px 9px 12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: accent }}>
                  {f.label}
                </span>
                <span style={{ fontSize: 12.5, color: C.dim }}>{f.note}</span>
                {/* pinned so a wrapping note can never strand it on its own line */}
                <span
                  className="mono"
                  aria-hidden
                  style={{ position: 'absolute', right: 12, top: 9, fontSize: 11, color: C.faint }}
                >
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
