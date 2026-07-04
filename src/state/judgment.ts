// Judgment score (spec 050): the Design Review gym tracks how you're doing
// across its three drills so it can surface an aggregate and your weakest
// category — the "where to spend tonight" signal. Persisted, pure selectors.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type JudgCat = 'flaw' | 'predict' | 'taste'

export const JUDG_LABEL: Record<JudgCat, string> = {
  flaw: 'Find the Flaw',
  predict: 'Predict & Run',
  taste: 'Taste Test',
}

export interface CatTally {
  /** points earned */
  pts: number
  /** points available across all attempts */
  max: number
  /** number of graded attempts */
  n: number
}

const zero = (): CatTally => ({ pts: 0, max: 0, n: 0 })

interface JudgState {
  tally: Record<JudgCat, CatTally>
  /** record one graded attempt in a category */
  record: (cat: JudgCat, pts: number, max: number) => void
  reset: () => void
}

export const useJudgment = create<JudgState>()(
  persist(
    (set) => ({
      tally: { flaw: zero(), predict: zero(), taste: zero() },
      record: (cat, pts, max) =>
        set((st) => {
          const cur = st.tally[cat]
          return {
            tally: {
              ...st.tally,
              [cat]: { pts: cur.pts + pts, max: cur.max + max, n: cur.n + 1 },
            },
          }
        }),
      reset: () => set({ tally: { flaw: zero(), predict: zero(), taste: zero() } }),
    }),
    { name: 'nanosecond-judgment' },
  ),
)

/* ---------------- selectors (pure, unit-tested) ---------------- */

/** Category accuracy as a percentage (0..100), or null if never attempted. */
export function accuracy(t: CatTally): number | null {
  return t.max > 0 ? Math.round((t.pts / t.max) * 100) : null
}

/** Aggregate judgment score across all three drills, 0..100 (null if none). */
export function aggregateScore(tally: Record<JudgCat, CatTally>): number | null {
  const pts = Object.values(tally).reduce((a, c) => a + c.pts, 0)
  const max = Object.values(tally).reduce((a, c) => a + c.max, 0)
  return max > 0 ? Math.round((pts / max) * 100) : null
}

/** Total graded attempts across the gym. */
export function totalAttempts(tally: Record<JudgCat, CatTally>): number {
  return Object.values(tally).reduce((a, c) => a + c.n, 0)
}

/**
 * The category most worth practicing: lowest accuracy among those attempted.
 * null until at least one category has a graded attempt.
 */
export function weakestCategory(tally: Record<JudgCat, CatTally>): JudgCat | null {
  const scored = (Object.keys(tally) as JudgCat[])
    .map((cat) => ({ cat, acc: accuracy(tally[cat]) }))
    .filter((x): x is { cat: JudgCat; acc: number } => x.acc !== null)
  if (!scored.length) return null
  return scored.sort((a, b) => a.acc - b.acc)[0].cat
}
