import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { FindTheFlaw } from './FindTheFlaw'
import { PredictRun } from './PredictRun'
import { TasteTest } from './TasteTest'

export default function Review() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const add = (n: number) => setScore((s) => s + n)
  if (tab !== 'flaw' && tab !== 'predict' && tab !== 'taste') return <Navigate to="/review/flaw" replace />
  return (
    <div style={{ maxWidth: 820 }}>
      <ModeHeader title="DESIGN REVIEW" thesis={`the judgment gym · score ${score}`}>
        <TabNav
          tabs={[
            { id: 'flaw', label: '01 · FIND THE FLAW', sub: 'smell the bug before traffic does' },
            { id: 'predict', label: '02 · PREDICT & RUN', sub: 'commit, then face the sim' },
            { id: 'taste', label: '03 · TASTE TEST', sub: 'right answer, right reason' },
          ]}
          active={tab}
          onPick={(id) => navigate(`/review/${id}`)}
        />
      </ModeHeader>
      {tab === 'flaw' && <FindTheFlaw onScore={add} />}
      {tab === 'predict' && <PredictRun onScore={add} />}
      {tab === 'taste' && <TasteTest onScore={add} />}
    </div>
  )
}
