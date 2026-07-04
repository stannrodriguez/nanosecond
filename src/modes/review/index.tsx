import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { C } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { FindTheFlaw } from './FindTheFlaw'
import { PredictRun } from './PredictRun'
import { TasteTest } from './TasteTest'
import { DailyIncident } from './DailyIncident'
import { PUZZLES } from '../../content/puzzles'
import { useJudgment, aggregateScore, weakestCategory, accuracy, totalAttempts, JUDG_LABEL } from '../../state/judgment'

const TABS = ['daily', 'flaw', 'predict', 'taste'] as const
type ReviewTab = (typeof TABS)[number]

export default function Review() {
  const { tab, sub } = useParams()
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const add = (n: number) => setScore((s) => s + n)
  if (!TABS.includes(tab as ReviewTab)) return <Navigate to="/review/flaw" replace />
  // Unknown puzzle id under the flaw tab degrades to the tab index (ADR 0004).
  if (tab === 'flaw' && sub && !PUZZLES.some((p) => p.id === sub)) return <Navigate to="/review/flaw" replace />
  // Sub-segments only make sense on the flaw tab.
  if (tab !== 'flaw' && sub) return <Navigate to={`/review/${tab}`} replace />
  return (
    <div style={{ maxWidth: 820 }}>
      <ModeHeader title="DESIGN REVIEW" thesis={`the judgment gym · session score ${score}`}>
        <TabNav
          tabs={[
            { id: 'daily', label: '01 · DAILY INCIDENT', sub: 'one shot, date-seeded', ch: C.gold },
            { id: 'flaw', label: '02 · FIND THE FLAW', sub: 'smell the bug before traffic does' },
            { id: 'predict', label: '03 · PREDICT & RUN', sub: 'commit, then face the sim' },
            { id: 'taste', label: '04 · TASTE TEST', sub: 'right answer, right reason' },
          ]}
          active={tab!}
          onPick={(id) => navigate(`/review/${id}`)}
        />
      </ModeHeader>
      <JudgmentSummary />
      {tab === 'daily' && <DailyIncident />}
      {tab === 'flaw' && <FindTheFlaw key={sub ?? '_first'} puzzleId={sub} onScore={add} />}
      {tab === 'predict' && <PredictRun onScore={add} />}
      {tab === 'taste' && <TasteTest onScore={add} />}
    </div>
  )
}

// Aggregate judgment score across the three drills + the weakest category to
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
        marginBottom: 16,
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
