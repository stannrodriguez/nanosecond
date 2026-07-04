// The Concept Library catalog (spec 047): 27 sections across three shelves,
// assembled from per-shelf files so authoring reads one shelf, not the library.
// docs/content-pipeline.md §7 is the source of truth for the catalog.

import { CONCEPTS_SECTIONS } from './concepts'
import { TECHNOLOGIES_SECTIONS } from './technologies'
import { PATTERNS_SECTIONS } from './patterns'
import { SHELVES, type ManualSection, type Shelf } from './types'

export type { ManualSection, Shelf }
export { SHELVES }

export const MANUAL: ManualSection[] = [...CONCEPTS_SECTIONS, ...TECHNOLOGIES_SECTIONS, ...PATTERNS_SECTIONS]

export const sectionById = (id: string): ManualSection | undefined => MANUAL.find((m) => m.id === id)

export const sectionsForShelf = (shelf: Shelf): ManualSection[] => MANUAL.filter((m) => m.id && m.shelf === shelf)

// Spec 020 shipped 10 sections whose ids appeared in deep links. They were
// re-shelved and merged into the 27-section catalog; this map keeps their old
// URLs (ADR 0004: deep links degrade, never 404) landing on their new home.
export const LEGACY_SECTION_IDS: Record<string, string> = {
  request: 'networking',
  internet: 'networking',
  traffic: 'scaling-writes',
  parts: 'relational-db',
  judge: 'load-balancer',
  engines: 'indexing',
  rw: 'caching',
  replication: 'relational-db',
  partitioning: 'sharding',
  delivery: 'long-running-tasks',
}

/** Resolve an incoming :sectionId to a live section id, following legacy aliases. */
export const resolveSectionId = (id: string | undefined): string | undefined => {
  if (!id) return undefined
  if (sectionById(id)) return id
  return LEGACY_SECTION_IDS[id]
}
