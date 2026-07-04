// Scar Journal selectors (spec 045).

import { describe, expect, it } from 'vitest'
import { buildBriefing, exportContextPack, groupByTheme, shakiestNumbers, type Scar } from '../src/state/scars'
import type { AnswerRecord } from '../src/state/drillProgress'
import { DRILLS } from '../src/content/drills'

const scar = (theme: string, ts = 0): Scar => ({
  ts,
  mode: 'drills',
  theme,
  what: 'x',
  truth: 'y',
  lesson: 'z',
})

describe('groupByTheme', () => {
  it('groups and sorts by miss count', () => {
    const gs = groupByTheme([scar('a'), scar('b'), scar('a'), scar('a'), scar('b'), scar('c')])
    expect(gs.map((g) => g.theme)).toEqual(['a', 'b', 'c'])
    expect(gs[0].scars).toHaveLength(3)
  })
})

describe('shakiestNumbers', () => {
  it('ranks drills by average log error', () => {
    const h: AnswerRecord[] = [
      { id: DRILLS[0].id, cat: DRILLS[0].cat, err: 0.1, pts: 100, ts: 0 },
      { id: DRILLS[1].id, cat: DRILLS[1].cat, err: 2.0, pts: 0, ts: 0 },
      { id: DRILLS[2].id, cat: DRILLS[2].cat, err: 0.9, pts: 40, ts: 0 },
    ]
    const s = shakiestNumbers(h, 2)
    expect(s).toHaveLength(2)
    expect(s[0].drillId).toBe(DRILLS[1].id)
    expect(s[1].drillId).toBe(DRILLS[2].id)
  })

  it('averages repeat attempts on the same drill', () => {
    const h: AnswerRecord[] = [
      { id: DRILLS[0].id, cat: DRILLS[0].cat, err: 2.0, pts: 0, ts: 0 },
      { id: DRILLS[0].id, cat: DRILLS[0].cat, err: 0.0, pts: 100, ts: 1 },
    ]
    expect(shakiestNumbers(h, 1)[0].avgErr).toBeCloseTo(1.0)
  })
})

describe('briefing + context pack', () => {
  const scars = [scar('Network'), scar('Network'), scar('Cost sanity')]
  const history: AnswerRecord[] = [{ id: DRILLS[0].id, cat: DRILLS[0].cat, err: 1.4, pts: 0, ts: 0 }]
  const bites = ['“I ack only after the side effect is durable.”']

  it('briefing has ≤5 shakiest, ≤3 blind spots, all soundbites', () => {
    const b = buildBriefing(scars, history, bites)
    expect(b.shakiest.length).toBeLessThanOrEqual(5)
    expect(b.blindSpots[0]).toEqual({ theme: 'Network', count: 2 })
    expect(b.blindSpots.length).toBeLessThanOrEqual(3)
    expect(b.soundbites).toEqual(bites)
  })

  it('context pack is valid markdown with the key sections', () => {
    const md = exportContextPack(scars, history, bites)
    expect(md).toContain('# Nanosecond — play-history context pack')
    expect(md).toContain('## Shakiest numbers')
    expect(md).toContain('## Recurring blind spots')
    expect(md).toContain('- Network — missed 2×')
    expect(md).toContain('## Soundbites')
    expect(md).toContain(bites[0])
  })

  it('context pack survives empty state', () => {
    const md = exportContextPack([], [], [])
    expect(md).toContain('(no drill history yet)')
    expect(md).toContain('(no misses logged yet)')
  })
})
