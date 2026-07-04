// Content schema tests — the contracts from docs/content-pipeline.md.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NUMBERS } from '../src/content/numbers'
import { TOYS } from '../src/content/toys'
import { COMPONENTS } from '../src/content/components'
import { GLOSSARY } from '../src/content/glossary'
import { DRILLS } from '../src/content/drills'
import { PUZZLES } from '../src/content/puzzles'
import { TASTES } from '../src/content/tastes'
import { RUNGS } from '../src/content/ladder'
import { PATTERNS } from '../src/content/oncall'
import { INTERROGATIONS } from '../src/content/interrogations'
import { MANUAL, SHELVES, sectionsForShelf } from '../src/content/manual'

describe('schema: numbers database', () => {
  it('every number has a 3-step, non-empty derivation', () => {
    for (const n of NUMBERS) {
      expect(n.derivation, n.id).toHaveLength(3)
      n.derivation.forEach((s) => expect(s.trim().length, n.id).toBeGreaterThan(0))
      expect(n.boundingPhysics.trim().length, n.id).toBeGreaterThan(0)
      expect(n.confusions.trim().length, n.id).toBeGreaterThan(0)
    }
  })

  it('number ids are unique', () => {
    const ids = NUMBERS.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toy references in numbers point at real toys', () => {
    const toyIds = new Set(TOYS.map((t) => t.id))
    for (const n of NUMBERS) if (n.toyId) expect(toyIds.has(n.toyId), `${n.id} → ${n.toyId}`).toBe(true)
  })
})

describe('schema: honesty fine print', () => {
  it('every component has non-empty simplifies', () => {
    for (const c of COMPONENTS) expect(c.simplifies.trim().length, c.id).toBeGreaterThan(20)
  })
  it('every toy has non-empty simplifies', () => {
    for (const t of TOYS) expect(t.simplifies.trim().length, t.id).toBeGreaterThan(20)
  })
})

describe('schema: toys', () => {
  it('targetNumbers reference existing numbers', () => {
    const ids = new Set(NUMBERS.map((n) => n.id))
    for (const t of TOYS) {
      expect(t.targetNumbers.length, t.id).toBeGreaterThan(0)
      t.targetNumbers.forEach((id) => expect(ids.has(id), `${t.id} → ${id}`).toBe(true))
    }
  })
  it('forgeUnlocks reference known forgeable components', () => {
    const forgeable = new Set(['cache', 'queue', 'replicas', 'shards', 'workers', 'cdn'])
    for (const t of TOYS) if (t.forgeUnlocks) expect(forgeable.has(t.forgeUnlocks), `${t.id} → ${t.forgeUnlocks}`).toBe(true)
  })
})

describe('schema: glossary coverage (law L6)', () => {
  it('every <Term k="..."> key used in src/ exists in the glossary', () => {
    const used = new Set<string>()
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(tsx?|ts)$/.test(name)) {
          const src = readFileSync(p, 'utf8')
          for (const m of src.matchAll(/<T(?:erm)?\s+k="([a-zA-Z0-9_-]+)"/g)) used.add(m[1])
          for (const m of src.matchAll(/\bk=\{?'([a-zA-Z0-9_-]+)'\}?\s*>/g)) used.add(m[1])
        }
      }
    }
    walk(join(__dirname, '../src'))
    expect(used.size).toBeGreaterThan(10)
    for (const k of used) expect(GLOSSARY[k], `missing glossary entry: ${k}`).toBeDefined()
  })

  it('glossary defs are 2+ sentences and non-circular-ish', () => {
    for (const [k, e] of Object.entries(GLOSSARY)) {
      expect(e.def.length, k).toBeGreaterThan(80)
      expect(e.name.trim().length, k).toBeGreaterThan(0)
    }
  })

  it('component term keys exist', () => {
    for (const c of COMPONENTS) expect(GLOSSARY[c.termKey], c.id).toBeDefined()
  })

  it('glossary has the v1 target of 60 entries', () => {
    expect(Object.keys(GLOSSARY).length).toBeGreaterThanOrEqual(60)
  })

  it('no orphan glossary entries: every key is taught somewhere in copy', () => {
    // Terms whose in-copy teaching lives in On-Call pattern/event cards (plain
    // strings, not JSX) until those specs land. Keep this list shrinking.
    const ALLOWED_UNREFERENCED = new Set(['canary', 'bluegreen', 'autoscaling'])
    const used = new Set<string>()
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.(tsx?|ts)$/.test(name)) {
          const src = readFileSync(p, 'utf8')
          for (const m of src.matchAll(/<T(?:erm)?\s+k="([a-zA-Z0-9_-]+)"/g)) used.add(m[1])
          for (const m of src.matchAll(/termKey:\s*'([a-zA-Z0-9_-]+)'/g)) used.add(m[1])
        }
      }
    }
    walk(join(__dirname, '../src'))
    for (const k of Object.keys(GLOSSARY)) {
      if (ALLOWED_UNREFERENCED.has(k)) continue
      expect(used.has(k), `glossary entry never taught in copy: ${k}`).toBe(true)
    }
  })
})

