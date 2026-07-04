import { useEffect, useState } from 'react'
import { C } from '../../theme'
import { Button, Panel } from '../../ui/kit'
import { useScars, type ScarMode } from '../../state/scars'

// Teach-back (product-spec §3.5): after a solve, narrate the fix aloud in 60s,
// then self-score a 3-item rubric — mechanism / tradeoff / number — logged to
// the Scar Journal. Explaining is the strongest test that you actually own it.
const RUBRIC = [
  { k: 'mechanism' as const, label: 'I named the MECHANISM — how the fix actually works' },
  { k: 'tradeoff' as const, label: 'I named the TRADEOFF — what the fix costs' },
  { k: 'number' as const, label: 'I cited the NUMBER — the requirement that forced it' },
]

export function TeachBackCard({ mode, topic }: { mode: ScarMode; topic: string }) {
  const addTeachBack = useScars((s) => s.addTeachBack)
  const [open, setOpen] = useState(false)
  const [secs, setSecs] = useState(60)
  const [running, setRunning] = useState(false)
  const [rubric, setRubric] = useState({ mechanism: false, tradeoff: false, number: false })
  const [logged, setLogged] = useState(false)

  useEffect(() => {
    if (!running || secs <= 0) return
    const t = setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, secs])

  const score = Object.values(rubric).filter(Boolean).length
  const mmss = `0:${String(secs).padStart(2, '0')}`

  if (!open) {
    return (
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        style={{ marginTop: 12 }}
      >
        ◈ Teach it back (60s) — the real test of understanding
      </Button>
    )
  }

  return (
    <Panel accent={C.gold} style={{ marginTop: 12 }}>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: 1.5, color: C.gold, marginBottom: 8 }}>
        TEACH IT BACK — narrate the fix out loud, then score yourself
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div
          className="mono"
          style={{ fontSize: 26, fontWeight: 700, color: secs === 0 ? C.alert : secs <= 10 ? C.compute : C.text }}
        >
          {mmss}
        </div>
        {!running && secs === 60 && (
          <Button size="sm" onClick={() => setRunning(true)}>
            Start the clock
          </Button>
        )}
        {running && secs > 0 && (
          <span className="mono" style={{ fontSize: 12, color: C.dim }}>
            talking… name the mechanism, the tradeoff, and the number
          </span>
        )}
        {secs === 0 && (
          <span className="mono" style={{ fontSize: 12, color: C.alert }}>
            time — how did you do?
          </span>
        )}
      </div>
      {logged ? (
        <div className="mono" style={{ fontSize: 12.5, color: C.ok }}>
          ✓ Logged to Scar Journal — {score}/3 this time
        </div>
      ) : (
        <>
          {RUBRIC.map((r) => (
            <label
              key={r.k}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', cursor: 'pointer', fontSize: 13, lineHeight: 1.5 }}
            >
              <input
                type="checkbox"
                checked={rubric[r.k]}
                onChange={(e) => setRubric((s) => ({ ...s, [r.k]: e.target.checked }))}
                style={{ marginTop: 2 }}
              />
              <span style={{ color: rubric[r.k] ? C.text : C.dim }}>{r.label}</span>
            </label>
          ))}
          <Button
            size="sm"
            onClick={() => {
              addTeachBack({ mode, topic, rubric, score })
              setLogged(true)
            }}
            style={{ marginTop: 10 }}
          >
            Log {score}/3 to the Journal
          </Button>
        </>
      )}
    </Panel>
  )
}
