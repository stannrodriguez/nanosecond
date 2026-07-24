import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { C } from '../../theme'
import { GhostButton, useHover } from '../../ui/kit'
import { fmtNum } from '../../ui/fmt'
import { DRILLS, DRILL_CATEGORIES, type DrillCategory } from '../../content/drills'
import { NUMBERS } from '../../content/numbers'
import { buildSession, useDrillProgress, BOX_INTERVAL_DAYS } from '../../state/drillProgress'
import { useScars } from '../../state/scars'

// The calm verdict (display only): a three-tier read on the log error. Scoring
// (points, scars, stats) still runs off gradeGuess.
function drillVerdict(err: number): { text: string; col: string } {
  if (err <= 0.2) return { text: '✓ DEAD ON', col: C.ok }
  if (err <= 1) return { text: '✓ WITHIN AN ORDER OF MAGNITUDE', col: C.ok }
  const n = Math.round(err)
  return { text: `✗ OFF BY ${n} ORDER${n === 1 ? '' : 'S'} OF MAGNITUDE`, col: C.alert }
}

// The primary CTA lifts on hover (Lock it in).
function LockButton({ onClick }: { onClick: () => void }) {
  const [h, bind] = useHover()
  return (
    <button
      onClick={onClick}
      {...bind}
      style={{
        width: '100%',
        marginTop: 20,
        background: C.net,
        color: C.bg,
        border: `1px solid ${C.net}`,
        borderRadius: 8,
        padding: 12,
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'transform .15s, box-shadow .15s',
        transform: h ? 'translateY(-1px)' : 'none',
        boxShadow: h ? `0 6px 18px ${C.net}33` : 'none',
      }}
    >
      Lock it in
    </button>
  )
}

// A quiet mono link (calibration), matching the Library's Ladder link.
function QuietLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [h, bind] = useHover()
  return (
    <button
      onClick={onClick}
      {...bind}
      className="mono"
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        marginTop: 40,
        cursor: 'pointer',
        fontSize: 12,
        color: h ? C.net : C.dim,
        transition: 'color .15s',
      }}
    >
      {children}
    </button>
  )
}

// Log-scale slider → value with 2 significant figures.
export function logSliderVal(pos: number, lo: number, hi: number): number {
  const lg = lo + (pos / 1000) * (hi - lo)
  const raw = Math.pow(10, lg)
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  return Math.round(raw / (mag / 10)) * (mag / 10)
}

// Scored by order of magnitude (log distance), the way an interviewer scores.
export function gradeGuess(guess: number, ans: number) {
  const err = Math.abs(Math.log10(guess) - Math.log10(ans))
  if (err <= 0.3) return { label: 'DEAD ON', pts: 100, col: C.ok, err }
  if (err <= 0.6) return { label: 'RIGHT BALLPARK', pts: 75, col: C.mem, err }
  if (err <= 1.0) return { label: 'SAME UNIVERSE', pts: 40, col: C.compute, err }
  return { label: `OFF BY ${err.toFixed(1)} ORDERS OF MAGNITUDE`, pts: 0, col: C.alert, err }
}

function DrillSession() {
  const { cards, record } = useDrillProgress()
  const addScar = useScars((s) => s.addScar)
  // Queue is built once per session from the Leitner state, then advanced.
  const [sessionStart] = useState(() => Date.now())
  const queue = useMemo(() => buildSession(DRILLS, cards, sessionStart), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(500)
  const [revealed, setRevealed] = useState(false)
  const [sessionPts, setSessionPts] = useState<number[]>([])

  const d = queue[idx % queue.length]
  const guess = logSliderVal(pos, d.loExp, d.hiExp)
  const grade = gradeGuess(guess, d.ans)
  const refs = d.numbersRefs.map((id) => NUMBERS.find((n) => n.id === id)).filter(Boolean)
  const dueCount = DRILLS.filter((x) => cards[x.id] && cards[x.id].due <= sessionStart).length

  const lock = () => {
    setRevealed(true)
    setSessionPts([...sessionPts, grade.pts])
    record(d.id, d.cat, grade.err, grade.pts)
    if (grade.pts < 75)
      addScar({
        mode: 'drills',
        theme: DRILL_CATEGORIES[d.cat],
        what: `${fmtNum(guess)} ${d.unit}`,
        truth: `${fmtNum(d.ans)} ${d.unit}`,
        lesson: d.derive[2],
      })
  }

  const navigate = useNavigate()
  const verdict = drillVerdict(grade.err)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>DRILLS</h1>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: dueCount ? C.compute : C.dim, whiteSpace: 'nowrap' }}>
          drill {sessionPts.length + 1} · {dueCount > 0 ? `${dueCount} due for review` : 'nothing overdue'}
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 620 }}>
        Scored by order of magnitude — the way an interviewer scores you.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24, marginTop: 32, maxWidth: 640 }}>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: 1.5, color: C.net }}>
          ESTIMATE · {DRILL_CATEGORIES[d.cat].toUpperCase()}
        </span>
        <p style={{ fontSize: 16.5, lineHeight: 1.55, fontWeight: 500, margin: '12px 0 0' }}>{d.q}</p>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span
            className="mono"
            style={{ fontSize: 34, fontWeight: 600, color: revealed ? (grade.err <= 1 ? C.ok : C.alert) : C.net }}
          >
            {fmtNum(guess)}
          </span>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}> {d.unit}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={pos}
          disabled={revealed}
          onChange={(e) => setPos(+e.target.value)}
          aria-label="estimate on a log scale"
          style={{ marginTop: 14 }}
        />
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.faint, marginTop: 6, gap: 8 }}>
          <span style={{ whiteSpace: 'nowrap' }}>{fmtNum(Math.pow(10, d.loExp))}</span>
          <span style={{ whiteSpace: 'nowrap' }}>log scale — each step ×10</span>
          <span style={{ whiteSpace: 'nowrap' }}>{fmtNum(Math.pow(10, d.hiExp))}</span>
        </div>

        {!revealed ? (
          <LockButton onClick={lock} />
        ) : (
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 20, paddingTop: 16 }}>
            <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: verdict.col, whiteSpace: 'nowrap' }}>
              {verdict.text} · +{grade.pts}
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text, margin: '8px 0 0' }}>
              ≈ {fmtNum(d.ans)} {d.unit}. {d.derive.join(' ')}
              {refs.length > 0 && (
                <span className="mono" style={{ display: 'block', fontSize: 10.5, color: C.faint, marginTop: 8 }}>
                  bounded by: {refs.map((r) => r!.boundingPhysics).join(' · ')}
                </span>
              )}
            </p>
            <div style={{ marginTop: 14 }}>
              <GhostButton
                onClick={() => {
                  setIdx(idx + 1)
                  setPos(500)
                  setRevealed(false)
                }}
              >
                try again
              </GhostButton>
            </div>
          </div>
        )}
      </div>

      <div>
        <QuietLink onClick={() => navigate('/drills/calibration')}>
          CALIBRATION — accuracy by category, your blind spots →
        </QuietLink>
      </div>
    </div>
  )
}

