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
        The primary commits writes and streams them to a replica that can apply roughly {fmtNum(APPLY_CAP)}/s. Stay under that
        ceiling and the copy trails by only milliseconds. Push past it and the unapplied backlog, the <b>lag</b>, starts climbing
        with no limit, pulling the replica deeper into the past every second. Push the slider past the limit, then run the check
        every user runs by instinct.
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
            Post a comment → refresh the page (read hits the replica)
          </button>
          {readMsg && (
            <div className="mono" style={{ marginTop: 10, fontSize: 13, color: readMsg.found ? C.ok : C.alert }}>
              {readMsg.found
                ? '✓ Comment found. The stream kept up before your refresh landed.'
                : `✗ Comment missing! It is safe on the primary, but this replica is still ${(readMsg.lagMs / 1000).toFixed(1)}s in the past.`}
            </div>
          )}
        </div>
      </div>

      <Punchline color={C.storage}>
        Replication lag is a queue, so it obeys queue math: barely noticeable at 60% utilization, runaway past 100%. That is the
        fine print on "just add replicas." Every read from a replica looks at <i>the recent past</i>, and the staleness users
        spot immediately is their own missing write. The practical fix is read-your-own-writes routing: send a user's reads to
        the primary for a few seconds right after they write, rather than forcing strong consistency everywhere and giving up the
        read scaling you added replicas for.
      </Punchline>
    </div>
  )
}
