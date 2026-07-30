// Content schema tests — the contracts from docs/content-pipeline.md.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { Fragment, createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NUMBERS } from '../src/content/numbers'
import { TOYS } from '../src/content/toys'
import { BRIEFINGS } from '../src/content/briefings'
import { STATIONS } from '../src/content/journey'
import { FLOORS } from '../src/content/stack'
import { FORECASTS } from '../src/content/forecasts'
import { COMPONENTS } from '../src/content/components'
import { GLOSSARY, REFERENCE_GROUPS } from '../src/content/glossary'
import { DRILLS } from '../src/content/drills'
import { PUZZLES } from '../src/content/puzzles'
import { TASTES } from '../src/content/tastes'
import { RUNGS } from '../src/content/ladder'
import { ACTS, ENCOUNTERS, EVENTS, HAPPENED, PATTERNS, runScore } from '../src/content/oncall'
import { INTERROGATIONS } from '../src/content/interrogations'
import { MANUAL, SHELVES, sectionsForShelf } from '../src/content/manual'
import { FORGE } from '../src/content/forge'
import { SAYIT_CARDS } from '../src/content/sayit'
import { EDGES, edgesFor } from '../src/content/edges'

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

  // coverage-map §B.4 bundles N1 + N2 (spec 071). The fill-out specs cite these ids,
  // so losing one is a broken reference somewhere downstream, not a missing nicety.
  const N1_CAPACITY_CEILINGS = [
    'cache-memory-ceiling',
    'db-storage-ceiling',
    'db-connection-ceiling',
    'app-connection-ceiling',
    'broker-storage-ceiling',
    'partition-count-ceiling',
    'container-start-time',
    'dc-bandwidth',
    'az-rtt',
    'cpu-scale-trigger',
    'shard-storage-trigger',
    'read-scale-threshold',
    'write-scale-trigger',
  ]
  const N2_STORAGE_MECHANICS = [
    'disk-page-size',
    'btree-lookup-depth',
    'lsm-write-crossover',
    'memtable-flush-size',
    'quadtree-split-threshold',
    'index-table-threshold',
    'pg-indexed-lookup-rate',
    'pg-table-row-ceiling',
    'pg-join-ceiling',
    'ddb-item-max',
    'ddb-rcu-bytes',
    'ddb-wcu-bytes',
    'ddb-partition-capacity',
    'ddb-index-maxima',
    'ddb-txn-items',
    'cassandra-quorum',
    'replication-factor',
  ]

  it('coverage-map bundles N1 and N2 are fully present', () => {
    const ids = new Set(NUMBERS.map((n) => n.id))
    for (const id of [...N1_CAPACITY_CEILINGS, ...N2_STORAGE_MECHANICS]) {
      expect(ids.has(id), `missing numbers.ts entry: ${id}`).toBe(true)
    }
  })

  // §B.4 derivation discipline: the entries whose source value arrived WITH its
  // arithmetic must ship that arithmetic. A bare value here throws away the teaching.
  it('the worked-arithmetic entries carry their arithmetic', () => {
    const worked = ['shard-storage-trigger', 'write-scale-trigger', 'cassandra-quorum', 'btree-lookup-depth', 'broker-storage-ceiling']
    for (const id of worked) {
      const n = NUMBERS.find((e) => e.id === id)!
      expect(n, id).toBeDefined()
      // the middle step is the math step (mechanism → math → result)
      expect(/[×÷=+]|\d\s*\/\s*\d/.test(n.derivation[1]), `${id} step 2 has no arithmetic`).toBe(true)
      expect((n.derivation[1].match(/\d/g) ?? []).length, `${id} step 2 has too few numbers`).toBeGreaterThan(3)
    }
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

  it('every toy declares its click — the "It\'s clicked when …" exit criterion', () => {
    for (const t of TOYS) {
      expect(t.click.startsWith("It's clicked when "), `${t.id} click must open with the shared phrasing`).toBe(true)
      expect(t.click.length, `${t.id} click too thin to self-test against`).toBeGreaterThan(60)
    }
  })
})

