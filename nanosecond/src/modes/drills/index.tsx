import { useState } from 'react'
import { C } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { fmtNum } from '../../ui/fmt'
import { DRILLS } from '../../content/drills'
import { NUMBERS } from '../../content/numbers'

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
  if (err <= 0.3) return { label: 'DEAD ON', pts: 100, col: C.ok }
  if (err <= 0.6) return { label: 'RIGHT BALLPARK', pts: 75, col: C.mem }
  if (err <= 1.0) return { label: 'SAME UNIVERSE', pts: 40, col: C.compute }
  return { label: `OFF BY ${err.toFixed(1)} ORDERS OF MAGNITUDE`, pts: 0, col: C.alert }
}

export default function Drills() {
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(500)
  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const d = DRILLS[idx % DRILLS.length]
  const guess = logSliderVal(pos, d.loExp, d.hiExp)
  const grade = gradeGuess(guess, d.ans)
  const total = history.reduce((a, h) => a + h, 0)
  const refs = d.numbersRefs.map((id) => NUMBERS.find((n) => n.id === id)).filter(Boolean)

  return (
    <div style={{ maxWidth: 720 }}>
      <ModeHeader title="DRILLS" thesis="scored by order of magnitude, the way an interviewer scores you" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <span className="mono" style={{ fontSize: 12, color: C.dim }}>
          drill {history.length + 1} · score {total}
          {history.length > 0 ? ` / ${history.length * 100}` : ''}
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Scored the way an interviewer scores you: by order of magnitude. Within ⅓ of an order is a hit. Every answer shows the
        derivation — a miss here is worth more than a lucky hit.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22 }}>
        <div className="mono" style={{ color: C.net, fontSize: 10, letterSpacing: 1.5, marginBottom: 10 }}>
          ESTIMATE
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, marginBottom: 26 }}>{d.q}</div>

        <div className="mono" style={{ textAlign: 'center', fontSize: 30, fontWeight: 600, color: revealed ? grade.col : C.net, marginBottom: 6 }}>
          {fmtNum(guess)} <span style={{ fontSize: 14, color: C.dim }}>{d.unit}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={pos}
          disabled={revealed}
          onChange={(e) => setPos(+e.target.value)}
          aria-label="estimate on a log scale"
        />
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.faint, marginTop: 4 }}>
          <span>{fmtNum(Math.pow(10, d.loExp))}</span>
          <span>log scale — each step ×10</span>
          <span>{fmtNum(Math.pow(10, d.hiExp))}</span>
        </div>

        {!revealed ? (
          <button
            onClick={() => {
              setRevealed(true)
              setHistory([...history, grade.pts])
            }}
            style={{
              marginTop: 22,
              width: '100%',
              padding: '12px 0',
              background: C.net,
              color: C.bg,
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
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
              style={{
                marginTop: 14,
                width: '100%',
                padding: '11px 0',
                background: C.panelUp,
                color: C.text,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Next drill →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
