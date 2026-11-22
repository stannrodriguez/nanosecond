import { useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'

/* TOY 16 — THE BRANCH PREDICTOR: a deep pipeline runs on guesses. Same loop,
   same data — sorted vs shuffled — and the sorted run is ~4× faster, because a
   predictable branch is a guess the CPU almost always gets right. Collects the
   bet the pipeline (toy 14) placed. */

const N = 64 // items in the loop
const MISPREDICT_PENALTY = 15 // cycles flushed per wrong guess (~5 ns)
const WORK_PER_ITEM = 5 // cycles of useful work per item

// Sorted data: the branch flips exactly once → predictor is right ~always.
// Shuffled: the branch is a coin flip → wrong ~half the time.
const mispredicts = (sorted: boolean) => (sorted ? 1 : Math.round(N * 0.5))

export function BranchPredictor({ onComplete }: { onComplete: () => void }) {
  const [sorted, setSorted] = useState(false)
  const [seenSorted, setSeenSorted] = useState(false)

  const choose = (s: boolean) => {
    setSorted(s)
    if (s && !seenSorted) {
      setSeenSorted(true)
      onComplete()
    }
  }

  const miss = mispredicts(sorted)
  const cycles = N * WORK_PER_ITEM + miss * MISPREDICT_PENALTY
  const baseline = N * WORK_PER_ITEM + Math.round(N * 0.5) * MISPREDICT_PENALTY
  const speedup = baseline / cycles

  // one bar per item; above threshold = branch taken. Sorted → all lows then all highs.
  const items = Array.from({ length: N }, (_, i) => (sorted ? i >= N / 2 : (i * 7 + 3) % 2 === 0))

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Put an <span className="mono">if</span> inside a tight loop and a deep pipeline cannot wait for the answer. It has to{' '}
        <b>guess</b> which path the branch will take and start running instructions down that road early. Guess right and you pay
        nothing. Guess wrong and the core flushes the pipeline and starts over, losing ~{MISPREDICT_PENALTY} cycles. Same values,{' '}
        <b>sorted vs shuffled</b>, completely change how often that bet pays off.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        {[
          [false, 'Shuffled data'],
          [true, 'Sorted data'],
        ].map(([s, label]) => (
          <button
            key={String(s)}
            onClick={() => choose(s as boolean)}
            className="mono"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: sorted === s ? C.compute : C.panelUp,
              color: sorted === s ? C.bg : C.dim,
              border: `1px solid ${sorted === s ? C.compute : C.line}`,
            }}
          >
            {label as string}
          </button>
        ))}
        <span className="mono" style={{ fontSize: 12.5, color: C.dim, alignSelf: 'center' }}>
          Mispredicts:{' '}
          <b style={{ color: miss > 5 ? C.alert : C.ok }}>
            {miss}/{N}
          </b>{' '}
          · <b style={{ color: sorted ? C.ok : C.alert, fontSize: 16 }}>{cycles}</b> cycles
          {sorted && <span style={{ color: C.ok }}> · {speedup.toFixed(1)}× faster</span>}
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
        <div className="mono" style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>
          Branch outcome per item: <span style={{ color: C.compute }}>■</span> taken · <span style={{ color: C.faint }}>■</span>{' '}
          not taken · red = wrong guess
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {items.map((taken, i) => {
            // in shuffled, roughly every other prediction is wrong; in sorted, only the one flip
            const wrong = sorted ? i === N / 2 : i % 2 === 1
            return (
              <div
                key={i}
                title={taken ? 'Branch taken' : 'Branch not taken'}
                style={{
                  width: 10,
                  height: 22,
                  borderRadius: 2,
                  background: wrong ? C.alert : taken ? C.compute : C.panelUp,
                  border: `1px solid ${wrong ? C.alert : taken ? C.compute : C.line}`,
                  opacity: wrong ? 1 : 0.85,
                }}
              />
            )
          })}
        </div>
      </div>

      <Punchline color={C.compute}>
        Same loop, same data, up to <b>~{Math.round(baseline / (N * WORK_PER_ITEM + MISPREDICT_PENALTY))}× the runtime</b>. The
        only variable is whether the CPU can <i>predict the branch</i>. With sorted data, the pattern is steady and the predictor
        is right almost every time. With shuffled data, each branch is a coin flip and half of those guesses flush the pipeline.
        That is why sorting an array before a hot loop can make it several times faster, and why <b>speculative execution</b>{' '}
        exists in the first place, including the side-channel leaks that became Spectre. Every modern CPU stays fast by placing
        bets on what you will do next.
      </Punchline>
    </div>
  )
}
