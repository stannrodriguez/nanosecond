// The Lab map (docs/content-pipeline.md §2): one concrete story — you tap
// "Post" on a comment — told as stations a request passes through. Every Lab
// toy lives at EXACTLY ONE station (tests/schema.test.ts enforces coverage),
// so the toy grid reads as places on a journey, not a pile of mechanisms.
// JSX is copy + <Term> links only. `manualId` points at the Concept Library
// primer for players who want the vocabulary before the toy.

import type { ReactNode } from 'react'
import type { Channel } from '../theme'
import { Term as T } from '../ui/Term'

export interface JourneyStation {
  id: string
  name: string
  ch: Channel
  /** what happens to the request here, plain language, 1–2 sentences */
  tagline: ReactNode
  /** ids into content/toys.ts — the toys that prove this station's physics */
  toyIds: string[]
  /** Concept Library primer (manual section id), or null */
  manualId: string | null
}

export const STATIONS: JourneyStation[] = [
  {
    id: 'wire',
    name: 'THE WIRE',
    ch: 'net',
    tagline: (
      <>
        Your <T k="request">request</T> crosses the internet as light in fiber. Distance is the first cost.
      </>
    ),
    toyIds: ['light'],
    manualId: 'networking',
  },
  {
    id: 'door',
    name: 'THE FRONT DOOR',
    ch: 'compute',
    tagline: (
      <>
        A <T k="lb">load balancer</T> hands your request to an app server — secretly a waiting line with a breaking point
        well before 100%.
      </>
    ),
    toyIds: ['queue'],
    manualId: 'load-balancer',
  },
  {
    id: 'clock',
    name: 'THE CLOCK',
    ch: 'compute',
    tagline: (
      <>
        Inside the box, the server's code becomes electricity — <T k="pipeline">fetched, decoded, executed</T> billions of
        times a second, bounded by heat.
      </>
    ),
    toyIds: ['instruction-loop', 'heat-wall', 'branch-predictor', 'false-sharing'],
    manualId: null,
  },
  {
    id: 'memory',
    name: 'THE MEMORY LADDER',
    ch: 'mem',
    tagline: (
      <>
        Nearly every one of those instructions is really the CPU <i>waiting</i> on memory — a 1 ns cache racing a 100 ns RAM
        that leaks.
      </>
    ),
    toyIds: ['cachecliff', 'dram', 'tlb-toll'],
    manualId: null,
  },
  {
    id: 'shortcut',
    name: 'THE SHORTCUT',
    ch: 'mem',
    tagline: (
      <>
        Before doing real work, the server asks a <T k="cache">cache</T>: "have we answered this already?" — answered
        instantly, forgotten on a timer.
      </>
    ),
    toyIds: ['stampede'],
    manualId: 'caching',
  },
  {
    id: 'vault',
    name: "THE DATABASE'S DOOR",
    ch: 'storage',
    tagline: (
      <>
        Your comment is a <T k="write">write</T> — it must become bytes on a disk that survive a crash.
      </>
    ),
    toyIds: ['connpool', 'lsmbtree', 'disk'],
    manualId: 'relational-db',
  },
  {
    id: 'copies',
    name: 'THE COPIES',
    ch: 'storage',
    tagline: (
      <>
        One box isn't enough, so data is copied (<T k="replica">replicas</T>) and split (<T k="shard">shards</T>) — and both
        bargains have fine print.
      </>
    ),
    toyIds: ['replag', 'hotpartition'],
    manualId: 'sharding',
  },
  {
    id: 'world',
    name: 'THE WORLD',
    ch: 'net',
    tagline: (
      <>
        Across cities, agreement is bought in round trips, and bytes ride pipes that distance keeps half-empty.
      </>
    ),
    toyIds: ['consensus', 'pipe'],
    manualId: 'cap',
  },
  {
    id: 'valve',
    name: 'THE OVERFLOW VALVE',
    ch: 'net',
    tagline: (
      <>
        When the fast stage outruns the slow one, who absorbs the difference? Someone waits, someone is told no, or someone
        pays in memory.
      </>
    ),
    toyIds: ['backpressure'],
    manualId: 'long-running-tasks',
  },
]

export const stationForToy = (toyId: string): JourneyStation | undefined =>
  STATIONS.find((s) => s.toyIds.includes(toyId))
