// Lab toy catalog metadata (docs/content-pipeline.md §2). The playable sims
// live in src/modes/lab/ (they are components, not data); everything a test
// or another mode needs to know about a toy lives here.

import type { Channel } from '../theme'

export interface ToyEntry {
  id: string
  n: string
  name: string
  sub: string
  oneLiner: string
  ch: Channel
  /** ids into src/content/numbers.ts */
  targetNumbers: string[]
  /** component id this toy forges (The Forge, spec 070), or null */
  forgeUnlocks: string | null
  simplifies: string
}

export const TOYS: ToyEntry[] = [
  {
    id: 'light',
    n: '01',
    name: 'RACE LIGHT',
    sub: 'where latency comes from',
    oneLiner: 'Pick an operation. Watch how far light gets before it ends.',
    ch: 'net',
    targetNumbers: ['cpu-cycle', 'l1-hit', 'dram-access', 'nvme-read', 'hdd-seek', 'cross-region-rtt'],
    forgeUnlocks: 'cdn',
    simplifies: 'Uses light in vacuum (30 cm/ns); signals in silicon and fiber travel ~⅓ slower, and every real operation includes software overhead the racetrack ignores.',
  },
  {
    id: 'disk',
    n: '02',
    name: 'THE DISK',
    sub: 'random vs sequential, 1000×',
    oneLiner: 'Two identical drives race for the same data; one refuses to move its head.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'hdd-iops'],
    forgeUnlocks: 'queue',
    simplifies: 'One platter, one head, no OS scheduling or drive cache; real drives reorder requests (elevator algorithms) to soften — never beat — the physics.',
  },
  {
    id: 'dram',
    n: '03',
    name: 'LEAKY BITS',
    sub: 'what RAM actually is',
    oneLiner: 'RAM is billions of leaking buckets, refreshed forever. Turn the refresh off.',
    ch: 'mem',
    targetNumbers: ['dram-access'],
    forgeUnlocks: 'cache',
    simplifies: 'Time slowed ~10 billion×; real cells leak in ~64 ms not seconds, refresh is per-row DMA the CPU never sees, and ECC quietly fixes single-bit losses.',
  },
  {
    id: 'queue',
    n: '04',
    name: 'THE QUEUE',
    sub: 'why 80% is the real 100%',
    oneLiner: 'One server, random arrivals. Drag utilization and watch waiting — not throughput.',
    ch: 'compute',
    targetNumbers: ['queue-knee', 'app-server-rps'],
    forgeUnlocks: 'workers',
    simplifies: 'A single M/M/1-flavored server with random service times; real systems have many servers, admission control, and retries that make the knee even sharper.',
  },
]

export const toyById = (id: string): ToyEntry | undefined => TOYS.find((t) => t.id === id)