function Stats() {
  const { cards, history } = useDrillProgress()
  const cats = Object.keys(DRILL_CATEGORIES) as DrillCategory[]
  const byCat = cats.map((cat) => {
    const h = history.filter((r) => r.cat === cat)
    const avg = h.length ? h.reduce((a, r) => a + r.pts, 0) / h.length : null
    return { cat, n: h.length, avg }
  })
  const buckets = [
    { label: 'dead on (≤0.3 orders)', test: (e: number) => e <= 0.3, col: C.ok },
    { label: 'ballpark (0.3–0.6)', test: (e: number) => e > 0.3 && e <= 0.6, col: C.mem },
    { label: 'same universe (0.6–1)', test: (e: number) => e > 0.6 && e <= 1, col: C.compute },
    { label: 'lost in space (>1 order)', test: (e: number) => e > 1, col: C.alert },
  ].map((b) => ({ ...b, n: history.filter((r) => b.test(r.err)).length }))
  const maxBucket = Math.max(1, ...buckets.map((b) => b.n))
  const boxDist = [1, 2, 3, 4, 5].map((box) => ({ box, n: Object.values(cards).filter((c) => c.box === box).length }))
  const unseen = DRILLS.length - Object.keys(cards).length

  if (history.length === 0)
    return (
      <div style={{ background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 24, color: C.dim, fontSize: 14 }}>
        No answers yet — run a few drills and your calibration profile appears here.
      </div>
    )

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 10 }}>
          ACCURACY BY CATEGORY — your blind spots, ranked
        </div>
        {byCat
          .sort((a, b) => (a.avg ?? 101) - (b.avg ?? 101))
          .map(({ cat, n, avg }) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 13, flex: '0 0 190px' }}>{DRILL_CATEGORIES[cat]}</span>
              <div style={{ flex: 1, height: 12, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                {avg !== null && (
                  <div style={{ height: '100%', width: `${avg}%`, background: avg >= 75 ? C.ok : avg >= 50 ? C.compute : C.alert }} />
                )}
              </div>
              <span className="mono" style={{ fontSize: 12, color: C.dim, minWidth: 90, textAlign: 'right' }}>
                {avg === null ? 'not drilled' : `${Math.round(avg)} avg · ${n}×`}
              </span>
            </div>
          ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 10 }}>
          LOG-ERROR HISTOGRAM — how far off, when you're off
        </div>
        {buckets.map((b) => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 11.5, flex: '0 0 190px', color: C.dim }}>{b.label}</span>
            <div style={{ flex: 1, height: 12, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(b.n / maxBucket) * 100}%`, background: b.col }} />
            </div>
            <span className="mono" style={{ fontSize: 12, color: C.dim, minWidth: 40, textAlign: 'right' }}>{b.n}</span>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.mem, marginBottom: 10 }}>
          LEITNER BOXES — {unseen} of {DRILLS.length} drills still unseen
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {boxDist.map(({ box, n }) => (
            <div key={box} style={{ flex: '1 1 90px', background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: n > 0 ? C.text : C.faint }}>{n}</div>
              <div className="mono" style={{ fontSize: 10, color: C.faint }}>
                box {box} · {BOX_INTERVAL_DAYS[box]}d
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: C.dim, marginTop: 10 }}>
          Right answers climb toward box 5 (two-week repeats). A bad miss drops a card straight back to box 1. Box 1–2 residents
          are your pre-interview cram list.
        </div>
      </div>
    </div>
  )
}

export default function Drills() {
  const { tab } = useParams()
  const navigate = useNavigate()
  if (tab !== 'session' && tab !== 'calibration') return <Navigate to="/drills/session" replace />
  if (tab === 'calibration') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <GhostButton onClick={() => navigate('/drills/session')}>← the drills</GhostButton>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>CALIBRATION</h1>
        </div>
        <Stats />
      </div>
    )
  }
  return <DrillSession />
}
