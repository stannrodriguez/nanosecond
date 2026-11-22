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
        A database cannot hand out a connection to every user. Each open connection claims memory and scheduling overhead, and
        Postgres starts wilting past a few hundred. Instead, app threads check out a connection from a pool of <b>{POOL}</b>,
        hold it for ~{QUERY_MS} ms while a query runs, and hand it back. That turns the pool itself into a <i>server</i> capped
        at {fmtNum(POOL_QPS)} queries/s, complete with its own knee. Grow the app fleet and watch where it bends.
      </p>
      <div style={{ margin: '14px 0' }}>
        <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
          app threads hitting the database: <b style={{ color: C.text }}>{fmtNum(clients)}</b>
          <span style={{ color: C.faint }}> (~2 queries/s each → {fmtNum(demand)} qps total)</span>
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
            wait for a free connection:{' '}
            <b style={{ color: waitMs > 50 ? C.alert : waitMs > 15 ? C.compute : C.ok, fontSize: 16 }}>{waitMs.toFixed(0)} ms</b>
          </span>
          <span style={{ color: C.faint }}>query itself: {QUERY_MS} ms (waiting can dwarf the work)</span>
        </div>
      </div>

      <Punchline color={C.compute}>
        A connection pool is a queue in disguise: the exact same 1/(1−u) curve from THE QUEUE, tucked inside your "get
        connection" call. Past the {fmtNum(POOL_QPS)} qps ceiling, 10k eager threads do not buy you a faster database. They buy
        you a crowded lobby where p99 spikes while the database metrics still look calm and underutilized. That is why poolers
        like PgBouncer exist, why serverless functions (spinning up 10k cold connections with no shared pool) famously melt
        Postgres, and why scaling out app servers can make an overloaded system <i>slower</i>.
      </Punchline>
    </div>
  )
}