describe('schema: drills', () => {
  it('every drill has a 3-step derivation and valid number refs', () => {
    const ids = new Set(NUMBERS.map((n) => n.id))
    for (const d of DRILLS) {
      expect(d.derive).toHaveLength(3)
      expect(d.numbersRefs.length, d.q).toBeGreaterThan(0)
      d.numbersRefs.forEach((id) => expect(ids.has(id), `${d.q} → ${id}`).toBe(true))
      expect(d.ans).toBeGreaterThan(0)
      expect(Math.log10(d.ans)).toBeGreaterThanOrEqual(d.loExp)
      expect(Math.log10(d.ans)).toBeLessThanOrEqual(d.hiExp)
    }
  })

  it('bank has 60 drills, ~10 per category, unique stable ids', () => {
    expect(DRILLS.length).toBe(60)
    const ids = DRILLS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    const counts = new Map<string, number>()
    for (const d of DRILLS) counts.set(d.cat, (counts.get(d.cat) ?? 0) + 1)
    expect(counts.size).toBe(6)
    for (const [cat, n] of counts) {
      expect(n, cat).toBeGreaterThanOrEqual(8)
      expect(n, cat).toBeLessThanOrEqual(12)
    }
  })

  it('slider bounds give the answer honest room on both sides', () => {
    for (const d of DRILLS) {
      const logAns = Math.log10(d.ans)
      expect(logAns - d.loExp, d.id).toBeGreaterThanOrEqual(0.5)
      expect(d.hiExp - logAns, d.id).toBeGreaterThanOrEqual(0.5)
    }
  })
})

describe('schema: flaw puzzles', () => {
  it('flaw node exists, frames tell a 4-6 beat story, fix + soundbite present', () => {
    for (const p of PUZZLES) {
      expect(p.nodes.some((n) => n.id === p.flaw), p.id).toBe(true)
      expect(p.frames.length, p.id).toBeGreaterThanOrEqual(4)
      expect(p.frames.length, p.id).toBeLessThanOrEqual(6)
      expect(p.reqs.trim().length, p.id).toBeGreaterThan(0)
      expect(p.explain.trim().length, p.id).toBeGreaterThan(40)
      expect(p.fix.trim().length, p.id).toBeGreaterThan(40)
      expect(p.line.trim().length, p.id).toBeGreaterThan(20)
      // every edge references real nodes
      const nodeIds = new Set(p.nodes.map((n) => n.id))
      p.edges.forEach((e) => {
        expect(nodeIds.has(e.a), `${p.id} edge ${e.a}`).toBe(true)
        expect(nodeIds.has(e.b), `${p.id} edge ${e.b}`).toBe(true)
      })
    }
  })
})

describe('schema: taste tests (law L5)', () => {
  it('exactly one ok justification, and a mandatory Tables Turn', () => {
    for (const t of TASTES) {
      expect(t.whys.filter((w) => w.ok).length, t.prompt).toBe(1)
      expect(t.whys.length, t.prompt).toBe(4)
      expect(t.flip.trim().length, t.prompt).toBeGreaterThan(40)
      expect(/\d/.test(t.prompt), `prompt needs numbers: ${t.prompt}`).toBe(true)
    }
  })
})

describe('schema: concept library (docs/content-pipeline.md §7)', () => {
  it('has the v1 catalog of 27 sections across three shelves', () => {
    expect(MANUAL.length).toBe(27)
    expect(sectionsForShelf('concepts').length).toBe(8)
    expect(sectionsForShelf('technologies').length).toBe(11)
    expect(sectionsForShelf('patterns').length).toBe(8)
    // every section lives on a declared shelf
    const shelfIds = new Set(SHELVES.map((s) => s.id))
    for (const m of MANUAL) expect(shelfIds.has(m.shelf), m.id).toBe(true)
  })

  it('section ids are unique and url-safe', () => {
    const ids = MANUAL.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(/^[a-z0-9-]+$/.test(id), id).toBe(true)
  })

  it('every section has a required viz and simplifies fine print', () => {
    for (const m of MANUAL) {
      expect(m.viz, `${m.id} needs a viz`).toBeTruthy()
      expect(m.simplifies.trim().length, `${m.id} simplifies`).toBeGreaterThan(20)
      expect(m.thesis.trim().length, `${m.id} thesis`).toBeGreaterThan(0)
    }
  })

  it('related terms/toys/sections all resolve', () => {
    const toyIds = new Set(TOYS.map((t) => t.id))
    const sectionIds = new Set(MANUAL.map((m) => m.id))
    for (const m of MANUAL) {
      expect(m.related.terms.length, `${m.id} needs ≥1 term`).toBeGreaterThan(0)
      for (const k of m.related.terms) expect(GLOSSARY[k], `${m.id} → term ${k}`).toBeDefined()
      for (const t of m.related.toys ?? []) expect(toyIds.has(t), `${m.id} → toy ${t}`).toBe(true)
      for (const s of m.related.sections ?? []) expect(sectionIds.has(s), `${m.id} → section ${s}`).toBe(true)
    }
  })

  it('every section deep-links "where you\'ll feel this" into a real route', () => {
    for (const m of MANUAL) {
      expect(m.feltIn.to.startsWith('/'), `${m.id} feltIn.to`).toBe(true)
      expect(m.feltIn.cta.trim().length, `${m.id} feltIn.cta`).toBeGreaterThan(0)
    }
  })
})

