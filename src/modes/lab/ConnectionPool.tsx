import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'
import { fmtNum } from '../../ui/fmt'

/* TOY 10 — CONNECTION POOL: 100 connections vs 10,000 clients. */

const POOL = 100
const QUERY_MS = 5 // per query holding a connection
const POOL_QPS = POOL * (1000 / QUERY_MS) // 20k queries/s ceiling

export function ConnectionPool({ onComplete }: { onComplete: () => void }) {
  const [clients, setClients] = useState(2000)
  const [, force] = useState(0)
  const seen = useRef(false)

  const demand = clients * 2 // each app thread fires ~2 queries/s
  const u = demand / POOL_QPS
  const waitMs = (u >= 0.995 ? 200 : u / (1 - u)) * QUERY_MS
  const active = Math.min(POOL, Math.round(u * POOL))

  useRaf(() => {
    if (u >= 0.9 && !seen.current) {
      seen.current = true
      onComplete()
    }
    force((x) => x + 1)
  }, true)

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        The database can't afford a connection per user — each one costs it real memory and scheduling (Postgres wilts past a
        few hundred). So every app thread borrows from a pool of <b>{POOL}</b> connections, holds one for ~{QUERY_MS} ms per
        query, and returns it. That makes the pool a <i>server</i> with capacity {fmtNum(POOL_QPS)} queries/s — and every
        server has a knee. Scale the client fleet and find it.
      </p>
      <div style={{ margin: '14px 0' }}>
        <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
          app threads wanting the database: <b style={{ color: C.text }}>{fmtNum(clients)}</b>
          <span style={{ color: C.faint }}> (~2 queries/s each → {fmtNum(demand)} qps of demand)</span>
        </div>
        <input type="range" min={500} max={10000} step={250} value={clients} onChange={(e) => setClients(+e.target.value)} aria-label="number of app threads" />
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: 3, marginBottom: 12 }}>
          {Array.from({ length: POOL }, (_, i) => (
            <div key={i} style={{ height: 10, borderRadius: 2, background: i < active ? C.compute : C.panelUp, border: `1px solid ${i < active ? C.compute : C.line}` }} />
          ))}
        </div>
        <Bar label={`Pool utilization (${active}/${POOL} connections busy)`} u={u} ch={C.compute} note={`${fmtNum(demand)} qps demand vs ${fmtNum(POOL_QPS)} qps pool ceiling`} />
        <div className="mono" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, marginTop: 8 }}>
          <span style={{ color: C.dim }}>
            time a thread waits for a connection:{' '}
            <b style={{ color: waitMs > 50 ? C.alert : waitMs > 15 ? C.compute : C.ok, fontSize: 16 }}>{waitMs.toFixed(0)} ms</b>
          </span>
          <span style={{ color: C.faint }}>query itself: {QUERY_MS} ms — the wait can dwarf the work</span>
        </div>
      </div>

      <Punchline color={C.compute}>
        The pool is a queue wearing a trench coat: same 1/(1−u) curve as THE QUEUE, hiding inside "get connection". At{' '}
        {fmtNum(POOL_QPS)} qps of ceiling, 10k eager threads don't get a bigger database — they get a waiting room, and p99
        explodes while the database itself reports "everything's fine, I'm barely working". This is why PgBouncer exists, why
        serverless functions (10k cold connections, no pool) famously melt Postgres, and why "add more app servers" can make an
        overloaded system <i>slower</i>.
      </Punchline>
    </div>
  )
}
