// Leitner scheduling for Say-it decks (spec 067). Shares the drill scheduler's
// box math (nextCard, 5 boxes, localStorage) via a grade → points mapping:
// nailed promotes, partial holds, blanked demotes to box 1 (due immediately).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nextCard, type CardState } from './drillProgress'

export type SayItGrade = 'blanked' | 'partial' | 'nailed'

// nextCard promotes at ≥75 pts, demotes below 40, holds between.
const GRADE_PTS: Record<SayItGrade, number> = { blanked: 0, partial: 50, nailed: 100 }

interface SayItProgressState {
  cards: Record<string, CardState>
  record: (id: string, grade: SayItGrade) => void
}

export const useSayItProgress = create<SayItProgressState>()(
  persist(
    (set) => ({
      cards: {},
      record: (id, grade) =>
        set((s) => ({ cards: { ...s.cards, [id]: nextCard(s.cards[id], GRADE_PTS[grade], Date.now()) } })),
    }),
    { name: 'nanosecond-sayit' },
  ),
)

/** Deck order mirrors the drill session builder: due first (weakest box
 *  first), then never-seen in authored order, then not-yet-due. */
export function orderDeck<TCard extends { id: string }>(
  deck: TCard[],
  cards: Record<string, CardState>,
  now: number,
): TCard[] {
  const due = deck
    .filter((c) => cards[c.id] && cards[c.id].due <= now)
    .sort((a, b) => cards[a.id].box - cards[b.id].box || cards[a.id].due - cards[b.id].due)
  const fresh = deck.filter((c) => !cards[c.id])
  const later = deck
    .filter((c) => cards[c.id] && cards[c.id].due > now)
    .sort((a, b) => cards[a.id].due - cards[b.id].due)
  return [...due, ...fresh, ...later]
}

/** How many of a deck's cards are due (or never seen) right now. */
export const dueCount = (ids: string[], cards: Record<string, CardState>, now: number): number =>
  ids.filter((id) => !cards[id] || cards[id].due <= now).length
