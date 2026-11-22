import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Button, Chip } from '../../ui/kit'
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
        A strongly consistent write is not finished the moment the leader accepts it. A <b>majority</b> has to agree first so a
        crash or network split cannot roll it back. Even on the happy path, agreement takes two round trips:{' '}
        <i>propose → acks</i>, then <i>commit → acks</i>. The protocol never changes. Pick where the replicas live and watch
        distance set the bill.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        {PLACES.map((p, i) => (
          <Chip
            key={p.name}
            active={i === placeIdx}
            onClick={() => {
              setPlaceIdx(i)
              setPhase('idle')
              setT(0)
            }}
          >
            {p.name}
          </Chip>
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
            round 1 · propose {place.note && `(${place.note})`}
          </span>
          <span className="mono" style={{ position: 'absolute', left: 60, bottom: 0, fontSize: 11, color: leg >= 2 ? C.mem : C.faint }}>
            round 2 · commit
          </span>
        </div>
        <div className="mono" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, marginTop: 8, alignItems: 'baseline' }}>
          <Button size="sm" disabled={phase === 'running'} onClick={run} style={{ padding: '9px 18px', fontSize: 13 }}>
            {phase === 'running' ? 'agreeing…' : 'Commit one write'}
          </Button>
          <span style={{ color: C.dim }}>
            write latency: <b style={{ color: phase === 'done' ? (totalMs > 50 ? C.alert : C.ok) : C.text, fontSize: 16 }}>{phase === 'done' ? `${totalMs.toFixed(totalMs < 10 ? 1 : 0)} ms` : '...'}</b>
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
        One protocol, four very different latencies: 0.2 ms inside a rack, ~1 ms across a datacenter, <b>141 ms</b> coast to
        coast across the US, and ~301 ms across a global quorum. Agreement is round trips, and round trips are just geography.
        That is the real price tag behind every consistency debate: Spanner uses atomic clocks to shave rounds, most systems
        sidestep it with async replication, leader-local reads, or eventual consistency, and saying "we need global strong
        consistency" writes a 300 ms check on every write.
      </Punchline>
    </div>
  )
}
