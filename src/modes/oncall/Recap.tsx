import { C } from '../../theme'
import { Button } from '../../ui/kit'
import { ThisActuallyHappened } from '../../ui/ThisActuallyHappened'
import { PATTERNS, SCORE } from '../../content/oncall'
import type { GameState } from './engine'
import type { RunSummary } from '../../state/oncallRun'

/** End-of-run recap: outcome, a derivable score breakdown, the real patterns you
 *  now know (mapped to how they work in production), and — if a boss was in the
 *  room — the public incident it was modelled on. */
export function Recap({
  g,
  summary,
  happened,
  best,
  onNew,
}: {
  g: GameState
  summary: RunSummary
  happened: string[]
  best: number
  onNew: () => void
}) {
  const w = g.over?.win
  const rows: { label: string; val: number }[] = [
    { label: `${summary.actsCleared} act(s) cleared × ${SCORE.perAct}`, val: summary.actsCleared * SCORE.perAct },
    { label: `${Math.max(0, g.hp)} error budget × ${SCORE.perHp}`, val: Math.max(0, g.hp) * SCORE.perHp },
    { label: `$${g.gold} unspent ÷ 100 × ${SCORE.perGoldHundred}`, val: Math.floor(Math.max(0, g.gold) / 100) * SCORE.perGoldHundred },
    { label: `${g.pats.length} pattern(s) × ${SCORE.perPattern}`, val: g.pats.length * SCORE.perPattern },
  ]
  if (w) rows.push({ label: 'survived to IPO', val: SCORE.survival })

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: w ? C.ok : C.alert }}>
        {w ? 'YOU SURVIVED TO IPO' : 'PAGED OUT'}
      </div>
      <p style={{ color: C.dim, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
        {w
          ? `Three acts, three bosses, and the system held to the bell. Final error budget: ${g.hp}/100 with $${g.gold} unspent.`
          : g.over?.why}
      </p>

      {/* score */}
      <div style={{ textAlign: 'left', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 20 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.gold, marginBottom: 10 }}>
          RUN SCORE
        </div>
        {rows.map((r) => (
          <div key={r.label} className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.dim, padding: '2px 0' }}>
            <span>{r.label}</span>
            <span style={{ color: C.text }}>{r.val}</span>
          </div>
        ))}
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: C.gold, borderTop: `1px solid ${C.line}`, marginTop: 8, paddingTop: 8 }}>
          <span>SCORE</span>
          <span>{summary.score}</span>
        </div>
        {best > 0 && (
          <div className="mono" style={{ fontSize: 11.5, color: C.faint, marginTop: 6 }}>
            best so far: {Math.max(best, summary.score)}
            {summary.score >= best && summary.score > 0 ? ' — new best ★' : ''}
          </div>
        )}
      </div>

      {happened.length > 0 && <ThisActuallyHappened ids={happened} />}

      {g.pats.length > 0 && (
        <div style={{ textAlign: 'left', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 10 }}>
            PATTERNS YOU NOW KNOW — THESE ARE REAL
          </div>
          {g.pats.map((k) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <span style={{ color: C.net, fontWeight: 600, fontSize: 13.5 }}>
                {PATTERNS[k].icon} {PATTERNS[k].name}
              </span>
              <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{PATTERNS[k].irl}</div>
            </div>
          ))}
        </div>
      )}

      <Button size="lg" style={{ marginTop: 22, padding: '12px 28px' }} onClick={onNew}>
        New run
      </Button>
    </div>
  )
}
