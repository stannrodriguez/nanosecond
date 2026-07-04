import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'
import { fmtNum } from '../../ui/fmt'

/* TOY 06 — REPLICATION LAG: the replica is a photograph of the recent past. */

const APPLY_CAP = 8000 // replica apply rate, writes/s (pg-writes)

export function ReplicationLag({ onComplete }: { onComplete: () => void }) {
  const [writes, setWrites] = useState(5000)
  const [readMsg, setReadMsg] = useState<null | { found: boolean; lagMs: number }>(null)
  const [, force] = useState(0)
  const S = useRef({ lag: 0 })

  useRaf((dt) => {
    const s = S.current
    s.lag = Math.max(0, s.lag + (writes - APPLY_CAP) * dt)
    force((x) => x + 1)
  }, true)

  const lag = S.current.lag
  const lagMs = (lag / APPLY_CAP) * 1000
  const u = writes / APPLY_CAP

  const readYourWrite = () => {
    const found = lagMs < 300 // your comment replicated before you refreshed
    setReadMsg({ found, lagMs })
    if (!found) onComplete()
  }

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        The primary commits writes and streams them to a replica, which can apply about {fmtNum(APPLY_CAP)}/s. Below that rate
        the copy trails by milliseconds. Push past it and the un-applied backlog — the <b>lag</b> — grows without bound: the
        replica is falling into the past in real time. Then try the one experiment users always run for you.
      </p>
      <div style={{ margin: '14px 0' }}>
        <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
          write rate at the primary: <b style={{ color: u >= 1 ? C.alert : C.text }}>{fmtNum(writes)}/s</b>
        </div>
        <input type="range" min={1000} max={15000} step={250} value={writes} onChange={(e) => setWrites(+e.target.value)} aria-label="write rate at the primary" />
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <Bar label="Primary (commits immediately)" u={Math.min(1.5, writes / 10000)} ch={C.storage} note={`${fmtNum(writes)} writes/s in`} />
        <Bar
          label="Replica apply stream"
          u={u}
          ch={C.storage}
          txt={u >= 1 ? 'FALLING BEHIND' : `${Math.round(u * 100)}%`}
          note={`applies ${fmtNum(Math.min(writes, APPLY_CAP))}/s of ${fmtNum(APPLY_CAP)}/s max`}
        />
        <div className="mono" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, marginTop: 10 }}>
          <span style={{ color: C.dim }}>
            lag: <b style={{ color: lagMs > 500 ? C.alert : lagMs > 100 ? C.compute : C.ok }}>{lag < 1 ? '0' : fmtNum(lag)} events</b>
          </span>
          <span style={{ color: C.dim }}>
            the replica's "now" is <b style={{ color: lagMs > 500 ? C.alert : C.text }}>{(lagMs / 1000).toFixed(1)}s</b> ago
          </span>
        </div>

        <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <button
            onClick={readYourWrite}
            style={{ padding: '10px 18px', borderRadius: 8, background: C.net, color: C.bg, border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
          >
            Post a comment → refresh the page (reads hit the replica)
          </button>
          {readMsg && (
            <div className="mono" style={{ marginTop: 10, fontSize: 13, color: readMsg.found ? C.ok : C.alert }}>
              {readMsg.found
                ? '✓ your comment is there — the stream kept up (lag under your refresh reflex)'
                : `✗ YOUR COMMENT VANISHED — it exists on the primary, but this replica is ${(readMsg.lagMs / 1000).toFixed(1)}s in the past`}
            </div>
          )}
        </div>
      </div>

      <Punchline color={C.storage}>
        Lag is a queue, so it obeys queue math: harmless at 60% utilization, unbounded past 100%. That's the fine print on
        "just add replicas" — every replica read is a read of <i>the recent past</i>, and the one staleness users always catch
        is their own missing write. Real fix: route a user's reads to the primary for a few seconds after they write
        (read-your-own-writes routing) — not "make everything strongly consistent," which would throw away the replica's whole
        point.
      </Punchline>
    </div>
  )
}
