import { C } from '../../theme'
import { Panel } from '../../ui/kit'
import { TIER_LABEL, type Puzzle } from '../../content/puzzles'
import { ThisActuallyHappened } from '../../ui/ThisActuallyHappened'

/** Format a solve time against par (no fail state — pacing is just a signal). */
export function paceLabel(par: number, solveSecs: number): { text: string; col: string } {
  if (solveSecs <= par) return { text: `${fmtSecs(solveSecs)} · under par (${fmtSecs(par)}) ✓`, col: C.ok }
  if (solveSecs <= par * 1.5) return { text: `${fmtSecs(solveSecs)} · a touch over par (${fmtSecs(par)})`, col: C.compute }
  return { text: `${fmtSecs(solveSecs)} · over par (${fmtSecs(par)}) — pace it faster`, col: C.dim }
}

export function fmtSecs(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`
}

// The shared reveal: the tension (explain), the named fix, the interview line.
export function Postmortem({ p }: { p: Puzzle }) {
  return (
    <Panel style={{ marginTop: 10 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.faint, marginBottom: 8 }}>
        {TIER_LABEL[p.tier]}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{p.explain}</div>
      <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
        <span className="mono" style={{ color: C.mem, fontSize: 10.5, letterSpacing: 1.5 }}>
          THE FIX ·{' '}
        </span>
        {p.fix}
      </div>
      <div
        style={{
          marginTop: 10,
          borderLeft: `3px solid ${C.net}`,
          paddingLeft: 12,
          color: C.dim,
          fontStyle: 'italic',
          fontSize: 13.5,
          lineHeight: 1.6,
        }}
      >
        <span className="mono" style={{ color: C.net, fontSize: 10.5, letterSpacing: 1.5, fontStyle: 'normal' }}>
          SAY IT IN THE INTERVIEW ·{' '}
        </span>
        {p.line}
      </div>
      {p.happened && <ThisActuallyHappened ids={[p.happened]} />}
    </Panel>
  )
}
