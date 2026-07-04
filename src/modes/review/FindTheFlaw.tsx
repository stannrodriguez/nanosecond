import { useEffect, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Diagram } from '../../ui/Diagram'
import { PUZZLES } from '../../content/puzzles'
import { useScars } from '../../state/scars'

export function FindTheFlaw({ onScore }: { onScore: (n: number) => void }) {
  const { addScar, addSoundbite } = useScars()
  const [pi, setPi] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'inspect' | 'reveal' | 'done'>('inspect')
  const [fi, setFi] = useState(0)
  const p = PUZZLES[pi]
  const correct = picked === p.flaw

  useEffect(() => {
    if (phase !== 'reveal') return
    if (fi >= p.frames.length - 1) {
      const t = setTimeout(() => setPhase('done'), 1400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setFi(fi + 1), 1700)
    return () => clearTimeout(t)
  }, [phase, fi]) // eslint-disable-line react-hooks/exhaustive-deps

  const lockIn = () => {
    setFi(0)
    setPhase('reveal')
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
    setFi(0)
  }
  const frame = p.frames[Math.min(fi, p.frames.length - 1)]

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

      <Diagram
        nodes={p.nodes}
        edges={p.edges}
        picked={picked}
        onPick={setPicked}
        flaw={p.flaw}
        revealed={phase === 'done'}
        locked={phase !== 'inspect'}
      />

      {phase === 'inspect' && (
        <button
          onClick={lockIn}
          disabled={!picked}
          style={{
            marginTop: 14,
            padding: '11px 24px',
            background: picked ? C.alert : C.line,
            color: picked ? '#fff' : C.faint,
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: picked ? 'pointer' : 'default',
          }}
        >
          {picked ? 'Lock in suspicion — run the traffic' : 'Click a component to accuse it'}
        </button>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 12.5, color: C.compute, minHeight: 36, lineHeight: 1.5, marginBottom: 12 }}>
            ▸ {frame.cap}
          </div>
          {frame.bars.map((b) => (
            <Bar key={b.label} label={b.label} u={b.u} ch={b.col} txt={b.txt} />
          ))}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: correct ? C.ok : C.alert }}>
            {correct
              ? '✓ CORRECT — you smelled it before the traffic did'
              : `✗ You accused "${p.nodes.find((n) => n.id === picked)?.label}" — the real flaw was "${p.nodes.find((n) => n.id === p.flaw)?.label}"`}
          </div>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
            <div>{p.explain}</div>
            <div style={{ marginTop: 10 }}>
              <span className="mono" style={{ color: C.mem, fontSize: 10.5, letterSpacing: 1.5 }}>
                THE FIX ·{' '}
              </span>
              {p.fix}
            </div>
            <div style={{ marginTop: 10, borderLeft: `3px solid ${C.net}`, paddingLeft: 12, color: C.dim, fontStyle: 'italic' }}>
              <span className="mono" style={{ color: C.net, fontSize: 10.5, letterSpacing: 1.5, fontStyle: 'normal' }}>
                SAY IT IN THE INTERVIEW ·{' '}
              </span>
              {p.line}
            </div>
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
            Next puzzle →
          </button>
        </div>
      )}
    </div>
  )
}
