// Concept registry (docs/content-pipeline.md §9): one row per teachable idea,
// tying together everything the game says about it — its Lab toy, its Field
// Manual briefing, its glossary terms, and its home numbers. This is the
// spine cross-mode links hang off; tests/concepts.test.ts enforces that every
// reference here resolves. Drills attach via numbersRefs overlap — there is
// deliberately no second drill-id scheme to keep in sync.

import type { Channel } from '../theme'
import { DRILLS, type Drill } from './drills'

export interface ConceptEntry {
  id: string
  name: string
  ch: Channel
  /** id into src/content/toys.ts, or null for a concept with no toy yet */
  toyId: string | null
  /** id into src/content/manual.tsx briefings, or null if only the toy teaches it */
  manualId: string | null
  /** keys into src/content/glossary.ts */
  termKeys: string[]
  /** ids into src/content/numbers.ts — the numbers this concept owns */
  numberIds: string[]
}

export const CONCEPTS: ConceptEntry[] = [
  {
    id: 'speed-of-light',
    name: 'The speed of light',
    ch: 'net',
    toyId: 'light',
    manualId: 'networking',
    termKeys: ['request', 'cdn'],
    numberIds: ['cpu-cycle', 'l1-hit', 'dram-access', 'nvme-read', 'hdd-seek', 'cross-region-rtt'],
  },
  {
    id: 'random-vs-sequential',
    name: 'Random vs sequential I/O',
    ch: 'storage',
    toyId: 'disk',
    manualId: 'indexing',
    termKeys: ['durable', 'index'],
    numberIds: ['hdd-seek', 'hdd-iops'],
  },
  {
    id: 'volatile-memory',
    name: 'What RAM actually is',
    ch: 'mem',
    toyId: 'dram',
    manualId: null,
    termKeys: ['cache', 'durable'],
    numberIds: ['dram-access'],
  },
  {
    id: 'queueing',
    name: 'Queueing & the 80% knee',
    ch: 'compute',
    toyId: 'queue',
    manualId: 'load-balancer',
    termKeys: ['util', 'backlog', 'p99'],
    numberIds: ['queue-knee', 'app-server-rps'],
  },
  {
    id: 'partitioning',
    name: 'Partitioning & hot keys',
    ch: 'storage',
    toyId: 'hotpartition',
    manualId: 'sharding',
    termKeys: ['shard', 'hotpartition'],
    numberIds: ['partition-write-cap'],
  },
  {
    id: 'replication',
    name: 'Replication & lag',
    ch: 'storage',
    toyId: 'replag',
    manualId: 'relational-db',
    termKeys: ['replica', 'replag', 'readyourwrites'],
    numberIds: ['pg-writes'],
  },
  {
    id: 'bandwidth-delay',
    name: 'Bandwidth × delay',
    ch: 'net',
    toyId: 'pipe',
    manualId: 'networking',
    termKeys: ['throughput'],
    numberIds: ['bdp', 'cross-region-rtt'],
  },
  {
    id: 'consensus',
    name: 'Consensus is round trips',
    ch: 'net',
    toyId: 'consensus',
    manualId: 'cap',
    termKeys: ['consensus', 'quorum', 'leader', 'cap'],
    numberIds: ['cross-region-rtt', 'same-dc-rtt'],
  },
  {
    id: 'storage-engines',
    name: 'B-tree vs LSM',
    ch: 'storage',
    toyId: 'lsmbtree',
    manualId: 'indexing',
    termKeys: ['btree', 'lsm', 'wal'],
    numberIds: ['hdd-seek', 'pg-writes'],
  },
  {
    id: 'connection-pooling',
    name: 'Connection pooling',
    ch: 'compute',
    toyId: 'connpool',
    manualId: null,
    termKeys: ['connpool', 'backlog'],
    numberIds: ['pg-reads', 'queue-knee'],
  },
  {
    id: 'backpressure',
    name: 'Backpressure',
    ch: 'net',
    toyId: 'backpressure',
    manualId: 'long-running-tasks',
    termKeys: ['backpressure', 'ratelimit'],
    numberIds: ['queue-knee', 'kafka-msgs'],
  },
  {
    id: 'cache-stampede',
    name: 'Caching & the stampede',
    ch: 'mem',
    toyId: 'stampede',
    manualId: 'caching',
    termKeys: ['cache', 'ttl', 'stampede', 'herd'],
    numberIds: ['redis-ops', 'pg-reads'],
  },
  {
    id: 'memory-hierarchy',
    name: 'The memory hierarchy',
    ch: 'mem',
    toyId: 'cachecliff',
    manualId: null,
    termKeys: ['cacheline', 'locality', 'cache'],
    numberIds: ['l1-hit', 'l2-hit', 'l3-hit', 'dram-access', 'cache-line'],
  },
]

export const conceptById = (id: string): ConceptEntry | undefined => CONCEPTS.find((c) => c.id === id)

export const conceptForToy = (toyId: string): ConceptEntry | undefined => CONCEPTS.find((c) => c.toyId === toyId)

/** Every drill that exercises one of the concept's home numbers. */
export const drillsForConcept = (c: ConceptEntry): Drill[] =>
  DRILLS.filter((d) => d.numbersRefs.some((r) => c.numberIds.includes(r)))
