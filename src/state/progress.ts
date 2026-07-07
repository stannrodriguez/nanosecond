// Cross-mode player progress. localStorage-persisted (no backend, ADR-free:
// additive shape, safe to extend). The Forge (spec 070) reads `forged`.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressState {
  /** toy id → completed (reached the punchline at least once) */
  toysCompleted: Record<string, boolean>
  completeToy: (id: string) => void
  /** Concept Library section id → read (spec 047) */
  sectionsRead: Record<string, boolean>
  markSectionRead: (id: string) => void
  /** toy id → the forecast option index the player locked in (spec 084) */
  forecasts: Record<string, number>
  recordForecast: (id: string, ix: number) => void
  /** component id → forged (toy done + mini-challenge passed, spec 070) */
  forged: Record<string, boolean>
  forgeComponent: (component: string) => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      toysCompleted: {},
      completeToy: (id) =>
        set((s) => (s.toysCompleted[id] ? s : { toysCompleted: { ...s.toysCompleted, [id]: true } })),
      sectionsRead: {},
      markSectionRead: (id) =>
        set((s) => (s.sectionsRead[id] ? s : { sectionsRead: { ...s.sectionsRead, [id]: true } })),
      forecasts: {},
      // lock-in: a call, once made, is the record — never silently overwritten
      recordForecast: (id, ix) =>
        set((s) => (s.forecasts[id] !== undefined ? s : { forecasts: { ...s.forecasts, [id]: ix } })),
      forged: {},
      forgeComponent: (component) =>
        set((s) => (s.forged[component] ? s : { forged: { ...s.forged, [component]: true } })),
    }),
    { name: 'nanosecond-progress' },
  ),
)

/** Component ids the player has forged (mini-challenge passed). */
export const forgedComponents = (forged: Record<string, boolean>): string[] =>
  Object.keys(forged).filter((c) => forged[c])
