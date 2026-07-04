// The Scar Journal (spec 045): every miss, everywhere, auto-logged with its
// lesson. Views and the pre-interview briefing are pure selectors over this.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DRILLS } from '../content/drills'
import { DRILL_CATEGORIES, type DrillCategory } from '../content/drills'
import type { AnswerRecord } from './drillProgress'

export type ScarMode = 'drills' | 'flaw' | 'predict' | 'taste' | 'builder' | 'oncall' | 'interrogation'

export const SCAR_MODE_LABEL: Record<ScarMode, string> = {
  drills: 'Drills',
  flaw: 'Find the Flaw',
  predict: 'Predict & Run',
  taste: 'Taste Test',
  builder: 'The Builder',
  oncall: 'On-Call',
  interrogation: 'Interrogation',
}

export interface Scar {
  ts: number
  mode: ScarMode
  /** recurring-theme tag: drill category, puzzle id, scenario name… */
  theme: string
  /** what you predicted / accused / built */
  what: string
  truth: string
  /** one line, pulled from the content that owned the challenge */
  lesson: string
}

/** A 60-second teach-back: after a solve you narrate the fix, then self-score
 *  a 3-item rubric (did I name the mechanism, the tradeoff, a number?). */
export interface TeachBack {
  ts: number
  mode: ScarMode
  /** what you taught back (puzzle/scenario title) */
  topic: string
  rubric: { mechanism: boolean; tradeoff: boolean; number: boolean }
  /** 0..3 self-rubric points */
  score: number
}

interface ScarState {
  scars: Scar[]
  /** interview-ready lines collected from solved/revealed content */
  soundbites: string[]
  /** self-scored teach-backs, newest last */
  teachBacks: TeachBack[]
  addScar: (s: Omit<Scar, 'ts'>) => void
  addSoundbite: (line: string) => void
  addTeachBack: (t: Omit<TeachBack, 'ts'>) => void
}

export const useScars = create<ScarState>()(
  persist(
    (set) => ({
      scars: [],
      soundbites: [],
      teachBacks: [],
      addScar: (s) => set((st) => ({ scars: [...st.scars.slice(-499), { ...s, ts: Date.now() }] })),
      addSoundbite: (line) =>
        set((st) => (st.soundbites.includes(line) ? st : { soundbites: [...st.soundbites, line] })),
      addTeachBack: (t) => set((st) => ({ teachBacks: [...st.teachBacks.slice(-199), { ...t, ts: Date.now() }] })),
    }),
    { name: 'nanosecond-scars' },
  ),
)

/* ---------------- selectors (pure, unit-tested) ---------------- */

export interface ThemeGroup {
  theme: string
  scars: Scar[]
}

export function groupByTheme(scars: Scar[]): ThemeGroup[] {
  const map = new Map<string, Scar[]>()
  for (const s of scars) map.set(s.theme, [...(map.get(s.theme) ?? []), s])
  return [...map.entries()]
    .map(([theme, list]) => ({ theme, scars: list }))
    .sort((a, b) => b.scars.length - a.scars.length)
}

export interface ShakyNumber {
  drillId: string
  q: string
  unit: string
  ans: number
  avgErr: number
  attempts: number
}

/** The 5 drills you're worst at, by average log-error (needs ≥1 attempt). */
export function shakiestNumbers(history: AnswerRecord[], n = 5): ShakyNumber[] {
  const byId = new Map<string, { errSum: number; n: number }>()
  for (const r of history) {
    const cur = byId.get(r.id) ?? { errSum: 0, n: 0 }
    byId.set(r.id, { errSum: cur.errSum + r.err, n: cur.n + 1 })
  }
  return [...byId.entries()]
    .map(([id, { errSum, n: count }]) => {
      const d = DRILLS.find((x) => x.id === id)
      return d ? { drillId: id, q: d.q, unit: d.unit, ans: d.ans, avgErr: errSum / count, attempts: count } : null
    })
    .filter((x): x is ShakyNumber => !!x)
    .sort((a, b) => b.avgErr - a.avgErr)
    .slice(0, n)
}

export interface Briefing {
  shakiest: ShakyNumber[]
  blindSpots: { theme: string; count: number }[]
  soundbites: string[]
  totalScars: number
}

export function buildBriefing(scars: Scar[], history: AnswerRecord[], soundbites: string[]): Briefing {
  return {
    shakiest: shakiestNumbers(history, 5),
    blindSpots: groupByTheme(scars)
      .slice(0, 3)
      .map((g) => ({ theme: g.theme, count: g.scars.length })),
    soundbites,
    totalScars: scars.length,
  }
}

const fmtAns = (n: number) => (n >= 1e6 ? n.toExponential(1) : n.toLocaleString())

/** Markdown play-history summary for LLM mock interviews. */
export function exportContextPack(scars: Scar[], history: AnswerRecord[], soundbites: string[]): string {
  const b = buildBriefing(scars, history, soundbites)
  const catLine = (Object.keys(DRILL_CATEGORIES) as DrillCategory[])
    .map((cat) => {
      const h = history.filter((r) => r.cat === cat)
      if (!h.length) return null
      const avg = Math.round(h.reduce((a, r) => a + r.pts, 0) / h.length)
      return `- ${DRILL_CATEGORIES[cat]}: avg ${avg}/100 over ${h.length} answers`
    })
    .filter(Boolean)
    .join('\n')

  const lines: string[] = [
    '# Nanosecond — play-history context pack',
    '',
    'Paste this into an LLM mock interviewer so it can probe my actual weak spots.',
    '',
    `Totals: ${history.length} drills answered · ${scars.length} logged misses · ${soundbites.length} soundbites collected.`,
    '',
    '## Shakiest numbers (drill me on these)',
    ...(b.shakiest.length
      ? b.shakiest.map(
          (s) => `- ${s.q} → **${fmtAns(s.ans)} ${s.unit}** (my avg error: ${s.avgErr.toFixed(1)} orders of magnitude, ${s.attempts}×)`,
        )
      : ['- (no drill history yet)']),
    '',
    '## Recurring blind spots',
    ...(b.blindSpots.length ? b.blindSpots.map((t) => `- ${t.theme} — missed ${t.count}×`) : ['- (no misses logged yet)']),
    '',
    '## Drill calibration by category',
    catLine || '- (no drill history yet)',
    '',
    '## Recent misses (what I got wrong, and the lesson)',
    ...scars
      .slice(-15)
      .reverse()
      .map((s) => `- [${SCAR_MODE_LABEL[s.mode]}] I said "${s.what}"; truth: "${s.truth}". Lesson: ${s.lesson}`),
    '',
    '## Soundbites I can deploy',
    ...(soundbites.length ? soundbites.map((s) => `- ${s}`) : ['- (none collected yet)']),
    '',
  ]
  return lines.join('\n')
}
