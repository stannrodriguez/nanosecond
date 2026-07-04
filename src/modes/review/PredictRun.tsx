import { useEffect, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Panel, Button, Chip } from '../../ui/kit'
import { fmtNum } from '../../ui/fmt'
import { CAP } from '../../engine/capacity'
import { PREDICT_ROUNDS, type PredictRound } from '../../content/predict'
import { useScars } from '../../state/scars'
import { useJudgment } from '../../state/judgment'

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

/** Confidence-interval score: reward a bracket that contains the truth AND is
 *  tight. A mile-wide "can't be wrong" interval is worth little; a miss is 0. */
export function ciScore(lo: number, hi: number, ans: number): number {
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  if (ans < a || ans > b || a <= 0) return 0
  const width = Math.log10(b / a)
  return width <= 0.3 ? 100 : width <= 0.6 ? 60 : 30
}

export function PredictRun({ onScore }: { onScore: (n: number) => void }) {
  const addScar = useScars((s) => s.addScar)
  const record = useJudgment((s) => s.record)
  const [ri, setRi] = useState(0)
  const [q1, setQ1] = useState<number | null>(null)
  const [pos, setPos] = useState(500)
  const [posLo, setPosLo] = useState(300)
  const [posHi, setPosHi] = useState(700)
  const [phase, setPhase] = useState<'predict' | 'run' | 'done'>('predict')
  const [t, setT] = useState(0)
  const r = PREDICT_ROUNDS[ri]
  const guess = sliderVal(pos, r.q2.lo, r.q2.hi)
  const ciLo = Math.min(sliderVal(posLo, r.q2.lo, r.q2.hi), sliderVal(posHi, r.q2.lo, r.q2.hi))
  const ciHi = Math.max(sliderVal(posLo, r.q2.lo, r.q2.hi), sliderVal(posHi, r.q2.lo, r.q2.hi))

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
  const q2Pts = r.ci
    ? ciScore(ciLo, ciHi, r.q2.ans)
    : (() => {
        const errLog = Math.abs(Math.log10(guess) - Math.log10(r.q2.ans))
        return errLog <= 0.08 ? 100 : errLog <= 0.2 ? 60 : 0
      })()
  const contained = r.q2.ans >= ciLo && r.q2.ans <= ciHi

  const lock = () => {
    setT(0)
    setPhase('run')
    const total = (q1Right ? 100 : 0) + q2Pts
    onScore(total)
    record('predict', total, 200)
    if (!q1Right)
      addScar({
        mode: 'predict',
        theme: 'bottleneck arithmetic',
        what: r.q1.opts[q1!],
        truth: r.q1.opts[firstIdx],
        lesson: r.lesson.split('. ')[0] + '.',
      })
    if (q2Pts === 0)
      addScar({
        mode: 'predict',
        theme: r.ci ? 'calibration (confidence intervals)' : 'error-onset forecasting',
        what: r.ci ? `[${fmtNum(ciLo)}, ${fmtNum(ciHi)}]` : `${fmtNum(guess)} req/s`,
        truth: `${fmtNum(r.q2.ans)} req/s`,
        lesson: r.lesson.split('. ')[0] + '.',
      })
  }
  const next = () => {
    setRi((ri + 1) % PREDICT_ROUNDS.length)
    setQ1(null)
    setPos(500)
    setPosLo(300)
    setPosHi(700)
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
      <Panel style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</div>
          <div className="mono" style={{ fontSize: 10.5, color: C.dim }}>
            round {ri + 1}/{PREDICT_ROUNDS.length}
            {r.ci && <span style={{ color: C.net }}> · confidence-interval round</span>}
          </div>
        </div>
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
                <Chip key={o} active={q1 === i} onClick={() => setQ1(i)} mono={false} style={{ padding: '8px 14px', fontSize: 13 }}>
                  {o}
                </Chip>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 14, fontWeight: 600 }}>{r.q2.prompt}</div>
            {r.ci ? (
              <>
                <div className="mono" style={{ textAlign: 'center', fontSize: 22, fontWeight: 600, color: C.net, margin: '6px 0' }}>
                  {fmtNum(ciLo)} – {fmtNum(ciHi)} <span style={{ fontSize: 13, color: C.dim }}>req/s</span>
                </div>
                <label className="mono" style={{ fontSize: 10.5, color: C.faint }}>lower bound</label>
                <input type="range" min={0} max={1000} value={posLo} onChange={(e) => setPosLo(+e.target.value)} aria-label="lower bound" />
                <label className="mono" style={{ fontSize: 10.5, color: C.faint }}>upper bound</label>
                <input type="range" min={0} max={1000} value={posHi} onChange={(e) => setPosHi(+e.target.value)} aria-label="upper bound" />
                <div className="mono" style={{ fontSize: 10.5, color: C.dim, marginTop: 4 }}>
                  Narrow if you're sure, wide if you're not — but a bracket that misses the truth scores zero.
                </div>
              </>
            ) : (
              <>
                <div className="mono" style={{ textAlign: 'center', fontSize: 24, fontWeight: 600, color: C.net, margin: '6px 0' }}>
                  {fmtNum(guess)} <span style={{ fontSize: 13, color: C.dim }}>req/s</span>
                </div>
                <input type="range" min={0} max={1000} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="error onset forecast" />
              </>
            )}
            <Button variant="danger" full disabled={q1 === null} onClick={lock} style={{ marginTop: 16 }}>
              Commit predictions — run it
            </Button>
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
            {r.ci ? (
              <div className="mono" style={{ fontSize: 13, marginBottom: 10, color: q2Pts >= 60 ? C.ok : C.alert }}>
                {contained ? '✓' : '✗'} Errors begin ≈ <b>{fmtNum(r.q2.ans)}/s</b> — your bracket {fmtNum(ciLo)}–{fmtNum(ciHi)}{' '}
                {contained ? (q2Pts === 100 ? 'brackets it, tightly' : 'brackets it, but wide') : 'missed it'} ({q2Pts} pts)
              </div>
            ) : (
              <div className="mono" style={{ fontSize: 13, marginBottom: 10, color: q2Pts >= 60 ? C.ok : C.alert }}>
                {q2Pts >= 60 ? '✓' : '✗'} Errors begin ≈ <b>{fmtNum(r.q2.ans)}/s</b> — you predicted {fmtNum(guess)}/s{' '}
                {q2Pts === 100 ? '(dead on)' : q2Pts === 60 ? '(close)' : ''}
              </div>
            )}
            <div style={{ fontSize: 13.5, lineHeight: 1.6, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px' }}>
              {r.lesson}
            </div>
            <Button onClick={next} style={{ marginTop: 12 }}>
              {ri === PREDICT_ROUNDS.length - 1 ? 'Round 1 again (beat your score)' : 'Next round →'}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
