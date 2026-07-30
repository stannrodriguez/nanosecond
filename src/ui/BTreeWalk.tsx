// BTreeWalk (spec 076, indexing block 2): the descent, one page read at a time.
// The slider is fan-out — how many children fit in a single page-sized node —
// because fan-out is the whole reason the tree is shallow. The steps walk
// root → branch → leaf → heap fetch, naming what each read costs and whether
// that page is realistically in memory. The last step is the random heap fetch,
// which is the expensive half and the one a covering index removes.

import { useState } from 'react'
import { C } from '../theme'
import { VizFrame } from './viz'

const ROWS = 100_000_000

interface Stage {
  id: string
  label: string
  cost: string
  note: string
}

const STAGES: Stage[] = [
  {
    id: 'root',
    label: 'root',
    cost: '1 page read — from memory, always',
    note: 'One node, read by every query that ever runs. It is permanently in the buffer cache; nobody has ever waited on it.',
  },
  {
    id: 'branch',
    label: 'branch',
    cost: '1 page read — from memory, almost always',
    note: 'Each level narrows the search by the fan-out factor. The top two or three levels are small enough to stay resident, so they are memory reads wearing the costume of disk reads.',
  },
  {
    id: 'leaf',
    label: 'leaf',
    cost: '1 page read — the first that plausibly touches disk',
    note: 'The leaf holds the indexed value and a pointer to where the row actually lives. Leaves are linked left-to-right, which is why a range scan is one descent plus a walk, and why ORDER BY on this column is free.',
  },
  {
    id: 'heap',
    label: 'heap fetch',
    cost: '1 RANDOM read — the expensive half',
    note: 'The row itself is in the heap file, wherever it happened to land. This jump is unordered and uncacheable in bulk — it is the cost a covering index removes by carrying the returned columns in the leaf.',
  },
]

export function BTreeWalk({ accent = C.storage }: { accent?: string }) {
  const [fanout, setFanout] = useState(340)
  const [i, setI] = useState(0)
  const depth = Math.max(1, Math.ceil(Math.log(ROWS) / Math.log(fanout)))
  const reach = Math.pow(fanout, 4)
  const stage = STAGES[i]
  return (
    <VizFrame accent={accent}>
      <label style={{ display: 'block' }}>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim, letterSpacing: 0.5 }}>
          children per node: <b style={{ color: accent }}>{fanout}</b>
        </span>
        <input
          type="range"
          min={16}
          max={512}
          step={4}
          value={fanout}
          onChange={(e) => setFanout(Number(e.target.value))}
          style={{ marginTop: 8 }}
          aria-label="children per node"
        />
      </label>
      <div style={{ fontSize: 19, fontWeight: 700, color: C.text, marginTop: 10, lineHeight: 1.25 }}>
        depth {depth} for 100M rows · four levels reach {reach.toLocaleString('en-US', { maximumFractionDigits: 0 })} rows
      </div>
      <div style={{ fontSize: 12.5, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>
        Fan-out is set by how many keys fit in one page — around 340 for an 8&nbsp;KB node and short keys, far fewer for
        wide text keys. Every extra level multiplies the reach by that factor, which is why a table growing tenfold
        barely moves the depth.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        {STAGES.map((s, k) => {
          const on = k === i
          const done = k < i
          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '2px 10px',
                flexWrap: 'wrap',
                border: `1.5px solid ${on ? accent : C.line}`,
                background: on ? accent + '14' : 'transparent',
                borderRadius: 8,
                padding: '8px 11px',
                // the tree narrows as you descend; the last row steps back out to the heap
                marginLeft: k === 3 ? 0 : k * 10,
                transition: 'border-color .18s, background .18s',
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 12, fontWeight: 700, color: on ? accent : done ? C.dim : C.faint, whiteSpace: 'nowrap' }}
              >
                {k === 3 ? '↳' : '·'} {s.label}
              </span>
              <span style={{ fontSize: 12, color: on ? C.text : C.faint }}>{s.cost}</span>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 13, color: C.text, marginTop: 12, lineHeight: 1.55, minHeight: 66 }}>{stage.note}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          className="mono"
          style={btn(i === 0)}
          aria-label="Previous descent step"
        >
          ◀
        </button>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim }}>
          read {i + 1} / {STAGES.length}
        </span>
        <button
          onClick={() => setI((x) => Math.min(STAGES.length - 1, x + 1))}
          disabled={i >= STAGES.length - 1}
          className="mono"
          style={btn(i >= STAGES.length - 1)}
          aria-label="Next descent step"
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
