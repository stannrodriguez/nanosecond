// Interactive visualization toolkit for the Concept Library (spec 047).
// The pedagogical bar (docs/content-pipeline.md §7): the viz carries the
// explanation, and every viz has at least one state the player can change.
// These four primitives — Slidey (drag a knob, watch a number move), Toggler
// (A/B/C swap of a diagram), Stepper (scrub a sequence), and HashRing (the
// consistent-hashing ring) — cover all 27 sections. Prose annotates them.

import { useState, type ReactNode } from 'react'
import { C } from '../theme'

/* ---------------- shared frame ---------------- */
export function VizFrame({ children, accent = C.net }: { children: ReactNode; accent?: string }) {
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${accent}44`,
        borderRadius: 10,
        padding: '14px 16px',
        margin: '12px 0',
      }}
    >
      {children}
    </div>
  )
}

/* ---------------- horizontal bar chart ---------------- */
export interface Bar {
  label: string
  frac: number // 0..1
  col?: string
  tag?: string
}

export function Bars({ bars }: { bars: Bar[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
      {bars.map((b) => {
        const col = b.col ?? C.net
        return (
          <div key={b.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 96px) 1fr', gap: 10, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: C.dim, textAlign: 'right' }}>
              {b.label}
            </span>
            <div style={{ position: 'relative', height: 16, background: C.panel, borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${Math.max(Math.min(b.frac, 1) * 100, 1.5)}%`,
                  background: `linear-gradient(90deg, ${col}44, ${col})`,
                  borderRadius: 4,
                  transition: 'width .18s',
                }}
              />
              {b.tag && (
                <span
                  className="mono"
                  style={{ position: 'absolute', right: 6, top: 0, lineHeight: '16px', fontSize: 10, color: C.text }}
                >
                  {b.tag}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- Slidey: drag a knob, watch the number move ---------------- */
export interface SlideyOut {
  headline: ReactNode
  caption?: ReactNode
  bars?: Bar[]
}

export function Slidey({
  label,
  min,
  max,
  step = 1,
  init,
  accent = C.net,
  fmt = (v) => String(v),
  compute,
}: {
  label: string
  min: number
  max: number
  step?: number
  init: number
  accent?: string
  fmt?: (v: number) => string
  compute: (v: number) => SlideyOut
}) {
  const [v, setV] = useState(init)
  const out = compute(v)
  return (
    <VizFrame accent={accent}>
      <label style={{ display: 'block' }}>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim, letterSpacing: 0.5 }}>
          {label}: <b style={{ color: accent }}>{fmt(v)}</b>
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          style={{ marginTop: 8 }}
          aria-label={label}
        />
      </label>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 10, lineHeight: 1.2 }}>{out.headline}</div>
      {out.caption && <div style={{ fontSize: 12.5, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>{out.caption}</div>}
      {out.bars && <Bars bars={out.bars} />}
    </VizFrame>
  )
}

/* ---------------- Toggler: A/B/C swap of a diagram ---------------- */
export interface TogOpt {
  id: string
  label: string
  col?: string
}

export function Toggler({
  options,
  initial,
  children,
}: {
  options: TogOpt[]
  initial?: string
  children: (id: string) => ReactNode
}) {
  const [id, setId] = useState(initial ?? options[0].id)
  const active = options.find((o) => o.id === id) ?? options[0]
  return (
    <VizFrame accent={active.col ?? C.net}>
      <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const on = o.id === id
          const col = o.col ?? C.net
          return (
            <button
              key={o.id}
              role="tab"
              aria-selected={on}
              onClick={() => setId(o.id)}
              className="mono"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: on ? col : C.panel,
                color: on ? C.bg : C.dim,
                border: `1px solid ${on ? col : C.line}`,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <div style={{ marginTop: 14 }}>{children(id)}</div>
    </VizFrame>
  )
}

/* ---------------- Stepper: scrub a sequence of frames ---------------- */
export interface Step {
  active: number[] // indices of nodes lit this frame
  edge?: [number, number] // an arrow to draw between two nodes
  cap: ReactNode
}

export function Stepper({ nodes, steps, accent = C.net }: { nodes: string[]; steps: Step[]; accent?: string }) {
  const [i, setI] = useState(0)
  const step = steps[Math.min(i, steps.length - 1)]
  const lit = new Set(step.active)
  return (
    <VizFrame accent={accent}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center', minHeight: 44 }}>
        {nodes.map((n, k) => {
          const on = lit.has(k)
          const inEdge = step.edge && (step.edge[0] === k || step.edge[1] === k)
          const col = on ? accent : C.faint
          return (
            <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  padding: '8px 11px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: on ? accent + '22' : C.panel,
                  color: col,
                  border: `1.5px solid ${on ? accent : C.line}`,
                  boxShadow: inEdge ? `0 0 12px ${accent}66` : 'none',
                  transition: 'all .18s',
                }}
                className="mono"
              >
                {n}
              </span>
              {k < nodes.length - 1 && <span style={{ color: C.faint, fontSize: 15 }}>→</span>}
            </span>
          )
        })}
      </div>
      <div style={{ fontSize: 13.5, color: C.text, marginTop: 12, lineHeight: 1.55, minHeight: 42 }}>{step.cap}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          className="mono"
          style={btn(i === 0)}
          aria-label="Previous step"
        >
          ◀
        </button>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim }}>
          step {Math.min(i, steps.length - 1) + 1} / {steps.length}
        </span>
        <button
          onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))}
          disabled={i >= steps.length - 1}
          className="mono"
          style={btn(i >= steps.length - 1)}
          aria-label="Next step"
        >
          ▶
        </button>
      </div>
    </VizFrame>
  )
}

