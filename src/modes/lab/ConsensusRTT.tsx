import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'

/* TOY 08 — CONSENSUS ROUND-TRIPS: agreement is round trips × distance. */

const PLACES = [
  { name: 'same rack', rttMs: 0.1, note: 'one switch hop' },
  { name: 'same datacenter', rttMs: 0.5, note: 'across the building' },
  { name: 'cross-region (US E↔W)', rttMs: 70, note: '4,700 km of fiber' },
  { name: 'intercontinental quorum', rttMs: 150, note: 'US ↔ EU ↔ APAC majority' },
]
const ROUNDS = 2 // propose+ack, commit+ack — the classic happy path

export function ConsensusRTT({ onComplete }: { onComplete: () => void }) {
  const [placeIdx, setPlaceIdx] = useState(1)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [t, setT] = useState(0) // 0..1 animation progress
  const place = PLACES[placeIdx]
  const totalMs = ROUNDS * place.rttMs + 1 // +1ms leader fsync
  const seenSlow = useRef(false)

  // animation duration scales with log of real time so every run is watchable
  const DUR = 1.6 + Math.log10(Math.max(1, totalMs)) * 0.9

  useRaf(
    (dt) => {
      setT((prev) => {
        const next = prev + dt / DUR
        if (next >= 1) {
          setPhase('done')
          return 1
        }
        return next
      })
    },
    phase === 'running',
  )

  useEffect(() => {
    if (phase === 'done' && placeIdx >= 2 && !seenSlow.current) {
      seenSlow.current = true
      onComplete()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    setT(0)
    setPhase('running')
  }

  // pulse position: two round trips = 4 legs
  const leg = Math.min(3, Math.floor(t * 4))
  const legT = t * 4 - leg
  const x = leg % 2 === 0 ? legT : 1 - legT // out, back, out, back

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        A strongly-consistent write isn't done when the leader has it — a <b>majority</b> must confirm, so no crash or network
        split can un-happen it. The happy path costs two round trips: <i>propose → acks</i>, <i>commit → acks</i>. The protocol
        is identical everywhere. The only variable is where the replicas live.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        {PLACES.map((p, i) => (
          <button
            key={p.name}
            onClick={() => { setPlaceIdx(i); setPhase('idle'); setT(0) }}
            className="mono"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: i === placeIdx ? C.net : C.panel,
              color: i === placeIdx ? C.bg : C.dim,
              border: `1px solid ${i === placeIdx ? C.net : C.line}`,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div style={{ position: 'relative', height: 90 }}>
          {/* leader and quorum nodes */}
          <div className="mono" style={{ position: 'absolute', left: 0, top: 28, textAlign: 'center', fontSize: 11, color: C.compute }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.panelUp, border: `2px solid ${C.compute}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>L</div>
            leader
          </div>
          <div className="mono" style={{ position: 'absolute', right: 0, top: 28, textAlign: 'center', fontSize: 11, color: C.storage }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.panelUp, border: `2px solid ${C.storage}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>Q</div>
            majority
          </div>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 48, height: 2, background: C.line }} />
          {phase !== 'idle' && (
            <div
              style={{
                position: 'absolute',
                left: `calc(${8 + x * 84}% - 6px)`,
                top: 42,
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: `0 0 14px 4px ${leg < 2 ? C.net : C.mem}`,
              }}
            />
          )}
          <span className="mono" style={{ position: 'absolute', left: 60, top: 8, fontSize: 11, color: leg < 2 ? C.net : C.faint }}>
            round 1 · propose {place.note && `— ${place.note}`}
          </span>
          <span className="mono" style={{ position: 'absolute', left: 60, bottom: 0, fontSize: 11, color: leg >= 2 ? C.mem : C.faint }}>
            round 2 · commit
          </span>
        </div>
        <div className="mono" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, marginTop: 8, alignItems: 'baseline' }}>
          <button
            onClick={run}
            disabled={phase === 'running'}
            style={{ padding: '9px 18px', borderRadius: 8, background: phase === 'running' ? C.line : C.net, color: phase === 'running' ? C.dim : C.bg, border: 'none', fontWeight: 700, fontSize: 13, cursor: phase === 'running' ? 'default' : 'pointer' }}
          >
            {phase === 'running' ? 'agreeing…' : 'Commit one write'}
          </button>
          <span style={{ color: C.dim }}>
            write latency: <b style={{ color: phase === 'done' ? (totalMs > 50 ? C.alert : C.ok) : C.text, fontSize: 16 }}>{phase === 'done' ? `${totalMs.toFixed(totalMs < 10 ? 1 : 0)} ms` : '—'}</b>
            <span style={{ color: C.faint }}> = {ROUNDS} × {place.rttMs} ms RTT + 1 ms fsync</span>
          </span>
          {phase === 'done' && (
            <span style={{ color: C.dim }}>
              max sequential writes: <b style={{ color: C.compute }}>{Math.round(1000 / totalMs).toLocaleString()}/s</b>
            </span>
          )}
        </div>
      </div>

      <Punchline color={C.net}>
        Same protocol, four answers: 0.2 ms in a rack, ~1 ms in a datacenter, <b>141 ms</b> across the US, ~301 ms on a global
        quorum — agreement is round trips, and round trips are geography. This is the entire price list behind consistency
        debates: Spanner pays it with atomic clocks to shave rounds, most systems dodge it (async replication, leader-local
        reads, eventual consistency), and "we need global strong consistency" is a sentence that costs 300 ms every time it's
        true.
      </Punchline>
    </div>
  )
}
