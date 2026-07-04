import { useMemo, useState } from 'react'
import { C } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { fmtNum } from '../../ui/fmt'
import { DRILLS, DRILL_CATEGORIES, type DrillCategory } from '../../content/drills'
import { NUMBERS } from '../../content/numbers'
import { buildSession, useDrillProgress, BOX_INTERVAL_DAYS } from '../../state/drillProgress'
import { useScars } from '../../state/scars'

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
  const { cards, history, record } = useDrillProgress()
  const addScar = useScars((s) => s.addScar)
  // Queue is built once per session from the Leitner state, then advanced.
  const [sessionStart] = useState(() => Date.now())
  const queue = useMemo(() => buildSession(DRILLS, cards, sessionStart), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(500)
  const [revealed, setRevealed] = useState(false)
  const [sessionPts, setSessionPts] = useState<number[]>([])

  const d = queue[idx % queue.length]
  const card = cards[d.id]
  const guess = logSliderVal(pos, d.loExp, d.hiExp)
  const grade = gradeGuess(guess, d.ans)
  const total = sessionPts.reduce((a, b) => a + b, 0)
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <span className="mono" style={{ fontSize: 12, color: C.dim }}>
          drill {sessionPts.length + 1} · score {total}
          {sessionPts.length > 0 ? ` / ${sessionPts.length * 100}` : ''}
        </span>
        <span className="mono" style={{ fontSize: 12, color: dueCount ? C.compute : C.faint }}>
          {dueCount > 0 ? `${dueCount} cards due for review` : `${history.length} answers logged · nothing overdue`}
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div className="mono" style={{ color: C.net, fontSize: 10, letterSpacing: 1.5 }}>
            ESTIMATE · {DRILL_CATEGORIES[d.cat].toUpperCase()}
          </div>
          <div className="mono" style={{ fontSize: 10, color: C.faint }}>
            {card ? `leitner box ${card.box}/5 · repeats in ${BOX_INTERVAL_DAYS[card.box]}d` : 'new card'}
          </div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, marginBottom: 26 }}>{d.q}</div>

        <div className="mono" style={{ textAlign: 'center', fontSize: 30, fontWeight: 600, color: revealed ? grade.col : C.net, marginBottom: 6 }}>
          {fmtNum(guess)} <span style={{ fontSize: 14, color: C.dim }}>{d.unit}</span>
        </div>
        <input type="range" min={0} max={1000} value={pos} disabled={revealed} onChange={(e) => setPos(+e.target.value)} aria-label="estimate on a log scale" />
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.faint, marginTop: 4 }}>
          <span>{fmtNum(Math.pow(10, d.loExp))}</span>
          <span>log scale — each step ×10</span>
          <span>{fmtNum(Math.pow(10, d.hiExp))}</span>
        </div>

        {!revealed ? (
          <button
            onClick={lock}
            style={{ marginTop: 22, width: '100%', padding: '12px 0', background: C.net, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Lock it in
          </button>
        ) : (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
              <span className="mono" style={{ color: grade.col, fontWeight: 600, fontSize: 14 }}>
                {grade.label} · +{grade.pts}
              </span>
              <span className="mono" style={{ fontSize: 13, color: C.dim }}>
                answer ≈{' '}
                <span style={{ color: C.text, fontWeight: 600 }}>
                  {fmtNum(d.ans)} {d.unit}
                </span>
              </span>
            </div>
            <div style={{ background: C.bg, borderRadius: 8, padding: '12px 14px', marginTop: 12, border: `1px solid ${C.line}` }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 8 }}>
                HOW TO DERIVE IT
              </div>
              {d.derive.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
                  <span className="mono" style={{ color: C.compute, fontSize: 12 }}>
                    {i + 1}.
                  </span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
              {refs.length > 0 && (
                <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 8 }}>
                  bounded by: {refs.map((r) => r!.boundingPhysics).join(' · ')}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setIdx(idx + 1)
                setPos(500)
                setRevealed(false)
              }}
              style={{ marginTop: 14, width: '100%', padding: '11px 0', background: C.panelUp, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Next drill →
            </button>
          </div>
        )}
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
  const [tab, setTab] = useState('drill')
  return (
    <div style={{ maxWidth: 720 }}>
      <ModeHeader title="DRILLS" thesis="scored by order of magnitude, the way an interviewer scores you">
        <TabNav
          tabs={[
            { id: 'drill', label: '01 · DRILL', sub: 'due cards come first' },
            { id: 'stats', label: '02 · CALIBRATION', sub: 'accuracy by category' },
          ]}
          active={tab}
          onPick={setTab}
        />
      </ModeHeader>
      {tab === 'drill' ? <DrillSession /> : <Stats />}
    </div>
  )
}
