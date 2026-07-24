import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { GhostButton, useHover } from '../../ui/kit'
import { PUZZLES, SOUND, type PuzzleNode } from '../../content/puzzles'
import { useScars } from '../../state/scars'
import { useJudgment } from '../../state/judgment'
import { Postmortem } from './Postmortem'
import { TeachBackCard } from './TeachBackCard'

// One node in the linear chain. In inspect it's a plain accuse target; once a
// call is made, the real flaw glows C.ok and a wrong pick glows C.alert.
function ChainNode({
  node,
  state,
  locked,
  onAccuse,
}: {
  node: PuzzleNode
  state: 'idle' | 'flaw' | 'wrong'
  locked: boolean
  onAccuse: () => void
}) {
  const [h, bind] = useHover()
  const border = state === 'flaw' ? C.ok : state === 'wrong' ? C.alert : h && !locked ? '#3A5080' : C.line
  const subColor = state === 'flaw' ? C.ok : state === 'wrong' ? C.alert : C.faint
  return (
    <button
      onClick={locked ? undefined : onAccuse}
      {...(locked ? {} : bind)}
      disabled={locked}
      style={{
        background: C.panelUp,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '12px 16px',
        cursor: locked ? 'default' : 'pointer',
        color: C.text,
        fontFamily: 'inherit',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        transition: 'border-color .15s, transform .15s',
        transform: h && !locked ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{node.label}</div>
      {node.sub && (
        <div className="mono" style={{ fontSize: 10, color: subColor, marginTop: 3 }}>
          {node.sub}
        </div>
      )}
    </button>
  )
}

// URL-driven per ADR 0004: the current puzzle is /review/flaw/:puzzleId. The
// parent remounts this on id change (key), so in-challenge state resets cleanly.
export function FindTheFlaw({ puzzleId, onScore }: { puzzleId?: string; onScore: (n: number) => void }) {
  const { addScar, addSoundbite } = useScars()
  const record = useJudgment((s) => s.record)
  const navigate = useNavigate()
  const pi = Math.max(
    0,
    PUZZLES.findIndex((p) => p.id === puzzleId),
  )
  const [picked, setPicked] = useState<string | null>(null)
  const p = PUZZLES[pi]
  const done = picked !== null
  // "Sound" is the honest verdict for a fine puzzle; a wrong guess otherwise.
  const correct = p.fine ? picked === SOUND : picked === p.flaw

  const commit = (choice: string) => {
    if (picked !== null) return
    setPicked(choice)
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
  const reset = () => setPicked(null)
  const next = () => navigate(`/review/flaw/${PUZZLES[(pi + 1) % PUZZLES.length].id}`)

  const flawLabel = p.nodes.find((n) => n.id === p.flaw)?.label ?? ''
  const accusedLabel = picked && picked !== SOUND ? p.nodes.find((n) => n.id === picked)?.label ?? '' : ''

  return (
    <div>
      {/* title row: mode name + puzzle counter */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>DESIGN REVIEW</h1>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: C.dim, whiteSpace: 'nowrap' }}>
          puzzle {pi + 1}/{PUZZLES.length} · par {fmtPar(p.par)}
        </span>
      </div>

      {/* puzzle title + constraint line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{p.title}</h2>
        <span className="mono" style={{ fontSize: 11.5, color: C.compute }}>
          {p.reqs}
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '12px 0 0', maxWidth: 680 }}>{p.brief}</p>

      {/* the design as a linear chain */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: '28px 24px', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {p.nodes.map((n, i) => {
            const state: 'idle' | 'flaw' | 'wrong' =
              !done ? 'idle' : !p.fine && n.id === p.flaw ? 'flaw' : n.id === picked ? 'wrong' : 'idle'
            return (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span style={{ color: C.faint, fontSize: 11 }}>→</span>}
                <ChainNode node={n} state={state} locked={done} onAccuse={() => commit(n.id)} />
              </div>
            )
          })}
        </div>

        {done && (
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 22, paddingTop: 16, maxWidth: 640 }}>
            <span
              className="mono"
              style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: correct ? C.ok : C.alert, whiteSpace: 'nowrap' }}
            >
              {verdict(correct, p.fine, picked === SOUND, accusedLabel, flawLabel)}
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text, margin: '8px 0 0' }}>{p.explain}</p>
            <div style={{ marginTop: 14 }}>
              <GhostButton onClick={reset}>try again</GhostButton>
            </div>
          </div>
        )}
      </div>

      {!done && (
        <div style={{ marginTop: 14 }}>
          <GhostButton onClick={() => commit(SOUND)}>…or declare it sound — ship it ✓</GhostButton>
        </div>
      )}

      {done && (
        <div style={{ marginTop: 20 }}>
          <Postmortem p={p} />
          <TeachBackCard mode="flaw" topic={p.title} />
          <div>
            <GhostButton onClick={next}>next puzzle →</GhostButton>
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

// The calm three-tier verdict (handoff §6), keeping the fine-puzzle phrasing
// the judgment tests key on.
function verdict(correct: boolean, fine: boolean | undefined, declaredSound: boolean, accused: string, flawLabel: string): string {
  if (correct) {
    return fine
      ? '✓ CORRECT — the honest call was "ship it". You resisted fixing what wasn\'t broken.'
      : '✓ CAUGHT IT — you smelled it before the traffic did.'
  }
  if (fine) {
    return `✗ NOT THE BOTTLENECK — you accused "${accused}", but this design was sound. A fix here buys complexity for no requirement.`
  }
  if (declaredSound) {
    return `✗ YOU SHIPPED THE FLAW — the real flaw was "${flawLabel}".`
  }
  return `✗ NOT THE BOTTLENECK — you accused "${accused}", but the real flaw was "${flawLabel}".`
}