function btn(disabled: boolean) {
  return {
    background: disabled ? C.line : C.panelUp,
    color: disabled ? C.faint : C.text,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
  } as const
}

/* ---------------- HashRing: the consistent-hashing ring ---------------- */
// Bespoke viz for the consistent-hashing section. Slider sets node count; the
// ring shows where 12 fixed keys land, and the readout contrasts how many keys
// move when a node joins under a naive `hash % N` vs a consistent ring.
export function HashRing() {
  const [n, setN] = useState(4)
  const KEYS = 12
  // fixed key angles (deterministic, no RNG so screenshots are stable)
  const keyPos = Array.from({ length: KEYS }, (_, i) => ((i * 137.5) % 360))
  const nodePos = Array.from({ length: n }, (_, i) => (i * 360) / n)
  const owner = (angle: number) => {
    // next node clockwise
    let best = 0
    let bestGap = 999
    for (let k = 0; k < n; k++) {
      let gap = nodePos[k] - angle
      if (gap < 0) gap += 360
      if (gap < bestGap) {
        bestGap = gap
        best = k
      }
    }
    return best
  }
  const R = 78
  const cx = 110
  const cy = 100
  const pt = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
  }
  const cols = [C.net, C.mem, C.compute, C.storage, C.gold, C.alert, '#B58BFF', '#7BD0EF']
  // consistent ring: adding the nth node steals ~1/n of the key space from one neighbor
  const consistentMoved = Math.round(KEYS / n)
  const moduloMoved = Math.round(KEYS * (1 - 1 / n)) // hash%N reshuffles almost everything
  return (
    <VizFrame accent={C.net}>
      <label style={{ display: 'block' }}>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim }}>
          nodes on the ring: <b style={{ color: C.net }}>{n}</b>
        </span>
        <input
          type="range"
          min={2}
          max={8}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          style={{ marginTop: 8 }}
          aria-label="nodes on the ring"
        />
      </label>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <svg width="220" height="200" viewBox="0 0 220 200" role="img" aria-label="consistent hashing ring">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.line} strokeWidth={2} />
          {keyPos.map((a, i) => {
            const o = owner(a)
            const [x, y] = pt(a, R)
            return <circle key={`k${i}`} cx={x} cy={y} r={4} fill={cols[o % cols.length]} />
          })}
          {nodePos.map((a, i) => {
            const [x, y] = pt(a, R)
            return (
              <g key={`n${i}`}>
                <rect x={x - 6} y={y - 6} width={12} height={12} rx={2} fill={C.bg} stroke={cols[i % cols.length]} strokeWidth={2} />
              </g>
            )
          })}
        </svg>
        <div style={{ flex: '1 1 150px', minWidth: 150 }}>
          <div className="mono" style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>
            keys that move when node #{n} joins:
          </div>
          <Bars
            bars={[
              { label: 'consistent', frac: consistentMoved / KEYS, col: C.mem, tag: `${consistentMoved}/${KEYS}` },
              { label: 'hash % N', frac: moduloMoved / KEYS, col: C.alert, tag: `${moduloMoved}/${KEYS}` },
            ]}
          />
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: C.dim, marginTop: 10, lineHeight: 1.5 }}>
        Squares are nodes, dots are keys (a key belongs to the next node clockwise). Add a node and only its new
        clockwise slice re-homes — about <b style={{ color: C.mem }}>1/{n}</b> of the keys. A plain{' '}
        <span className="mono">hash % N</span> would reshuffle nearly all of them.
      </div>
    </VizFrame>
  )
}
