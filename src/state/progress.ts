// Cross-mode player progress. localStorage-persisted (no backend, ADR-free:
// additive shape, safe to extend). The Forge (spec 070) reads `forged`.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TOYS } from '../content/toys'

interface ProgressState {
  /** toy id → completed (reached the punchline at least once) */
  toysCompleted: Record<string, boolean>
  completeToy: (id: string) => void
  /** Concept Library section id → read (spec 047) */
  sectionsRead: Record<string, boolean>
  markSectionRead: (id: string) => void
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
    }),
    { name: 'nanosecond-progress' },
  ),
)

/** Component ids the player has forged by completing the owning toy. */
export const forgedComponents = (toysCompleted: Record<string, boolean>): string[] =>
  TOYS.filter((t) => t.forgeUnlocks && toysCompleted[t.id]).map((t) => t.forgeUnlocks!)
