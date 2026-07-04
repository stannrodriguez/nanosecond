import { useEffect, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { fmtNum } from '../../ui/fmt'
import { CAP } from '../../engine/capacity'
import { PREDICT_ROUNDS, type PredictRound } from '../../content/predict'

const TICKS = 22

function sliderVal(pos: number, lo: number, hi: number): number {
  return Math.round((lo + (pos / 1000) * (hi - lo)) / 500) * 500
}

// Tier utilizations for a given total rps, straight from engine constants.
function tiersAt(r: PredictRound, rps: number) {
  const reads = rps * r.readPct
  const writes = rps * (1 - r.readPct)
  const misses = reads * (1 - r.cacheHit)
  return [
    { label: 'App servers', u: rps / (r.app * CAP.app.rps), col: C.compute },
    { label: 'Cache', u: reads / (r.cacheNodes * CAP.cache.ops), col: C.mem },
    { label: 'Read replicas', u: misses / (r.replicas * CAP.replica.reads), col: C.storage },
    { label: 'DB primary (writes)', u: writes / (r.shards * CAP.db.writes), col: C.storage },
  ]
}

/** Index of the tier that crosses 80% first as traffic ramps. */
export function firstPast80(r: PredictRound): number {
  const perRps = tiersAt(r, 1)
  const rpsAt80 = perRps.map((b, i) => ({ i, at: 0.8 / (b.u || 1e-9) }))
  return rpsAt80.sort((a, b) => a.at - b.at)[0].i
}

export function PredictRun({ onScore }: { onScore: (n: number) => void }) {
  const [ri, setRi] = useState(0)
  const [q1, setQ1] = useState<number | null>(null)
  const [pos, setPos] = useState(500)
  const [phase, setPhase] = useState<'predict' | 'run' | 'done'>('predict')
  const [t, setT] = useState(0)
  const r = PREDICT_ROUNDS[ri]
  const guess = sliderVal(pos, r.q2.lo, r.q2.hi)

  useEffect(() => {
    if (phase !== 'run') return
    if (t > TICKS) {
      setPhase('done')
      return
    }
    const id = setTimeout(() => setT(t + 1), 170)
    return () => clearTimeout(id)
  }, [phase, t])

  const rpsNow = r.peak * Math.min(1, t / (TICKS - 4))
  const bars = tiersAt(r, rpsNow)
  const firstIdx = firstPast80(r)
  const q1Right = q1 === r.q1.ans
  const errLog = Math.abs(Math.log10(guess) - Math.log10(r.q2.ans))
  const q2Pts = errLog <= 0.08 ? 100 : errLog <= 0.2 ? 60 : 0

  const lock = () => {
    setT(0)
    setPhase('run')
    onScore((q1Right ? 100 : 0) + q2Pts)
  }
  const next = () => {
    setRi((ri + 1) % PREDICT_ROUNDS.length)
    setQ1(null)
    setPos(500)
    setPhase('predict')
    setT(0)
  }

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55 }}>
        Watching a simulation teaches a little. <b style={{ color: C.text }}>Forecasting one, then being wrong in public,</b>{' '}
        teaches a lot — it's also literally what an interviewer asks: “where does this break first?” Commit before you see
        anything.
      </p>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</div>
        <div className="mono" style={{ fontSize: 11.5, color: C.dim, marginTop: 6, lineHeight: 1.6 }}>
          STACK · {r.stack}
          <br />
          TRAFFIC · {r.traffic}
        </div>

        {phase === 'predict' && (
          <>
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600 }}>{r.q1.prompt}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {r.q1.opts.map((o, i) => (
                <button
                  key={o}
                  onClick={() => setQ1(i)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    background: q1 === i ? C.net : C.bg,
                    color: q1 === i ? C.bg : C.dim,
                    border: `1px solid ${q1 === i ? C.net : C.line}`,
                    fontWeight: 600,
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 14, fontWeight: 600 }}>{r.q2.prompt}</div>
            <div className="mono" style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, color: C.net, margin: '6px 0' }}>
              {fmtNum(guess)} <span style={{ fontSize: 13, color: C.dim }}>req/s</span>
            </div>
            <input type="range" min={0} max={1000} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="error onset forecast" />
            <button
              onClick={lock}
              disabled={q1 === null}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '12px 0',
                background: q1 !== null ? C.alert : C.line,
                color: q1 !== null ? '#fff' : C.faint,
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: q1 !== null ? 'pointer' : 'default',
              }}
            >
              Commit predictions — run it
            </button>
          </>
        )}

        {(phase === 'run' || phase === 'done') && (
          <div style={{ marginTop: 16 }}>
            <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 10 }}>
              traffic: <b style={{ color: C.text }}>{fmtNum(rpsNow)}/s</b>
            </div>
            {bars.map((b) => (
              <Bar key={b.label} label={b.label} u={b.u} ch={b.col} />
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            <div className="mono" style={{ fontSize: 13, marginBottom: 4, color: q1Right ? C.ok : C.alert }}>
              {q1Right ? '✓' : '✗'} First past 80%: <b>{r.q1.opts[firstIdx]}</b>{' '}
              {q1Right ? '— you called it' : `(you said ${r.q1.opts[q1!]})`}
            </div>
            <div className="mono" style={{ fontSize: 13, marginBottom: 10, color: q2Pts >= 60 ? C.ok : C.alert }}>
              {q2Pts >= 60 ? '✓' : '✗'} Errors begin ≈ <b>{fmtNum(r.q2.ans)}/s</b> — you predicted {fmtNum(guess)}/s{' '}
              {q2Pts === 100 ? '(dead on)' : q2Pts === 60 ? '(close)' : ''}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px' }}>
              {r.lesson}
            </div>
            <button
              onClick={next}
              style={{
                marginTop: 12,
                padding: '10px 22px',
                background: C.net,
                color: C.bg,
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {ri === PREDICT_ROUNDS.length - 1 ? 'Round 1 again (beat your score)' : 'Next round →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
