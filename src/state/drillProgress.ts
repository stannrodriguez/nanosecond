// Leitner-box spaced repetition for drills (spec 040). 5 boxes, localStorage.
// Box 1 = shaky (due immediately), box 5 = owned (due in 2 weeks).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Drill, DrillCategory } from '../content/drills'

export interface CardState {
  box: number // 1..5
  due: number // epoch ms
}

export interface AnswerRecord {
  id: string
  cat: DrillCategory
  /** |log10(guess) − log10(ans)| */
  err: number
  pts: number
  ts: number
}

/** Days until a card in box N comes due again. */
export const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 14] // index by box (1..5)

const DAY_MS = 86_400_000

export function nextCard(prev: CardState | undefined, pts: number, now: number): CardState {
  const box = prev?.box ?? 1
  const newBox = pts >= 75 ? Math.min(5, box + 1) : pts < 40 ? 1 : box
  return { box: newBox, due: now + BOX_INTERVAL_DAYS[newBox] * DAY_MS }
}

interface DrillProgressState {
  cards: Record<string, CardState>
  history: AnswerRecord[]
  record: (id: string, cat: DrillCategory, err: number, pts: number) => void
}

export const useDrillProgress = create<DrillProgressState>()(
  persist(
    (set) => ({
      cards: {},
      history: [],
      record: (id, cat, err, pts) =>
        set((s) => ({
          cards: { ...s.cards, [id]: nextCard(s.cards[id], pts, Date.now()) },
          history: [...s.history.slice(-499), { id, cat, err, pts, ts: Date.now() }],
        })),
    }),
    { name: 'nanosecond-drills' },
  ),
)

/**
 * Session order: due cards first (weakest box first — they need the reps),
 * then never-seen drills in bank order, then not-yet-due (soonest due first).
 */
export function buildSession(drills: Drill[], cards: Record<string, CardState>, now: number): Drill[] {
  const due = drills
    .filter((d) => cards[d.id] && cards[d.id].due <= now)
    .sort((a, b) => cards[a.id].box - cards[b.id].box || cards[a.id].due - cards[b.id].due)
  const fresh = drills.filter((d) => !cards[d.id])
  const later = drills
    .filter((d) => cards[d.id] && cards[d.id].due > now)
    .sort((a, b) => cards[a.id].due - cards[b.id].due)
  return [...due, ...fresh, ...later]
}
