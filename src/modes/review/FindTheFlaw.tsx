import { useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Diagram } from '../../ui/Diagram'
import { Panel, Button } from '../../ui/kit'
import { useFrameStepper } from '../../ui/useFrameStepper'
import { PUZZLES } from '../../content/puzzles'
import { useScars } from '../../state/scars'

export function FindTheFlaw({ onScore }: { onScore: (n: number) => void }) {
  const { addScar, addSoundbite } = useScars()
  const [pi, setPi] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'inspect' | 'reveal' | 'done'>('inspect')
  const p = PUZZLES[pi]
  const correct = picked === p.flaw

  // Scripted failure reveal: step through the frames, then flip to the verdict.
  const stepper = useFrameStepper(p.frames.length, { intervalMs: 1700, onEnd: () => setPhase('done') })
  const frame = p.frames[stepper.index]

  const lockIn = () => {
    setPhase('reveal')
    stepper.play()
    onScore(correct ? 100 : 0)
    addSoundbite(p.line)
    if (!correct)
      addScar({
        mode: 'flaw',
        theme: p.title,
        what: p.nodes.find((n) => n.id === picked)?.label ?? 'nothing',
        truth: p.nodes.find((n) => n.id === p.flaw)?.label ?? '',
        lesson: p.explain.split('. ')[0] + '.',
      })
  }
  const next = () => {
    setPi((pi + 1) % PUZZLES.length)
    setPicked(null)
    setPhase('inspect')
    stepper.reset()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{p.title}</span>
        <span className="mono" style={{ fontSize: 11, color: C.dim }}>
          puzzle {pi + 1}/{PUZZLES.length}
        </span>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: C.compute, margin: '4px 0 8px' }}>
        {p.reqs}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, marginBottom: 12 }}>{p.brief}</p>

      <Diagram nodes={p.nodes} edges={p.edges} picked={picked} onPick={setPicked} flaw={p.flaw} revealed={phase === 'done'} locked={phase !== 'inspect'} />

      {phase === 'inspect' && (
        <Button variant="danger" disabled={!picked} onClick={lockIn} style={{ marginTop: 14, padding: '11px 24px' }}>
          {picked ? 'Lock in suspicion — run the traffic' : 'Click a component to accuse it'}
        </Button>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <Panel style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 12.5, color: C.compute, minHeight: 36, lineHeight: 1.5, marginBottom: 12 }}>
            ▸ {frame.cap}
          </div>
          {frame.bars.map((b) => (
            <Bar key={b.label} label={b.label} u={b.u} ch={b.col} txt={b.txt} />
          ))}
        </Panel>
      )}

      {phase === 'done' && (
        <div style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: correct ? C.ok : C.alert }}>
            {correct
              ? '✓ CORRECT — you smelled it before the traffic did'
              : `✗ You accused "${p.nodes.find((n) => n.id === picked)?.label}" — the real flaw was "${p.nodes.find((n) => n.id === p.flaw)?.label}"`}
          </div>
          <Panel style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{p.explain}</div>
            <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
              <span className="mono" style={{ color: C.mem, fontSize: 10.5, letterSpacing: 1.5 }}>
                THE FIX ·{' '}
              </span>
              {p.fix}
            </div>
            <div style={{ marginTop: 10, borderLeft: `3px solid ${C.net}`, paddingLeft: 12, color: C.dim, fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.6 }}>
              <span className="mono" style={{ color: C.net, fontSize: 10.5, letterSpacing: 1.5, fontStyle: 'normal' }}>
                SAY IT IN THE INTERVIEW ·{' '}
              </span>
              {p.line}
            </div>
          </Panel>
          <Button onClick={next} style={{ marginTop: 12 }}>
            Next puzzle →
          </Button>
        </div>
      )}
    </div>
  )
}