describe('schema: interrogations (law L8)', () => {
  it('has the v1 catalog of 6, with unique url-safe ids', () => {
    expect(INTERROGATIONS.length).toBe(6)
    const ids = INTERROGATIONS.map((iv) => iv.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(/^[a-z0-9-]+$/.test(id), id).toBe(true)
  })

  it('each has ~10 mixed-value questions and exactly one crucial trap', () => {
    for (const iv of INTERROGATIONS) {
      expect(iv.questions.length, iv.id).toBeGreaterThanOrEqual(8)
      expect(iv.questions.length, iv.id).toBeLessThanOrEqual(12)
      expect(iv.questions.filter((q) => q.crucial).length, `${iv.id} needs exactly one crucial`).toBe(1)
      // mixed value: at least one low-signal and one high-signal question
      const vals = iv.questions.map((q) => q.value)
      expect(Math.min(...vals), `${iv.id} needs a low-value distractor`).toBeLessThanOrEqual(2)
      expect(Math.max(...vals), `${iv.id} needs a high-value question`).toBeGreaterThanOrEqual(4)
      // the crucial question is the most valuable one
      const crucial = iv.questions.find((q) => q.crucial)!
      expect(crucial.value, `${iv.id} crucial must be top-value`).toBe(Math.max(...vals))
    }
  })

  it('costs are 0.5–1.5 and you cannot afford every question', () => {
    for (const iv of INTERROGATIONS) {
      expect(iv.budget, iv.id).toBeGreaterThan(0)
      let sum = 0
      for (const q of iv.questions) {
        expect(q.cost, `${iv.id} cost`).toBeGreaterThanOrEqual(0.5)
        expect(q.cost, `${iv.id} cost`).toBeLessThanOrEqual(1.5)
        expect(q.value, `${iv.id} value`).toBeGreaterThanOrEqual(1)
        expect(q.value, `${iv.id} value`).toBeLessThanOrEqual(5)
        expect(q.reveals.trim().length, `${iv.id} reveals`).toBeGreaterThan(20)
        expect(q.changes.trim().length, `${iv.id} changes`).toBeGreaterThan(20)
        sum += q.cost
      }
      // forced prioritization: the full question list must exceed the budget
      expect(sum, `${iv.id} budget must force choices`).toBeGreaterThan(iv.budget)
    }
  })

  it('the trap and requirements matrix are wired to real questions', () => {
    for (const iv of INTERROGATIONS) {
      expect(iv.trapForUnasked.headline.trim().length, iv.id).toBeGreaterThan(0)
      expect(iv.trapForUnasked.body.trim().length, iv.id).toBeGreaterThan(40)
      expect(iv.trapForUnasked.lesson.trim().length, iv.id).toBeGreaterThan(40)
      expect(iv.requirementsMatrix.length, iv.id).toBeGreaterThan(0)
      const crucialIx = iv.questions.findIndex((q) => q.crucial)
      for (const r of iv.requirementsMatrix) {
        expect(r.req.trim().length, `${iv.id} req`).toBeGreaterThan(0)
        expect(r.fromQ, `${iv.id} fromQ range`).toBeGreaterThanOrEqual(-1)
        expect(r.fromQ, `${iv.id} fromQ range`).toBeLessThan(iv.questions.length)
      }
      // the crucial question must crystallize at least one requirement
      expect(iv.requirementsMatrix.some((r) => r.fromQ === crucialIx), `${iv.id} crucial has no requirement`).toBe(true)
    }
  })
})

describe('schema: ladder and patterns', () => {
  it('rungs reference real numbers and carry physics + why-it-matters', () => {
    const ids = new Set(NUMBERS.map((n) => n.id))
    for (const r of RUNGS) {
      expect(ids.has(r.numberId), r.name).toBe(true)
      expect(r.physics.length, r.name).toBeGreaterThanOrEqual(2)
      expect(r.matters.trim().length, r.name).toBeGreaterThan(20)
    }
  })

  it('every pattern has a real-world explanation (law L7)', () => {
    for (const p of Object.values(PATTERNS)) {
      expect(p.irl.trim().length, p.key).toBeGreaterThan(40)
      expect(p.fx.trim().length, p.key).toBeGreaterThan(10)
    }
  })
})
