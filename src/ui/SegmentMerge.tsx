// SegmentMerge (spec 076, search-db block 4): why an update costs more than an
// insert in a store that never edits anything. Step through it — documents land
// as new immutable segments, an update writes a tombstone plus a fresh copy, and
// only a merge reclaims the dead space. The two counters are the ones that
// matter operationally: how many segments a query must open, and how much of the
// index is documents nobody can see any more.

import { useState } from 'react'
import { C } from '../theme'
import { VizFrame } from './viz'

interface Seg {
  id: string
  live: number
  dead: number
}

interface Event {
  label: string
  segs: Seg[]
  note: string
}

const EVENTS: Event[] = [
  {
    label: 'index 3 documents',
    segs: [{ id: 'seg-1', live: 3, dead: 0 }],
    note: 'The buffer flushes and three documents land as one file. Nothing in it will ever be modified — that is the deal the whole design is built on.',
  },
  {
    label: 'index 3 more',
    segs: [
      { id: 'seg-1', live: 3, dead: 0 },
      { id: 'seg-2', live: 3, dead: 0 },
    ],
    note: 'A second file, not an extension of the first. Every query now opens both and merges what they return — segment count is a cost you can watch grow.',
  },
  {
    label: 'update 1 document',
    segs: [
      { id: 'seg-1', live: 2, dead: 1 },
      { id: 'seg-2', live: 3, dead: 0 },
      { id: 'seg-3', live: 1, dead: 0 },
    ],
    note: 'There is no in-place edit available. The old copy is marked deleted where it sits — still on disk, still read and filtered out — and the new version is written into a third file. One update, two costs, three files.',
  },
  {
    label: 'delete 1 document',
    segs: [
      { id: 'seg-1', live: 2, dead: 1 },
      { id: 'seg-2', live: 2, dead: 1 },
      { id: 'seg-3', live: 1, dead: 0 },
    ],
    note: 'The delete is also a write: a tombstone, and a document that keeps occupying space and a little read work on every query until someone reclaims it.',
  },
  {
    label: 'merge',
    segs: [{ id: 'seg-4', live: 5, dead: 0 }],
    note: 'The merge rewrites the live documents into one new file and drops the tombstoned ones for real. Queries get cheap again, and the disk gives the space back — hours after you asked for it, in background I/O you share with live traffic.',
  },
]

export function SegmentMerge({ accent = C.storage }: { accent?: string }) {
  const [i, setI] = useState(0)
  const ev = EVENTS[i]
  const live = ev.segs.reduce((n, s) => n + s.live, 0)
  const dead = ev.segs.reduce((n, s) => n + s.dead, 0)
  const deadPct = live + dead === 0 ? 0 : Math.round((dead / (live + dead)) * 100)
  return (
    <VizFrame accent={accent}>
      <div className="mono" style={{ fontSize: 11, color: C.dim, letterSpacing: 0.5, marginBottom: 10 }}>
        nothing is ever edited — step through what that costs
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {EVENTS.map((e, k) => {
          const on = k === i
          return (
            <button
              key={e.label}
              onClick={() => setI(k)}
              aria-pressed={on}
              className="mono"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: on ? accent : C.panel,
                color: on ? C.bg : C.dim,
                border: `1px solid ${on ? accent : C.line}`,
              }}
            >
              {e.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {ev.segs.map((s) => (
          <div
            key={s.id}
            style={{
              border: `1.5px solid ${accent}66`,
              borderRadius: 8,
              padding: '8px 10px',
              flex: '1 1 92px',
              minWidth: 0,
            }}
          >
            <div className="mono" style={{ fontSize: 11, color: accent, fontWeight: 700 }}>
              {s.id}
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 7 }}>
              {Array.from({ length: s.live }, (_, k) => (
                <span key={`l${k}`} title="live document" style={dot(C.mem)} />
              ))}
              {Array.from({ length: s.dead }, (_, k) => (
                <span key={`d${k}`} title="tombstoned document" style={dot(C.alert)} />
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 6 }}>
              {s.live} live{s.dead > 0 ? ` · ${s.dead} dead` : ''}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px 18px', flexWrap: 'wrap', marginTop: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
          {ev.segs.length} segment{ev.segs.length === 1 ? '' : 's'} per query
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: deadPct > 0 ? C.alert : C.dim }}>
          {deadPct}% of the index is deleted documents
        </span>
      </div>

      <div style={{ fontSize: 13, color: C.text, marginTop: 10, lineHeight: 1.55, minHeight: 66 }}>{ev.note}</div>
    </VizFrame>
  )
}

function dot(col: string) {
  return {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: 3,
    background: col,
  } as const
}
