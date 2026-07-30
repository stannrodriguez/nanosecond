// Concept Library section contract (docs/content-pipeline.md §7). Every section
// teaches through an interactive/animated `viz` the player can poke; `body` is
// prose that annotates the viz, never the reverse. Split across three shelves so
// future authoring reads one shelf (concepts.tsx / technologies.tsx /
// patterns.tsx), not the whole library.

import type { ReactNode } from 'react'

export type Shelf = 'concepts' | 'technologies' | 'patterns'

export const SHELVES: { id: Shelf; label: string; blurb: string }[] = [
  { id: 'concepts', label: 'Core Concepts', blurb: 'the load-bearing ideas' },
  { id: 'technologies', label: 'Key Technologies', blurb: 'the parts you reach for' },
  { id: 'patterns', label: 'Common Patterns', blurb: 'shapes that recur' },
]

/** Spec 069: one viz-led block of a multi-block briefing (content-pipeline §7,
 *  "three registers"). Blocks render in order: numbered heading → prose → viz →
 *  fine print. A block without a viz is allowed (e.g. a hand-off block), but a
 *  block WITH one must carry `simplifies` (schema test). */
export interface SectionBlock {
  heading: string
  body: ReactNode
  viz?: ReactNode
  simplifies?: string
}

export interface ManualSection {
  id: string
  shelf: Shelf
  title: string
  /** the one-line question this section answers */
  thesis: string
  /** prose that annotates the viz (JSX, every jargon word a <Term>) */
  body: ReactNode
  /** REQUIRED interactive/animated visualization — a section without one is not authorable */
  viz: ReactNode
  /** honesty fine print for the viz (docs/architecture.md) */
  simplifies: string
  /** Spec 069: deep briefings render these blocks IN PLACE OF body/viz/
   *  simplifies (which stay required — point them at block 1's content so
   *  single-block sections and their tests are untouched). */
  blocks?: SectionBlock[]
  related: {
    toys?: string[] // ids into content/toys.ts
    terms: string[] // keys into content/glossary.ts (≥1)
    sections?: string[] // ids into other sections
  }
  /** Spec 068: a glossary group id whose entries render ON the briefing page
   *  (name + say-sentence, expandable to def/reachFor/trap) — the player
   *  studies a topic where it lives instead of leaving for Reference. */
  termShelf?: string
  /** "where you'll feel this": a working deep link into another mode */
  feltIn: { note: ReactNode; to: string; cta: string }
}