describe('schema: the Lab map (docs/content-pipeline.md §2)', () => {
  it('station ids are unique and every station has a name, tagline, and ≥1 toy', () => {
    const ids = STATIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of STATIONS) {
      expect(s.name.trim().length, s.id).toBeGreaterThan(0)
      expect(s.tagline, `${s.id} needs a tagline`).toBeTruthy()
      expect(s.toyIds.length, `${s.id} needs ≥1 toy`).toBeGreaterThan(0)
    }
  })

  it('every toy lives at exactly one station', () => {
    const seen = new Map<string, string>()
    for (const s of STATIONS)
      for (const id of s.toyIds) {
        expect(seen.has(id), `toy ${id} at both ${seen.get(id)} and ${s.id}`).toBe(false)
        seen.set(id, s.id)
      }
    for (const t of TOYS) expect(seen.has(t.id), `toy ${t.id} is on no station of the map`).toBe(true)
    for (const id of seen.keys()) expect(TOYS.some((t) => t.id === id), `station toy ${id} does not exist`).toBe(true)
  })

  it('station primers resolve to Concept Library sections', () => {
    const manualIds = new Set(MANUAL.map((m) => m.id))
    for (const s of STATIONS) if (s.manualId) expect(manualIds.has(s.manualId), `${s.id} → ${s.manualId}`).toBe(true)
  })
})

describe('schema: the stack (spec 081, ADR 0005)', () => {
  it('floor ids are unique and every floor has a name + gist', () => {
    const ids = FLOORS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of FLOORS) {
      expect(f.name.trim().length, f.id).toBeGreaterThan(0)
      expect(f.gist.trim().length, `${f.id} needs a two-verbs gist`).toBeGreaterThan(20)
      if (f.promised !== null) expect(f.promised.trim().length, `${f.id} promised`).toBeGreaterThan(0)
    }
  })

  it('every toy lives on exactly one floor', () => {
    const seen = new Map<string, string>()
    for (const f of FLOORS)
      for (const id of f.toyIds) {
        expect(seen.has(id), `toy ${id} on both ${seen.get(id)} and ${f.id}`).toBe(false)
        seen.set(id, f.id)
      }
    for (const t of TOYS) expect(seen.has(t.id), `toy ${t.id} is on no floor of the stack`).toBe(true)
    for (const id of seen.keys()) expect(TOYS.some((t) => t.id === id), `floor toy ${id} does not exist`).toBe(true)
  })
})

describe('schema: lab forecasts (law L3, spec 084)', () => {
  it('every toy has a forecast and every forecast has a toy', () => {
    const toyIds = new Set(TOYS.map((t) => t.id))
    for (const t of TOYS) expect(FORECASTS[t.id], `missing forecast: ${t.id}`).toBeDefined()
    for (const id of Object.keys(FORECASTS)) expect(toyIds.has(id), `forecast without a toy: ${id}`).toBe(true)
  })

  it('each forecast is a bet: a question, 3–4 options, one valid answer, a reveal', () => {
    for (const [id, f] of Object.entries(FORECASTS)) {
      expect(f.question.trim().length, `${id} question`).toBeGreaterThan(15)
      expect(f.options.length, `${id} options`).toBeGreaterThanOrEqual(3)
      expect(f.options.length, `${id} options`).toBeLessThanOrEqual(4)
      f.options.forEach((o, i) => expect(o.trim().length, `${id} option ${i}`).toBeGreaterThan(0))
      expect(new Set(f.options).size, `${id} duplicate options`).toBe(f.options.length)
      expect(Number.isInteger(f.correctIx) && f.correctIx >= 0 && f.correctIx < f.options.length, `${id} correctIx range`).toBe(true)
      expect(f.reveal.trim().length, `${id} reveal too thin`).toBeGreaterThan(20)
    }
  })
})

describe('schema: the stack — echoes', () => {
  it('briefing echoes are short, and enough exist to teach the recursion', () => {
    const render = (node: unknown) => renderToStaticMarkup(createElement(Fragment, null, node as ReactNode))
    let count = 0
    for (const [id, b] of Object.entries(BRIEFINGS)) {
      if (!b.echo) continue
      count++
      const text = render(b.echo)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      expect(text.length, `${id} echo too thin`).toBeGreaterThan(40)
      expect(text.length, `${id} echo is a wall of text`).toBeLessThan(300)
    }
    // the cross-floor recursion is the point of the stack — keep it taught
    expect(count, 'need ≥6 true echoes across the bank').toBeGreaterThanOrEqual(6)
  })
})

