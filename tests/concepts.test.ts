// Concept registry integrity (spec 042, docs/content-pipeline.md §8).
// The registry is the spine cross-mode links hang off; a dangling reference
// here means a dead link in the UI, so every reference must resolve.

import { describe, expect, it } from 'vitest'
import { CONCEPTS, conceptForToy, drillsForConcept } from '../src/content/concepts'
import { TOYS } from '../src/content/toys'
import { MANUAL } from '../src/content/manual'
import { GLOSSARY } from '../src/content/glossary'
import { NUMBERS } from '../src/content/numbers'

describe('concept registry', () => {
  it('concept ids are unique', () => {
    const ids = CONCEPTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every toyId resolves and no toy is claimed twice', () => {
    const toyIds = new Set(TOYS.map((t) => t.id))
    const claimed = CONCEPTS.filter((c) => c.toyId).map((c) => c.toyId)
    for (const id of claimed) expect(toyIds.has(id!), `toy ${id}`).toBe(true)
    expect(new Set(claimed).size).toBe(claimed.length)
  })

  it('every toy belongs to exactly one concept with a matching channel', () => {
    for (const t of TOYS) {
      const c = conceptForToy(t.id)
      expect(c, `toy ${t.id} has no concept`).toBeDefined()
      expect(c!.ch, `toy ${t.id} channel`).toBe(t.ch)
    }
  })

  it('every manualId resolves to a briefing', () => {
    const manualIds = new Set(MANUAL.map((m) => m.id))
    for (const c of CONCEPTS) if (c.manualId) expect(manualIds.has(c.manualId), `${c.id} → ${c.manualId}`).toBe(true)
  })

  it('every termKey resolves to a glossary entry', () => {
    for (const c of CONCEPTS) {
      expect(c.termKeys.length, `${c.id} needs ≥1 term`).toBeGreaterThan(0)
      for (const k of c.termKeys) expect(GLOSSARY[k], `${c.id} → term ${k}`).toBeDefined()
    }
  })

  it('every numberId resolves', () => {
    const numberIds = new Set(NUMBERS.map((n) => n.id))
    for (const c of CONCEPTS) {
      expect(c.numberIds.length, `${c.id} needs ≥1 number`).toBeGreaterThan(0)
      for (const id of c.numberIds) expect(numberIds.has(id), `${c.id} → number ${id}`).toBe(true)
    }
  })

  it('every concept reaches at least one drill through its numbers', () => {
    for (const c of CONCEPTS) expect(drillsForConcept(c).length, `${c.id} reaches no drills`).toBeGreaterThan(0)
  })
})
