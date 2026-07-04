import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'
import { fmtNum } from '../../ui/fmt'

/* TOY 12 — TTL & STAMPEDE: one hot key expires; every miss races the DB. */

const REQS = 10_000 // req/s for the one hot key
const DB_CAP = 1_000 // what the poor database can serve
const TTL_S = 6 // sim seconds per expiry
const RECOMPUTE_S = 0.8 // how long one recompute takes

export function TtlStampede({ onComplete }: { onComplete: () => void }) {
  const [dogpile, setDogpile] = useState(false)
  const [, force] = useState(0)
  const S = useRef({ age: 0, recomputing: 0, dbLoad: 0, spike: 0, stampedes: 0, sawIt: false, hist: [] as number[] })

  useRaf((dt) => {
    const s = S.current
    s.age += dt
    if (s.recomputing > 0) {
      s.recomputing -= dt
      // while the value is missing, misses go to the DB
      s.dbLoad = dogpile ? 1 : REQS // dogpile: ONE flier recomputes, others serve stale
      if (s.recomputing <= 0) {
        s.age = 0
        s.dbLoad = 0
      }
    } else if (s.age >= TTL_S) {
      s.recomputing = RECOMPUTE_S
      if (!dogpile) {
        s.stampedes += 1
        s.spike = REQS
        if (!s.sawIt) {
          s.sawIt = true
          onComplete()
        }
      }
    } else {
      s.dbLoad = 0
    }
    s.hist.push(Math.min(REQS, s.dbLoad))
    if (s.hist.length > 240) s.hist.shift()
    force((x) => x + 1)
  }, true)

  const s = S.current
  const expired = s.recomputing > 0
  const ttlFrac = expired ? 0 : 1 - s.age / TTL_S

  // sparkline of DB load
  const W = 560
  const H = 80
  const pts = s.hist.map((v, i) => `${(i / 239) * W},${H - 4 - (Math.log10(1 + v) / Math.log10(1 + REQS)) * (H - 10)}`)

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        One viral post, {fmtNum(REQS)} req/s, all served from a single cached key — the database naps at ~0. But the key has a
        TTL, and TTLs expire for everyone at the same instant. During the {RECOMPUTE_S * 1000} ms it takes to recompute, every
        request is a miss, and every miss goes hunting. The database can survive {fmtNum(DB_CAP)}/s. Watch the clock.
      </p>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0' }}>
        <button
          onClick={() => setDogpile(!dogpile)}
          className="mono"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            background: dogpile ? C.mem : C.panel,
            color: dogpile ? C.bg : C.dim,
            border: `1px solid ${dogpile ? C.mem : C.line}`,
          }}
        >
          dogpile lock: {dogpile ? 'ON — one flier recomputes, rest serve stale' : 'OFF — every miss charges the DB'}
        </button>
        <span className="mono" style={{ fontSize: 12.5, color: s.stampedes ? C.alert : C.faint }}>
          stampedes so far: {s.stampedes}
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <Bar
          label={expired ? (dogpile ? 'Hot key: EXPIRED — 1 request recomputing, others serve stale' : 'Hot key: EXPIRED — 10k misses in free fall') : 'Hot key TTL remaining'}
          u={expired ? 1 : ttlFrac}
          ch={expired ? (dogpile ? C.mem : C.alert) : C.mem}
          txt={expired ? 'MISS!' : `${(TTL_S * ttlFrac).toFixed(1)}s`}
        />
        <Bar
          label="Database load"
          u={s.dbLoad / DB_CAP}
          ch={C.storage}
          txt={s.dbLoad > DB_CAP ? `${fmtNum(s.dbLoad)}/s — ${Math.round(s.dbLoad / DB_CAP)}× capacity` : `${fmtNum(s.dbLoad)}/s`}
        />
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 6 }}>
          <line x1={0} y1={H - 4} x2={W} y2={H - 4} stroke={C.line} />
          {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={C.storage} strokeWidth={1.5} />}
          <text x={4} y={12} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            DB load over time (log scale) — the silence, then the cliff
          </text>
        </svg>
      </div>

      <Punchline color={C.mem}>
        The cache didn't fail — it succeeded so completely that the database never grew capacity for the truth: {fmtNum(REQS)}{' '}
        req/s were always coming, the cache just hid them. One expiry, and they all arrive in the same 800 ms — a{' '}
        {Math.round(REQS / DB_CAP)}× overload delivered by your own architecture. Defenses: a <b>dogpile lock</b> (one request
        recomputes, the rest serve stale — flip the toggle), TTL <b>jitter</b> so keys never expire in unison, and
        serve-stale-while-revalidate. This exact mechanism has taken down Facebook (memcache), Reddit, and most sites with a
        "cache warmup" war story.
      </Punchline>
    </div>
  )
}
