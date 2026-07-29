// Cross-mode player progress. localStorage-persisted (no backend, ADR-free:
// additive shape, safe to extend). The Forge (spec 070) reads `forged`.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FORGE } from '../content/forge'

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
  /** component id → forged (toy played AND its mini-challenge answered, spec 070) */
  forged: Record<string, boolean>
  forgeComponent: (componentId: string) => void
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
      forgeComponent: (componentId) =>
        set((s) => (s.forged[componentId] ? s : { forged: { ...s.forged, [componentId]: true } })),
    }),
    { name: 'nanosecond-progress' },
  ),
)

/** Component ids the player has forged. The Builder and On-Call gate on this. */
export const forgedComponents = (forged: Record<string, boolean>): string[] =>
  FORGE.filter((f) => forged[f.id]).map((f) => f.id)

/**
 * The Forge gate (product-spec §3.8): a part is usable once its mini-challenge
 * is answered. Parts with no forge entry (load balancer, app servers) are
 * always available — you cannot build anything without them.
 */
export const isForged = (forged: Record<string, boolean>, componentId: string | null): boolean =>
  componentId === null || !!forged[componentId]
