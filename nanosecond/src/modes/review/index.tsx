import { useState } from 'react'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { FindTheFlaw } from './FindTheFlaw'
import { PredictRun } from './PredictRun'
import { TasteTest } from './TasteTest'

export default function Review() {
  const [mode, setMode] = useState('flaw')
  const [score, setScore] = useState(0)
  const add = (n: number) => setScore((s) => s + n)
  return (
    <div style={{ maxWidth: 820 }}>
      <ModeHeader title="DESIGN REVIEW" thesis={`the judgment gym · score ${score}`}>
        <TabNav
          tabs={[
            { id: 'flaw', label: '01 · FIND THE FLAW', sub: 'smell the bug before traffic does' },
            { id: 'predict', label: '02 · PREDICT & RUN', sub: 'commit, then face the sim' },
            { id: 'taste', label: '03 · TASTE TEST', sub: 'right answer, right reason' },
          ]}
          active={mode}
          onPick={setMode}
        />
      </ModeHeader>
      {mode === 'flaw' && <FindTheFlaw onScore={add} />}
      {mode === 'predict' && <PredictRun onScore={add} />}
      {mode === 'taste' && <TasteTest onScore={add} />}
    </div>
  )
}
