import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'
import { fmtNum } from '../../ui/fmt'

/* TOY 05 — HOT PARTITION: keys are hash buckets; watch "now" melt one node. */

const NPART = 8
const CAP_PER_PART = 1000 // writes/s per partition (numbers: partition-write-cap)

export function HotPartition({ onComplete }: { onComplete: () => void }) {
  const [writes, setWrites] = useState(6000)
  const [salted, setSalted] = useState(false)
  const [, force] = useState(0)
  const S = useRef({ hour: 10, hourT: 0, throttled: 0, sawThrottle: false })

  useRaf((dt) => {
    const s = S.current
    s.hourT += dt
    if (s.hourT > 5) {
      s.hourT = 0
      s.hour = (s.hour + 1) % 24 // the hot partition moves — pain on wheels
    }
    const perPart = salted ? writes / NPART : writes
    const over = Math.max(0, perPart - CAP_PER_PART) * (salted ? NPART : 1)
    s.throttled = over
    if (over > 0 && !salted && !s.sawThrottle) {
      s.sawThrottle = true
      onComplete()
    }
    force((x) => x + 1)
  }, true)

  const s = S.current
  const hot = s.hour % NPART
  const loads = Array.from({ length: NPART }, (_, i) => {
    if (salted) return writes / NPART
    return i === hot ? writes : i === (hot + NPART - 1) % NPART ? writes * 0.01 : 0
  })

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        A partitioned store (DynamoDB, Cassandra) is a hash function in front of {NPART} independent nodes, each good for ~
        {fmtNum(CAP_PER_PART)} writes/s. This table's partition key is <span className="mono">time_bucket</span> — the current
        hour. Every writer, right now, computes the <i>same key</i>. Watch which node does all the work — and watch the pain
        move when the hour rolls over.
      </p>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
            incoming writes: <b style={{ color: C.text }}>{fmtNum(writes)}/s</b>
          </div>
          <input type="range" min={1000} max={8000} step={500} value={writes} onChange={(e) => setWrites(+e.target.value)} aria-label="incoming writes per second" />
        </div>
        <button
          onClick={() => setSalted(!salted)}
          className="mono"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            background: salted ? C.mem : C.panel,
            color: salted ? C.bg : C.dim,
            border: `1px solid ${salted ? C.mem : C.line}`,
          }}
        >
          key: {salted ? 'time_bucket#shard_0..7 (salted)' : 'time_bucket (the hour)'}
        </button>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12.5, marginBottom: 12 }}>
          <span style={{ color: C.dim }}>
            wall clock: <b style={{ color: C.text }}>{String(s.hour).padStart(2, '0')}:{String(Math.floor((s.hourT / 5) * 60)).padStart(2, '0')}</b>
          </span>
          <span style={{ color: s.throttled > 0 ? C.alert : C.dim }}>
            throttled: <b>{fmtNum(s.throttled)}/s</b>
          </span>
          <span style={{ color: C.faint }}>cluster capacity: {fmtNum(NPART * CAP_PER_PART)}/s — on paper</span>
        </div>
        {loads.map((load, i) => (
          <Bar
            key={i}
            label={
              <span className="mono" style={{ fontSize: 11.5 }}>
                partition {String.fromCharCode(65 + i)}
                {!salted && i === hot ? ' — “hour ' + s.hour + '” lives here' : ''}
              </span>
            }
            u={load / CAP_PER_PART}
            ch={C.storage}
            txt={load / CAP_PER_PART >= 1 ? 'THROTTLING' : `${Math.round((load / CAP_PER_PART) * 100)}%`}
          />
        ))}
      </div>

      <Punchline color={C.storage}>
        The cluster advertises {fmtNum(NPART * CAP_PER_PART)} writes/s and delivers ~{fmtNum(CAP_PER_PART)}, because capacity is
        per <i>partition</i> and your key sends everyone to one of them — a number straight from DynamoDB's manual (~1k write
        units per partition). Any key derived from "now", "today", or a viral ID builds this trap. The fix costs one line:{' '}
        <b>salt the key</b> (<span className="mono">bucket#0..7</span>) and fan-in on read — flip the toggle and watch{' '}
        {NPART}× headroom appear from the same hardware.
      </Punchline>
    </div>
  )
}
