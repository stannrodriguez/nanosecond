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
        Your <T k="request">request</T> leaves your device as pulses of light in glass fiber. Before any server runs a
        single line of code, distance takes its cut.
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
        A <T k="lb">load balancer</T> routes your request to an app server. Under the hood, that server is a waiting line
        whose wait time breaks long before it hits 100% busy.
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
        Inside the machine, your handler becomes electricity: instructions are{' '}
        <T k="pipeline">fetched, decoded, and executed</T> billions of times a second, all under a strict thermal ceiling.
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
        Most of those instructions spend their time <i>waiting</i> on memory, caught between a 1 ns on-chip cache and
        100 ns RAM that quietly leaks its charge.
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
        Before doing any heavy lifting, the server checks a <T k="cache">cache</T> to see if it already has the answer.
        Hits return almost instantly, until a shared timer wipes them out.
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
        Your comment is a <T k="write">write</T>. It has to queue for a connection, pick a path through a storage engine,
        and land on disk in a way that survives a crash.
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
        One machine eventually runs out of room, so the data gets copied to <T k="replica">replicas</T> and split across{' '}
        <T k="shard">shards</T>. Both moves buy scale, and both bring their own catches.
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
        Once machines sit in different cities, agreement costs full round trips, and long-haul pipes stay half-empty
        unless you keep enough data in flight.
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
        When an upstream stage runs faster than the downstream stage can drain, something has to give. Either the sender
        slows down, work gets dropped, or memory fills until the process crashes.
      </>
    ),
    toyIds: ['backpressure'],
    manualId: 'long-running-tasks',
  },
]

export const stationForToy = (toyId: string): JourneyStation | undefined =>
  STATIONS.find((s) => s.toyIds.includes(toyId))
