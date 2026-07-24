import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { C } from '../../theme'
import { GhostButton, useHover } from '../../ui/kit'
import { FindTheFlaw } from './FindTheFlaw'
import { PredictRun } from './PredictRun'
import { TasteTest } from './TasteTest'
import { DailyIncident } from './DailyIncident'
import { Interrogate } from './Interrogate'
import { PUZZLES } from '../../content/puzzles'
import { INTERROGATIONS } from '../../content/interrogations'
import { useJudgment, aggregateScore, weakestCategory, accuracy, totalAttempts, JUDG_LABEL } from '../../state/judgment'

const TABS = ['daily', 'flaw', 'predict', 'taste', 'interrogate'] as const
type ReviewTab = (typeof TABS)[number]
// Tabs whose sub-segment is a content id (ADR 0004); everything else drops it.
const SUB_TABS: Record<string, (id: string) => boolean> = {
  flaw: (id) => PUZZLES.some((p) => p.id === id),
  interrogate: (id) => INTERROGATIONS.some((q) => q.id === id),
}

// The calm redesign surfaces one puzzle. The other review activities are no
// longer top-level tabs — they live behind these quiet links (still fully
// deep-linkable at their routes).
const MORE: { id: ReviewTab; label: string }[] = [
  { id: 'daily', label: 'daily incident' },
  { id: 'predict', label: 'predict & run' },
  { id: 'taste', label: 'taste test' },
  { id: 'interrogate', label: 'interrogation' },
]

function MoreLink({ label, onClick }: { label: string; onClick: () => void }) {
  const [h, bind] = useHover()
  return (
    <button
      onClick={onClick}
      {...bind}
      className="mono"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: h ? C.net : C.dim, transition: 'color .15s' }}
    >
      {label}
    </button>
  )
}

export default function Review() {
  const { tab, sub } = useParams()
  const navigate = useNavigate()
  // Session score is no longer displayed (the title carries the pacing), so
  // onScore only needs to fan out to the graded child's judgment recorder.
  const onScore = () => {}
  if (!TABS.includes(tab as ReviewTab)) return <Navigate to="/review/flaw" replace />
  // A sub-segment only makes sense on id-bearing tabs, and must be a known id
  // (unknown ids degrade to the tab index — ADR 0004).
  if (sub && !(tab! in SUB_TABS)) return <Navigate to={`/review/${tab}`} replace />
  if (sub && tab! in SUB_TABS && !SUB_TABS[tab!](sub)) return <Navigate to={`/review/${tab}`} replace />

  if (tab === 'flaw') {
    return (
      <div>
        <FindTheFlaw key={sub ?? '_first'} puzzleId={sub} onScore={onScore} />
        <div className="mono" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 28 }}>
          <span style={{ fontSize: 10, letterSpacing: 1.5, color: C.faint }}>ALSO IN REVIEW</span>
          {MORE.map((m) => (
            <MoreLink key={m.id} label={m.label} onClick={() => navigate(`/review/${m.id}`)} />
          ))}
        </div>
        <JudgmentSummary />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <GhostButton onClick={() => navigate('/review/flaw')}>← find the flaw</GhostButton>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>DESIGN REVIEW</h1>
      </div>
      {tab === 'daily' && <DailyIncident />}
      {tab === 'predict' && <PredictRun onScore={onScore} />}
      {tab === 'taste' && <TasteTest onScore={onScore} />}
      {tab === 'interrogate' && <Interrogate key={sub ?? '_first'} id={sub} onScore={onScore} />}
      <JudgmentSummary />
    </div>
  )
}

// Aggregate judgment score across the review drills + the weakest category to
// spend tonight. Silent until you've been graded at least once.
function JudgmentSummary() {
  const tally = useJudgment((s) => s.tally)
  if (totalAttempts(tally) === 0) return null
  const agg = aggregateScore(tally)
  const weak = weakestCategory(tally)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: '10px 14px',
        marginTop: 24,
      }}
    >
      <div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.faint }}>
          JUDGMENT
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.net }}>
          {agg}
          <span style={{ fontSize: 13, color: C.dim }}>/100</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(Object.keys(JUDG_LABEL) as (keyof typeof JUDG_LABEL)[]).map((cat) => {
          const a = accuracy(tally[cat])
          const isWeak = cat === weak
          return (
            <div
              key={cat}
              className="mono"
              style={{
                fontSize: 11,
                color: a === null ? C.faint : isWeak ? C.alert : C.dim,
                border: `1px solid ${isWeak ? C.alert + '66' : C.line}`,
                borderRadius: 8,
                padding: '5px 10px',
              }}
            >
              {JUDG_LABEL[cat]} · {a === null ? '—' : `${a}%`}
              {isWeak && a !== null && <span style={{ color: C.alert }}> ← weakest</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
