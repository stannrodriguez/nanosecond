import { useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Term as T } from '../../ui/Term'

/* TOY 18 — FALSE SHARING: adding a thread made it SLOWER. Two cores writing two
   different variables that happen to share one 64-byte cache line fight over
   the line (coherence ping-pong). Pad them apart and parallelism returns. The
   fine print the cache line (toy 13) and the multicore turn (toy 15) hide. */

const MAXC = 8
// One core: no contention, so both start at 1.0. Padded then scales linearly;
// the shared line serializes through coherence and each added core makes it a
// little WORSE — the "added a thread, got slower" signature.
const throughput = (cores: number, shared: boolean): number => {
  if (!shared) return cores // one unit of work per core, no interference
  return Math.max(0.6, 1 - (cores - 1) * 0.05) // coherence ping-pong: declines as cores pile on
}

const W = 520
const H = 180
const PADL = 40
const PADB = 26
const cx = (c: number) => PADL + ((c - 1) / (MAXC - 1)) * (W - PADL - 12)
const cy = (t: number) => H - PADB - (Math.min(t, MAXC) / MAXC) * (H - PADB - 14)

export function FalseSharing({ onComplete }: { onComplete: () => void }) {
  const [cores, setCores] = useState(1)
  const [shared, setShared] = useState(true)
  const [seenPadded, setSeenPadded] = useState(false)

  const setPadding = (s: boolean) => {
    setShared(s)
    if (!s && !seenPadded) {
      setSeenPadded(true)
      onComplete()
    }
  }

  const t = throughput(cores, shared)
  const speedup = t.toFixed(1)
  const line = (s: boolean) => Array.from({ length: MAXC }, (_, i) => `${cx(i + 1).toFixed(1)},${cy(throughput(i + 1, s)).toFixed(1)}`).join(' ')

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Two cores, two <i>different</i> counters — pure parallel work, no shared data. Except the counters sit in the same
        64-byte <T k="cacheline">cache line</T>, and cores trade a whole line at a time. Each write yanks the line away from the
        other core (coherence ping-pong), so adding cores makes it <b>slower</b>. Pad them onto separate lines
        and watch parallelism come back.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        {[
          [true, 'same cache line'],
          [false, 'padded apart'],
        ].map(([s, label]) => (
          <button
            key={String(s)}
            onClick={() => setPadding(s as boolean)}
            className="mono"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: shared === s ? (s ? C.alert : C.ok) : C.panelUp,
              color: shared === s ? C.bg : C.dim,
              border: `1px solid ${shared === s ? (s ? C.alert : C.ok) : C.line}`,
            }}
          >
            {label as string}
          </button>
        ))}
        <span className="mono" style={{ fontSize: 12.5, color: C.dim, alignSelf: 'center' }}>
          {cores} core{cores > 1 ? 's' : ''} → <b style={{ color: shared ? C.alert : C.ok, fontSize: 16 }}>{speedup}×</b> throughput
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
          cores: <b style={{ color: C.text }}>{cores}</b>
        </div>
        <input type="range" min={1} max={MAXC} step={1} value={cores} onChange={(e) => setCores(+e.target.value)} aria-label="number of cores" />

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 12 }} role="img" aria-label="throughput vs cores">
          <line x1={PADL} y1={H - PADB} x2={W - 12} y2={H - PADB} stroke={C.line} />
          <line x1={PADL} y1={14} x2={PADL} y2={H - PADB} stroke={C.line} />
          {/* ideal (linear) reference and the two measured curves */}
          <polyline points={line(false)} fill="none" stroke={C.ok} strokeWidth={shared ? 1.5 : 3} opacity={shared ? 0.4 : 1} />
          <polyline points={line(true)} fill="none" stroke={C.alert} strokeWidth={shared ? 3 : 1.5} opacity={shared ? 1 : 0.4} />
          <circle cx={cx(cores)} cy={cy(t)} r={6} fill={shared ? C.alert : C.ok} stroke={C.bg} strokeWidth={1.5} />
          <text x={W - 12} y={cy(throughput(MAXC, false)) - 4} textAnchor="end" fill={C.ok} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            padded: scales
          </text>
          <text x={W - 12} y={cy(throughput(MAXC, true)) - 6} textAnchor="end" fill={C.alert} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            shared line: stalls
          </text>
          <text x={PADL} y={H - 8} fill={C.faint} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
            cores → · throughput
          </text>
        </svg>
      </div>

      <Punchline color={C.compute}>
        Nothing was actually shared — two cores, two separate variables — yet more cores bought <i>less</i> work, because
        "different variables" is not the same as "different <b>cache lines</b>." Cores swap memory 64 bytes at a time, so two
        hot counters in one line serialize through the coherence protocol. One line of padding (or per-core state) restores the
        parallelism the multicore turn promised. This is the ghost behind countless "why doesn't this scale?" mysteries.
      </Punchline>
    </div>
  )
}
