import { useState } from 'react'
import { C } from '../../theme'
import { Button } from '../../ui/kit'
import { TASTES } from '../../content/tastes'
import { useScars } from '../../state/scars'
import { useJudgment } from '../../state/judgment'

export function TasteTest({ onScore }: { onScore: (n: number) => void }) {
  const addScar = useScars((s) => s.addScar)
  const record = useJudgment((s) => s.record)
  const [qi, setQi] = useState(0)
  const [pick, setPick] = useState<'a' | 'b' | null>(null)
  const [why, setWhy] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const q = TASTES[qi]

  const submit = () => {
    setDone(true)
    const pts = (pick === q.ans ? 50 : 0) + (q.whys[why!].ok ? 50 : 0)
    onScore(pts)
    record('taste', pts, 100)
    if (pick !== q.ans)
      addScar({
        mode: 'taste',
        theme: 'taste: fit over vibes',
        what: q[pick!].name,
        truth: q[q.ans].name,
        lesson: q.flip.split('. ')[0] + '.',
      })
    else if (!q.whys[why!].ok)
      addScar({
        mode: 'taste',
        theme: 'right answer, wrong reason',
        what: q.whys[why!].t.slice(0, 80),
        truth: q.whys.find((w) => w.ok)!.t.slice(0, 80),
        lesson: q.whys[why!].why.split('. ')[0] + '.',
      })
  }
  const next = () => {
    setQi((qi + 1) % TASTES.length)
    setPick(null)
    setWhy(null)
    setDone(false)
  }

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55 }}>
        Two defensible designs, one set of requirements. Picking the right one is worth half; picking the right{' '}
        <b style={{ color: C.text }}>reason</b> is worth the other half — because “correct answer, wrong reason” is the most
        dangerous state in engineering: it works until it catastrophically doesn't.
      </p>
      <div
        className="mono"
        style={{ fontSize: 12, color: C.compute, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', margin: '12px 0' }}
      >
        {q.prompt}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {(['a', 'b'] as const).map((k) => (
          <button
            key={k}
            onClick={() => !done && setPick(k)}
            style={{
              textAlign: 'left',
              background: pick === k ? C.panelUp : C.panel,
              border: `1.5px solid ${done && q.ans === k ? C.ok : pick === k ? C.net : C.line}`,
              borderRadius: 10,
              padding: 14,
              cursor: done ? 'default' : 'pointer',
              color: C.text,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13.5, color: pick === k ? C.net : C.text }}>{q[k].name}</div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, marginTop: 6 }}>{q[k].desc}</div>
          </button>
        ))}
      </div>
      {pick && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Why? Choose the strongest justification:</div>
          {q.whys.map((w, i) => (
            <button
              key={i}
              onClick={() => !done && setWhy(i)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: why === i ? C.panelUp : C.panel,
                border: `1px solid ${done ? (w.ok ? C.ok : why === i ? C.alert : C.line) : why === i ? C.net : C.line}`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 8,
                cursor: done ? 'default' : 'pointer',
                color: C.text,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {w.t}
              {done && (why === i || w.ok) && (
                <div style={{ marginTop: 6, fontSize: 12.5, color: w.ok ? C.ok : C.alert }}>{w.why}</div>
              )}
            </button>
          ))}
          {!done ? (
            <Button variant="danger" disabled={why === null} onClick={submit} style={{ marginTop: 6, padding: '11px 24px' }}>
              Defend it
            </Button>
          ) : (
            <>
              <div style={{ background: C.bg, border: `1px solid ${C.net}44`, borderRadius: 8, padding: '12px 14px', marginTop: 8, fontSize: 13.5, lineHeight: 1.6 }}>
                <span className="mono" style={{ color: C.net, fontSize: 10.5, letterSpacing: 1.5 }}>
                  THE TABLES TURN ·{' '}
                </span>
                {q.flip}
              </div>
              <Button onClick={next} style={{ marginTop: 12 }}>
                Next matchup →
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
