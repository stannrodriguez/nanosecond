// Design Review (spec 050): the ladder, the daily-incident seeding, the
// confidence-interval scoring, and the judgment selectors — all pure, so the
// contracts live here.

import { describe, expect, it } from 'vitest'
import { PUZZLES, TIER_LABEL, type PuzzleTier } from '../src/content/puzzles'
import { PREDICT_ROUNDS } from '../src/content/predict'
import { TASTES } from '../src/content/tastes'
import {
  addDays,
  daysBetween,
  incidentNumber,
  dailyPuzzleIndex,
  dailyPuzzle,
  shareString,
} from '../src/state/daily'
import { ciScore } from '../src/modes/review/PredictRun'
import { aggregateScore, weakestCategory, accuracy, type CatTally } from '../src/state/judgment'

describe('flaw ladder', () => {
  it('has the v1 target of 12 puzzles', () => {
    expect(PUZZLES.length).toBe(12)
  })

  it('is served in non-decreasing difficulty (obvious → subtle → interacting → fine)', () => {
    const rank: Record<PuzzleTier, number> = { obvious: 0, subtle: 1, interacting: 2, fine: 3 }
    const ranks = PUZZLES.map((p) => rank[p.tier])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('covers every rung, including at least one "actually fine"', () => {
    const tiers = new Set(PUZZLES.map((p) => p.tier))
    for (const t of ['obvious', 'subtle', 'interacting', 'fine'] as PuzzleTier[]) expect(tiers.has(t), t).toBe(true)
    expect(PUZZLES.filter((p) => p.fine).length).toBeGreaterThanOrEqual(1)
    // a fine puzzle is exactly one where fine === true
    for (const p of PUZZLES) expect(!!p.fine).toBe(p.tier === 'fine')
    expect(Object.keys(TIER_LABEL)).toHaveLength(4)
  })

  it('keeps the seed Sawtooth scheduler first (deep links + e2e)', () => {
    expect(PUZZLES[0].id).toBe('sawtooth')
  })

  it('every puzzle has a positive par time', () => {
    for (const p of PUZZLES) expect(p.par, p.id).toBeGreaterThan(0)
  })
})

describe('predict rounds', () => {
  it('has 6 rounds with exactly one confidence-interval round', () => {
    expect(PREDICT_ROUNDS.length).toBe(6)
    expect(PREDICT_ROUNDS.filter((r) => r.ci).length).toBe(1)
  })

  it('q2 bounds bracket the authored onset with room on each side', () => {
    for (const r of PREDICT_ROUNDS) {
      expect(r.q2.ans, r.name).toBeGreaterThan(r.q2.lo)
      expect(r.q2.ans, r.name).toBeLessThan(r.q2.hi)
    }
  })
})

describe('taste bank', () => {
  it('has the v1 target of 6 matchups', () => {
    expect(TASTES.length).toBe(6)
  })
})

describe('ciScore', () => {
  it('rewards a tight bracket that contains the truth', () => {
    expect(ciScore(38000, 42000, 40000)).toBe(100)
  })
  it('discounts a wide-but-correct bracket', () => {
    expect(ciScore(10000, 90000, 40000)).toBe(30)
    expect(ciScore(25000, 60000, 40000)).toBe(60)
  })
  it('zeroes a bracket that misses, regardless of order', () => {
    expect(ciScore(50000, 60000, 40000)).toBe(0)
    expect(ciScore(60000, 50000, 40000)).toBe(0)
  })
})

describe('daily incident seeding', () => {
  it('date math round-trips', () => {
    expect(daysBetween('2026-01-01', '2026-01-11')).toBe(10)
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(incidentNumber('2026-01-01')).toBe(1)
  })

  it('is a pure function of the date — same day, same puzzle', () => {
    const a = dailyPuzzle('2026-07-04')
    const b = dailyPuzzle('2026-07-04')
    expect(a.id).toBe(b.id)
    expect(dailyPuzzleIndex('2026-07-04', PUZZLES.length)).toBe(dailyPuzzleIndex('2026-07-04', PUZZLES.length))
  })

  it('always lands on a real puzzle index', () => {
    for (let d = 0; d < 40; d++) {
      const i = dailyPuzzleIndex(addDays('2026-01-01', d), PUZZLES.length)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(PUZZLES.length)
    }
  })

  it('varies across consecutive days (no long repeats)', () => {
    const seq = Array.from({ length: 8 }, (_, d) => dailyPuzzleIndex(addDays('2026-03-01', d), PUZZLES.length))
    expect(new Set(seq).size).toBeGreaterThan(1)
  })

  it('share string is spoiler-free (no puzzle title or flaw)', () => {
    const s = shareString('2026-07-04', true, 3)
    expect(s).toContain('Incident #')
    expect(s).toContain('streak')
    for (const p of PUZZLES) expect(s.includes(p.title)).toBe(false)
  })
})

describe('judgment selectors', () => {
  const t = (pts: number, max: number, n: number): CatTally => ({ pts, max, n })

  it('aggregates across categories', () => {
    const tally = { flaw: t(100, 200, 2), predict: t(150, 200, 1), taste: t(0, 0, 0) }
    expect(aggregateScore(tally)).toBe(Math.round((250 / 400) * 100))
    expect(accuracy(tally.taste)).toBeNull()
  })

  it('surfaces the weakest attempted category', () => {
    const tally = { flaw: t(90, 100, 1), predict: t(30, 100, 1), taste: t(0, 0, 0) }
    expect(weakestCategory(tally)).toBe('predict')
  })

  it('returns null when nothing has been graded', () => {
    const tally = { flaw: t(0, 0, 0), predict: t(0, 0, 0), taste: t(0, 0, 0) }
    expect(aggregateScore(tally)).toBeNull()
    expect(weakestCategory(tally)).toBeNull()
  })
})
