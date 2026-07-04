// Leitner scheduler unit tests (spec 040).

import { describe, expect, it } from 'vitest'
import { BOX_INTERVAL_DAYS, buildSession, nextCard, type CardState } from '../src/state/drillProgress'
import { DRILLS } from '../src/content/drills'

const DAY = 86_400_000

describe('nextCard', () => {
  it('promotes on a hit (≥75), demotes to box 1 on a bad miss (<40), holds otherwise', () => {
    const now = 1_000_000
    expect(nextCard(undefined, 100, now)).toEqual({ box: 2, due: now + 1 * DAY })
    expect(nextCard({ box: 3, due: 0 }, 75, now).box).toBe(4)
    expect(nextCard({ box: 5, due: 0 }, 100, now).box).toBe(5) // caps at 5
    expect(nextCard({ box: 4, due: 0 }, 0, now)).toEqual({ box: 1, due: now })
    expect(nextCard({ box: 3, due: 0 }, 40, now).box).toBe(3) // "same universe" holds
  })

  it('due dates follow the box intervals', () => {
    const now = 0
    for (let box = 1; box <= 4; box++) {
      const c = nextCard({ box, due: 0 }, 100, now)
      expect(c.due).toBe(BOX_INTERVAL_DAYS[box + 1] * DAY)
    }
  })
})

describe('buildSession', () => {
  it('orders due-weakest first, then unseen, then not-yet-due', () => {
    const now = 10 * DAY
    const cards: Record<string, CardState> = {
      [DRILLS[0].id]: { box: 3, due: now - DAY }, // due, stronger
      [DRILLS[1].id]: { box: 1, due: now - DAY }, // due, weakest → first
      [DRILLS[2].id]: { box: 2, due: now + DAY }, // not due → last
    }
    const session = buildSession(DRILLS, cards, now)
    expect(session[0].id).toBe(DRILLS[1].id)
    expect(session[1].id).toBe(DRILLS[0].id)
    expect(session[session.length - 1].id).toBe(DRILLS[2].id)
    // everything appears exactly once
    expect(new Set(session.map((d) => d.id)).size).toBe(DRILLS.length)
  })
})
