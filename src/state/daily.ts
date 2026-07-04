// Daily Incident (spec 050 · product-spec §3.5): one flaw puzzle per calendar
// day, chosen by a DATE SEED (never Math.random — everyone gets the same
// incident, and refreshing can't reroll it). Tracks a solve streak and a
// spoiler-free share string. Pure date helpers so selection is testable.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PUZZLES } from '../content/puzzles'

const EPOCH = '2026-01-01' // Incident #1

const asUTC = (dateStr: string): number => Date.parse(`${dateStr}T00:00:00Z`)

/** Today's local calendar date as YYYY-MM-DD (the seed input). */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole days between two YYYY-MM-DD dates (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((asUTC(b) - asUTC(a)) / 86_400_000)
}

/** Shift a YYYY-MM-DD date by n days. */
export function addDays(dateStr: string, n: number): string {
  const t = asUTC(dateStr) + n * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

/** Sequential incident number for a date (Incident #1 == EPOCH). */
export function incidentNumber(dateStr: string): number {
  return daysBetween(EPOCH, dateStr) + 1
}

/**
 * Deterministic puzzle index for a date. A small integer hash of the incident
 * number spreads consecutive days apart (so two days running rarely repeat),
 * then folds into the catalog size.
 */
export function dailyPuzzleIndex(dateStr: string, count: number): number {
  const n = incidentNumber(dateStr)
  const h = (n * 2654435761) >>> 0 // Knuth multiplicative hash, kept in uint32
  return h % count
}

/** The Puzzle for a given day. */
export function dailyPuzzle(dateStr: string) {
  return PUZZLES[dailyPuzzleIndex(dateStr, PUZZLES.length)]
}

export interface DailyResult {
  solved: boolean
  puzzleId: string
}

interface DailyState {
  results: Record<string, DailyResult>
  streak: number
  bestStreak: number
  lastPlayed: string | null
  /** Record the (one-shot) result for a date; updates the streak. */
  record: (dateStr: string, solved: boolean, puzzleId: string) => void
}

export const useDaily = create<DailyState>()(
  persist(
    (set) => ({
      results: {},
      streak: 0,
      bestStreak: 0,
      lastPlayed: null,
      record: (dateStr, solved, puzzleId) =>
        set((st) => {
          if (st.results[dateStr]) return st // one shot per day
          const continuing = solved && st.results[addDays(dateStr, -1)]?.solved
          const streak = solved ? (continuing ? st.streak + 1 : 1) : 0
          return {
            results: { ...st.results, [dateStr]: { solved, puzzleId } },
            streak,
            bestStreak: Math.max(st.bestStreak, streak),
            lastPlayed: dateStr,
          }
        }),
    }),
    { name: 'nanosecond-daily' },
  ),
)

/**
 * Spoiler-free share string (Wordle-style): reveals the result and streak but
 * never which incident or its answer, so it's safe to paste anywhere.
 */
export function shareString(dateStr: string, solved: boolean, streak: number): string {
  const n = incidentNumber(dateStr)
  const mark = solved ? '🟩 caught it' : '🟥 got got'
  const fire = streak > 1 ? `  ·  🔥 ${streak}-day streak` : ''
  return `Nanosecond · Incident #${n}\n${mark}${fire}`
}