describe('schema: toy field briefings (law L2, docs/content-pipeline.md §2)', () => {
  // JSX copy → visible text, so the contract measures what the player reads.
  const render = (node: ReactNode) => renderToStaticMarkup(createElement(Fragment, null, node))
  const plain = (node: ReactNode) =>
    render(node)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  it('every toy has a briefing and every briefing has a toy', () => {
    const toyIds = new Set(TOYS.map((t) => t.id))
    for (const t of TOYS) expect(BRIEFINGS[t.id], `missing briefing: ${t.id}`).toBeDefined()
    for (const id of Object.keys(BRIEFINGS)) expect(toyIds.has(id), `briefing without a toy: ${id}`).toBe(true)
  })

  it('setting is a short, term-dotted preamble — never a wall of text', () => {
    for (const [id, b] of Object.entries(BRIEFINGS)) {
      const text = plain(b.setting)
      expect(text.length, `${id} setting too thin`).toBeGreaterThan(150)
      expect(text.length, `${id} setting is a wall of text`).toBeLessThan(700)
      // <Term> renders a button — at least one tappable term per setting (law L6)
      expect(render(b.setting).includes('<button'), `${id} setting dots no <Term>`).toBe(true)
    }
  })

  it('meetIt names 2–4 real technologies, each with a one-clause how', () => {
    for (const [id, b] of Object.entries(BRIEFINGS)) {
      expect(b.meetIt.length, id).toBeGreaterThanOrEqual(2)
      expect(b.meetIt.length, id).toBeLessThanOrEqual(4)
      const names = b.meetIt.map((m) => m.name)
      expect(new Set(names).size, `${id} duplicate meetIt names`).toBe(names.length)
      for (const m of b.meetIt) {
        expect(m.name.trim().length, id).toBeGreaterThan(1)
        const how = plain(m.how)
        expect(how.length, `${id} → ${m.name} how too thin`).toBeGreaterThan(20)
        expect(how.length, `${id} → ${m.name} how must stay one clause`).toBeLessThan(170)
      }
    }
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

  it('reference groups partition the glossary: every key in exactly one group', () => {
    const seen = new Map<string, string>()
    for (const g of REFERENCE_GROUPS) {
      for (const k of g.keys) {
        expect(GLOSSARY[k], `group ${g.id} references unknown key ${k}`).toBeDefined()
        expect(seen.has(k), `${k} appears in both ${seen.get(k)} and ${g.id}`).toBe(false)
        seen.set(k, g.id)
      }
    }
    for (const k of Object.keys(GLOSSARY)) {
      expect(seen.has(k), `glossary key ${k} missing from every reference group`).toBe(true)
    }
  })

  // Groups that have opted into the full speakable contract. A group joins this
  // list when its bundle lands (networking: spec 065; storage/queues/resilience:
  // spec 072; caching: spec 073) and never leaves — every key in an opted-in group
  // carries all three fields, so the Reference screen renders a speakable block for
  // the whole shelf.
  //
  // `traffic` is deliberately ABSENT, and that is not an omission. Spec 073 shipped
  // its five new traffic keys (jwt, rbac, cursor, rangerequest, apikey) with the full
  // contract, but the group's ~18 pre-existing keys are backfilled by the briefing
  // specs that own them (F7, F12). The group joins this list there. The per-key
  // assertions below still hold every one of those five to the contract.
  const SPEAKABLE_GROUPS = ['networking', 'storage', 'queues', 'resilience', 'caching']

  const SPEAKABLE_STRAGGLERS = ['jwt', 'rbac', 'cursor', 'rangerequest', 'apikey']

  it.each(SPEAKABLE_GROUPS)('the %s group carries the speakable contract', (groupId) => {
    const g = REFERENCE_GROUPS.find((x) => x.id === groupId)
    expect(g, `the ${groupId} reference group must exist`).toBeDefined()
    for (const k of g!.keys) {
      const e = GLOSSARY[k]
      expect(e.say?.trim().length, `${k}.say`).toBeGreaterThan(0)
      expect(e.reachFor?.trim().length, `${k}.reachFor`).toBeGreaterThan(0)
      expect(e.trap?.trim().length, `${k}.trap`).toBeGreaterThan(0)
    }
  })

  it.each(SPEAKABLE_STRAGGLERS)('%s carries the contract ahead of its group (spec 073)', (k) => {
    const e = GLOSSARY[k]
    expect(e, `${k} must exist`).toBeDefined()
    expect(e.say?.trim().length, `${k}.say`).toBeGreaterThan(0)
    expect(e.reachFor?.trim().length, `${k}.reachFor`).toBeGreaterThan(0)
    expect(e.trap?.trim().length, `${k}.trap`).toBeGreaterThan(0)
  })

  // §1: the trap quotes the wrong sentence and replaces it with a mechanism —
  // swapping one slogan for another is the failure mode this catches.
  it('every `trap` quotes a wrong line and supplies the replacement', () => {
    for (const [k, e] of Object.entries(GLOSSARY)) {
      if (!e.trap) continue
      expect(e.trap.startsWith('Wrong:'), `${k}.trap must open with the quoted wrong line`).toBe(true)
      // "Say '…'" or a short lead-in first ("Say how fast instead: '…'") — either
      // way the replacement must arrive as a quoted sentence, not another slogan.
      expect(/\bSay\b[^'"]{0,40}['"]/.test(e.trap), `${k}.trap must supply the replacement sentence`).toBe(true)
    }
  })

  it('every `say` is ONE sentence — if you can\'t say it in a breath, it\'s wrong', () => {
    for (const [k, e] of Object.entries(GLOSSARY)) {
      if (!e.say) continue
      const terminators = e.say.match(/[.!?](\s|$)/g) ?? []
      expect(terminators.length, `${k}.say must be a single sentence`).toBeLessThanOrEqual(1)
      expect(e.say.trim().endsWith('.'), `${k}.say should end in a period`).toBe(true)
    }
  })

  it('no orphan glossary entries: every key is taught somewhere in copy', () => {
    // Terms whose in-copy teaching lives in On-Call pattern/event cards (plain
    // strings, not JSX) until those specs land. Keep this list shrinking.
    const ALLOWED_UNREFERENCED = new Set(['canary', 'bluegreen'])
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

  it('related terms/toys all resolve', () => {
    const toyIds = new Set(TOYS.map((t) => t.id))
    for (const m of MANUAL) {
      expect(m.related.terms.length, `${m.id} needs ≥1 term`).toBeGreaterThan(0)
      for (const k of m.related.terms) expect(GLOSSARY[k], `${m.id} → term ${k}`).toBeDefined()
      for (const t of m.related.toys ?? []) expect(toyIds.has(t), `${m.id} → toy ${t}`).toBe(true)
    }
  })

  it('sections with blocks meet the block contract (spec 069)', () => {
    // block bodies may carry § links to sibling briefings, so render in a router
    const plain = (node: ReactNode) =>
      renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Fragment, null, node)))
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    for (const m of MANUAL) {
      if (!m.blocks) continue
      expect(m.blocks.length, `${m.id} needs ≥2 blocks`).toBeGreaterThanOrEqual(2)
      const withViz = m.blocks.filter((b) => b.viz)
      expect(withViz.length, `${m.id} needs ≥2 blocks with a viz`).toBeGreaterThanOrEqual(2)
      for (const b of m.blocks) {
        expect(b.heading.trim().length, `${m.id} block heading`).toBeGreaterThan(0)
        expect(plain(b.body).length, `${m.id} · ${b.heading} body empty`).toBeGreaterThan(0)
        if (b.viz) expect(b.simplifies?.trim().length, `${m.id} · ${b.heading} viz needs simplifies`).toBeGreaterThan(20)
      }
    }
    // the three-registers reference implementation (spec 069) is a deep briefing
    expect(MANUAL.find((m) => m.id === 'networking')?.blocks, 'networking must use blocks').toBeDefined()
  })

  it('termShelf, when present, resolves to a reference group (spec 068)', () => {
    const groupIds = new Set(REFERENCE_GROUPS.map((g) => g.id))
    for (const m of MANUAL) {
      if (m.termShelf) expect(groupIds.has(m.termShelf), `${m.id} → ${m.termShelf}`).toBe(true)
    }
    // the networking pilot carries its glossary group on the page
    expect(MANUAL.find((m) => m.id === 'networking')?.termShelf).toBe('networking')
  })

  it('every section deep-links "where you\'ll feel this" into a real route', () => {
    for (const m of MANUAL) {
      expect(m.feltIn.to.startsWith('/'), `${m.id} feltIn.to`).toBe(true)
      expect(m.feltIn.cta.trim().length, `${m.id} feltIn.cta`).toBeGreaterThan(0)
    }
  })
})

// Spec 074 / coverage-map §C. An edge is a CLAIM, so these hold the graph to the
// shape §C.0 argues for: every hand-off reachable, annotated, and reciprocal
// unless a direction is genuinely unjustifiable.
describe('schema: connection edges (spec 074, coverage-map §C)', () => {
  const sectionIds = new Set(MANUAL.map((m) => m.id))

  it('every endpoint resolves to a real section', () => {
    for (const e of EDGES) {
      expect(sectionIds.has(e.a), `edge ${e.a}→${e.b}: unknown section ${e.a}`).toBe(true)
      expect(sectionIds.has(e.b), `edge ${e.a}→${e.b}: unknown section ${e.b}`).toBe(true)
      expect(e.a, `self-edge on ${e.a}`).not.toBe(e.b)
    }
  })

  it('every why-sentence is a sentence, not a label', () => {
    for (const e of EDGES) {
      expect(e.why.trim().length, `${e.a}→${e.b} why`).toBeGreaterThanOrEqual(40)
      if (e.whyBack !== undefined) {
        expect(e.whyBack.trim().length, `${e.b}→${e.a} whyBack`).toBeGreaterThanOrEqual(40)
        expect(e.whyBack.trim(), `${e.a}↔${e.b} says the same thing both ways`).not.toBe(e.why.trim())
      }
    }
  })

  it('no duplicate pairs, in either orientation', () => {
    const seen = new Set<string>()
    for (const e of EDGES) {
      const key = [e.a, e.b].sort().join('|')
      expect(seen.has(key), `duplicate edge between ${e.a} and ${e.b}`).toBe(false)
      seen.add(key)
    }
  })

  it('no section exceeds the six-edge cap (§C.3 review decision)', () => {
    for (const m of MANUAL) {
      const n = edgesFor(m.id).length
      expect(n, `${m.id} has ${n} outbound edges — past six the hand-off is a link dump`).toBeLessThanOrEqual(6)
    }
  })

  it('no section is an island: every briefing has ≥1 outbound edge', () => {
    for (const m of MANUAL) {
      expect(edgesFor(m.id).length, `${m.id} has no outbound edge`).toBeGreaterThanOrEqual(1)
    }
  })

  it('edgesFor resolves each direction to the sentence facing that page', () => {
    const e = EDGES[0]
    expect(edgesFor(e.a).find((x) => x.other === e.b)?.why).toBe(e.why)
    if (e.whyBack) expect(edgesFor(e.b).find((x) => x.other === e.a)?.why).toBe(e.whyBack)
  })
})

describe('schema: say-it cards (docs/content-pipeline.md §11, spec 066)', () => {
  const plain = (node: ReactNode) =>
    renderToStaticMarkup(createElement(Fragment, null, node))
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  it('ids are unique and stable-looking; every section resolves to a briefing', () => {
    const ids = SAYIT_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const sectionIds = new Set(MANUAL.map((m) => m.id))
    for (const c of SAYIT_CARDS) {
      expect(/^sayit-[a-z0-9-]+$/.test(c.id), c.id).toBe(true)
      expect(sectionIds.has(c.section), `${c.id} → section ${c.section}`).toBe(true)
    }
  })

  it('decks are local and sized 5–8 cards per briefing', () => {
    const bySection = new Map<string, number>()
    for (const c of SAYIT_CARDS) bySection.set(c.section, (bySection.get(c.section) ?? 0) + 1)
    for (const [section, n] of bySection) {
      expect(n, `${section} deck size`).toBeGreaterThanOrEqual(5)
      expect(n, `${section} deck size`).toBeLessThanOrEqual(8)
    }
  })

  it('cues pass the admission test: interviewer-real, never textbook prompts', () => {
    for (const c of SAYIT_CARDS) {
      expect(/^(define|what is|what are|explain the term)\b/i.test(c.cue.trim()), `${c.id} cue reads like a textbook`).toBe(false)
      expect(c.cue.trim().length, `${c.id} cue too thin to be a real question`).toBeGreaterThan(30)
    }
  })

  it('the model is speakable: a breath, not a paragraph', () => {
    for (const c of SAYIT_CARDS) {
      const text = plain(c.model)
      expect(text.length, `${c.id} model too thin`).toBeGreaterThan(80)
      expect(text.length, `${c.id} model exceeds a breath`).toBeLessThan(340)
      const sentences = text.match(/[.!?](\s|$)/g) ?? []
      expect(sentences.length, `${c.id} model must stay ≤3 short beats`).toBeLessThanOrEqual(3)
    }
  })

  it('exactly 3 checks (mechanism / cost / rule) and a non-empty trap', () => {
    for (const c of SAYIT_CARDS) {
      expect(c.checks, c.id).toHaveLength(3)
      c.checks.forEach((k, i) => expect(k.trim().length, `${c.id} check ${i}`).toBeGreaterThan(20))
      expect(c.trap.trim().length, `${c.id} trap`).toBeGreaterThan(30)
    }
  })

  it('every card leaves a number, and its refs resolve in numbers.ts', () => {
    const numberIds = new Set(NUMBERS.map((n) => n.id))
    for (const c of SAYIT_CARDS) {
      expect(c.number.val.trim().length, `${c.id} number.val`).toBeGreaterThan(0)
      expect(c.number.body.trim().length, `${c.id} number.body`).toBeGreaterThan(20)
      c.number.refs.forEach((id) => expect(numberIds.has(id), `${c.id} → ${id}`).toBe(true))
    }
  })

  it('terms resolve in the glossary', () => {
    for (const c of SAYIT_CARDS) {
      expect(c.terms.length, `${c.id} needs ≥1 term`).toBeGreaterThan(0)
      c.terms.forEach((k) => expect(GLOSSARY[k], `${c.id} → term ${k}`).toBeDefined())
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

describe('schema: on-call run (spec 060)', () => {
  it('has 3 acts, 18 encounters, 12 patterns, 6 events, 3 bosses', () => {
    expect(ACTS).toHaveLength(3)
    expect(Object.keys(ENCOUNTERS)).toHaveLength(18)
    expect(Object.keys(PATTERNS)).toHaveLength(12)
    expect(Object.keys(EVENTS)).toHaveLength(6)
    expect(Object.values(ENCOUNTERS).filter((e) => e.boss)).toHaveLength(3)
  })

  it('every act references real encounters and events, with shops/rests per act', () => {
    const encKeys = new Set(Object.keys(ENCOUNTERS))
    const evKeys = new Set(Object.keys(EVENTS))
    for (const act of ACTS) {
      const kinds = act.layers.flat().map((n) => n.kind)
      expect(kinds, act.name).toContain('shop')
      expect(kinds, act.name).toContain('rest')
      expect(act.layers.flat().filter((n) => n.kind === 'boss'), act.name).toHaveLength(1)
      for (const node of act.layers.flat()) {
        if (node.enc) expect(encKeys.has(node.enc), node.enc).toBe(true)
        if (node.event) expect(evKeys.has(node.event), node.event).toBe(true)
      }
    }
  })

  it('every boss links a real "This Actually Happened" post-mortem with an official url', () => {
    for (const e of Object.values(ENCOUNTERS).filter((x) => x.boss)) {
      expect(e.happened && e.happened.length, e.name).toBeGreaterThan(0)
      for (const id of e.happened!) {
        expect(HAPPENED[id], id).toBeTruthy()
        expect(HAPPENED[id].url.startsWith('https://'), id).toBe(true)
      }
    }
  })

  it('every event offers exactly two choices with a real effect', () => {
    for (const ev of Object.values(EVENTS)) {
      expect(ev.choices, ev.key).toHaveLength(2)
      for (const c of ev.choices) expect((c.hp ?? 0) !== 0 || (c.gold ?? 0) !== 0, `${ev.key}:${c.title}`).toBe(true)
    }
  })

  it('the score formula is monotone in every input', () => {
    const base = { actsCleared: 1, hp: 50, gold: 500, patterns: 3, won: false }
    expect(runScore({ ...base, actsCleared: 2 })).toBeGreaterThan(runScore(base))
    expect(runScore({ ...base, hp: 60 })).toBeGreaterThan(runScore(base))
    expect(runScore({ ...base, gold: 900 })).toBeGreaterThan(runScore(base))
    expect(runScore({ ...base, patterns: 5 })).toBeGreaterThan(runScore(base))
    expect(runScore({ ...base, won: true })).toBeGreaterThan(runScore(base))
  })
})

describe('schema: the Forge (product-spec §3.8)', () => {
  it('gates exactly six parts, each with a unique id', () => {
    expect(FORGE).toHaveLength(6)
    const ids = FORGE.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(ids)).toEqual(new Set(['cache', 'queue', 'replicas', 'shards', 'workers', 'cdn']))
  })

  it('every challenge hangs off a real toy, and that toy declares the same unlock', () => {
    const byId = new Map(TOYS.map((t) => [t.id, t]))
    for (const f of FORGE) {
      const toy = byId.get(f.toyId)
      expect(toy, `${f.id} → ${f.toyId}`).toBeTruthy()
      expect(toy!.forgeUnlocks, `${f.toyId} must declare it forges ${f.id}`).toBe(f.id)
    }
  })

  it('every toy that declares an unlock has a challenge for it', () => {
    const forgeIds = new Set(FORGE.map((f) => f.id))
    for (const t of TOYS) if (t.forgeUnlocks) expect(forgeIds.has(t.forgeUnlocks), `${t.id} → ${t.forgeUnlocks}`).toBe(true)
  })

  it('each challenge offers three options with exactly one right answer', () => {
    for (const f of FORGE) {
      expect(f.options, f.id).toHaveLength(3)
      expect(f.options.filter((o) => o.ok).length, f.id).toBe(1)
      for (const o of f.options) {
        expect(o.text.trim().length, `${f.id} option text`).toBeGreaterThan(20)
        // every option — right or wrong — carries its own post-mortem
        expect(o.why.trim().length, `${f.id} · ${o.text.slice(0, 30)}`).toBeGreaterThan(60)
      }
    }
  })

  it('every challenge states its setup and its question', () => {
    for (const f of FORGE) {
      expect(f.setup.trim().length, f.id).toBeGreaterThan(40)
      expect(f.question.trim().endsWith('?'), f.id).toBe(true)
      expect(f.label.trim().endsWith('challenge'), f.id).toBe(true)
    }
  })

  it('challenge numberIds point at derivable numbers, and terms at glossary entries', () => {
    const numberIds = new Set(NUMBERS.map((n) => n.id))
    for (const f of FORGE) {
      expect(f.numberIds.length, f.id).toBeGreaterThan(0)
      f.numberIds.forEach((id) => expect(numberIds.has(id), `${f.id} → ${id}`).toBe(true))
      expect(f.terms.length, f.id).toBeGreaterThan(0)
      f.terms.forEach((k) => expect(GLOSSARY[k], `${f.id} → ${k}`).toBeDefined())
    }
  })

  it('the parts bin covers every forgeable part exactly once, and free parts declare null', () => {
    const gated = COMPONENTS.filter((c) => c.forge).map((c) => c.forge)
    expect(new Set(gated)).toEqual(new Set(FORGE.map((f) => f.id)))
    expect(gated.length).toBe(FORGE.length)
    // the front door and the app tier are never gated — you cannot build without them
    expect(COMPONENTS.find((c) => c.id === 'lb')!.forge).toBeNull()
    expect(COMPONENTS.find((c) => c.id === 'app')!.forge).toBeNull()
  })
})
