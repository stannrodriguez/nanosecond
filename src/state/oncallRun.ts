// On-Call run persistence (spec 060). The active run survives a refresh, and
// finished runs land in a history with a derivable score. Per ADR 0004 run
// state is ephemeral and stays OUT of the URL — it lives here in localStorage.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runScore } from '../content/oncall'
import type { GameState } from '../modes/oncall/engine'

export interface RunSummary {
  ts: number
  won: boolean
  actsCleared: number
  hp: number
  gold: number
  patterns: string[]
  layersCleared: number
  score: number
}

interface OnCallRunState {
  /** the in-progress run, restored on reload (null = none) */
  active: GameState | null
  /** finished runs, newest last, capped */
  history: RunSummary[]
  saveActive: (g: GameState) => void
  clearActive: () => void
  finishRun: (g: GameState) => RunSummary
}

export const summarize = (g: GameState): RunSummary => ({
  ts: Date.now(),
  won: !!g.over?.win,
  actsCleared: g.actsCleared,
  hp: g.hp,
  gold: g.gold,
  patterns: g.pats,
  layersCleared: g.layer,
  score: runScore({ actsCleared: g.actsCleared, hp: g.hp, gold: g.gold, patterns: g.pats.length, won: !!g.over?.win }),
})

export const useOnCallRun = create<OnCallRunState>()(
  persist(
    (set) => ({
      active: null,
      history: [],
      saveActive: (g) => set({ active: g }),
      clearActive: () => set({ active: null }),
      finishRun: (g) => {
        const s = summarize(g)
        set((st) => ({ active: null, history: [...st.history.slice(-49), s] }))
        return s
      },
    }),
    { name: 'nanosecond-oncall' },
  ),
)

/** Best score across all finished runs (0 if none). */
export const bestScore = (history: RunSummary[]): number =>
  history.reduce((m, r) => Math.max(m, r.score), 0)
