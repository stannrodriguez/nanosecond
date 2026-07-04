import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { Diagram } from '../../ui/Diagram'
import { Button } from '../../ui/kit'
import { FramePlayer } from '../../ui/FramePlayer'
import { PUZZLES, SOUND } from '../../content/puzzles'
import { useScars } from '../../state/scars'
import { useJudgment } from '../../state/judgment'
import { Postmortem, paceLabel } from './Postmortem'
import { TeachBackCard } from './TeachBackCard'

// URL-driven per ADR 0004: the current puzzle is /review/flaw/:puzzleId. The
// parent remounts this on id change (key), so in-challenge state resets cleanly.
export function FindTheFlaw({ puzzleId, onScore }: { puzzleId?: string; onScore: (n: number) => void }) {
  const { addScar, addSoundbite } = useScars()
  const record = useJudgment((s) => s.record)
  const navigate = useNavigate()
  const pi = Math.max(0, PUZZLES.findIndex((p) => p.id === puzzleId))
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'inspect' | 'reveal' | 'done'>('inspect')
  const [startMs] = useState(() => Date.now())
  const [solveSecs, setSolveSecs] = useState(0)
  const p = PUZZLES[pi]
  // "Sound" is the honest verdict for a fine puzzle; a wrong guess otherwise.
  const correct = p.fine ? picked === SOUND : picked === p.flaw
  const accusedNode = picked && picked !== SOUND ? p.nodes.find((n) => n.id === picked) : null

  const commit = (choice: string) => {
    setPicked(choice)
    setPhase('reveal')
    setSolveSecs(Math.max(1, Math.round((Date.now() - startMs) / 1000)))
    const right = p.fine ? choice === SOUND : choice === p.flaw
    onScore(right ? 100 : 0)
    record('flaw', right ? 100 : 0, 100)
    addSoundbite(p.line)
    if (!right) {
      const what = choice === SOUND ? 'declared it sound' : p.nodes.find((n) => n.id === choice)?.label ?? 'nothing'
      const truth = p.fine ? 'the design was actually sound' : p.nodes.find((n) => n.id === p.flaw)?.label ?? ''
      addScar({ mode: 'flaw', theme: p.title, what, truth, lesson: p.explain.split('. ')[0] + '.' })
    }
  }
  const next = () => navigate(`/review/flaw/${PUZZLES[(pi + 1) % PUZZLES.length].id}`)

  const pace = paceLabel(p.par, solveSecs)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{p.title}</span>
        <span className="mono" style={{ fontSize: 11, color: C.dim }}>
          puzzle {pi + 1}/{PUZZLES.length} · par {fmtPar(p.par)}
        </span>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: C.compute, margin: '4px 0 8px' }}>
        {p.reqs}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, marginBottom: 12 }}>{p.brief}</p>

      <Diagram
        nodes={p.nodes}
        edges={p.edges}
        picked={picked === SOUND ? null : picked}
        onPick={setPicked}
        flaw={p.flaw}
        fine={p.fine}
        revealed={phase === 'done'}
        locked={phase !== 'inspect'}
      />

      {phase === 'inspect' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <Button variant="danger" disabled={!picked || picked === SOUND} onClick={() => commit(picked!)} style={{ padding: '11px 24px' }}>
            {picked && picked !== SOUND ? 'Lock in suspicion — run the traffic' : 'Click a component to accuse it'}
          </Button>
          <Button variant="ghost" onClick={() => commit(SOUND)} style={{ padding: '11px 20px' }}>
            …or declare it sound — ship it ✓
          </Button>
        </div>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <FramePlayer frames={p.frames} running={phase === 'reveal'} onEnd={() => setPhase('done')} />
      )}

      {phase === 'done' && (
        <div style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: correct ? C.ok : C.alert }}>
            {verdict(correct, p.fine, accusedNode?.label, p.nodes.find((n) => n.id === p.flaw)?.label)}
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: pace.col, marginTop: 6 }}>
            ⏱ {pace.text}
          </div>
          <Postmortem p={p} />
          <TeachBackCard mode="flaw" topic={p.title} />
          <div>
            <Button onClick={next} style={{ marginTop: 12 }}>
              Next puzzle →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtPar(par: number): string {
  const m = Math.floor(par / 60)
  const s = par % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`
}

function verdict(correct: boolean, fine: boolean | undefined, accused?: string, flawLabel?: string): string {
  if (correct) {
    return fine
      ? '✓ CORRECT — the honest call was "ship it". You resisted fixing what wasn\'t broken.'
      : '✓ CORRECT — you smelled it before the traffic did'
  }
  if (fine) {
    return `✗ You accused "${accused}" — but this design was sound. Adding a fix here buys complexity for no requirement.`
  }
  if (!accused) {
    return `✗ You declared it sound — but the real flaw was "${flawLabel}"`
  }
  return `✗ You accused "${accused}" — the real flaw was "${flawLabel}"`
}
