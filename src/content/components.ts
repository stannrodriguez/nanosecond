// The parts bin — one entry per buildable component. `simplifies` is the
// honest fine print (docs/architecture.md · "Content honesty"), enforced by
// the schema test and rendered behind a toggle wherever the part appears.

import type { Channel } from '../theme'

export interface ComponentEntry {
  id: string
  name: string
  ch: Channel
  cost: number
  capacity: string
  when: string
  risk: string
  simplifies: string
  /** glossary key for the tappable name */
  termKey: string
}

export const COMPONENTS: ComponentEntry[] = [
  {
    id: 'lb',
    name: 'Load balancer',
    ch: 'net',
    cost: 0,
    capacity: '+1 ms',
    when: "Always — it's the front door.",
    risk: 'Basically free; one more ms.',
    simplifies: 'Real LBs have connection limits, health-check lag, and can themselves be the single point of failure until you pay for redundancy.',
    termKey: 'lb',
  },
  {
    id: 'app',
    name: 'App server',
    ch: 'compute',
    cost: 150,
    capacity: '10k req/s · base 3 ms',
    when: 'Add one per ~10k req/s of traffic.',
    risk: '$150/mo each. Stateless, so adding more is painless.',
    simplifies: 'Assumes every request is "simple" and identical; real endpoints differ 100× in cost, and boot time means new servers are not instant.',
    termKey: 'appserver',
  },
  {
    id: 'cache',
    name: 'Cache node',
    ch: 'mem',
    cost: 200,
    capacity: '100k ops/s · base 1 ms',
    when: 'Reads repeat (hot posts, sessions, seat maps).',
    risk: '$200/node. Risk: stale data, and a cold cache after restart stampedes the DB.',
    simplifies: 'Ignores eviction policy, hot-key skew, big values, and cold-cache warmup — the stampede elite encounter shows what the model leaves out.',
    termKey: 'cache',
  },
  {
    id: 'replica',
    name: 'Read replica',
    ch: 'storage',
    cost: 400,
    capacity: '20k reads/s',
    when: "Read volume outgrows one DB and misses aren't cacheable.",
    risk: '$400 each. Risk: replication lag — read-your-own-write surprises.',
    simplifies: 'The simulator treats replicas as instantly consistent; real replicas lag, and failover promotion takes real minutes.',
    termKey: 'replica',
  },
  {
    id: 'shard',
    name: 'DB shard',
    ch: 'storage',
    cost: 600,
    capacity: '10k writes/s and 20k reads/s · base 5 ms',
    when: 'WRITES outgrow one primary — the only real cure.',
    risk: '$600 each, plus permanent complexity: cross-shard queries hurt forever.',
    simplifies: 'Assumes perfectly even key distribution; real shards go hot (see the Hot Partition puzzle), and resharding live data is a project, not a slider.',
    termKey: 'shard',
  },
  {
    id: 'queue',
    name: 'Queue + workers',
    ch: 'net',
    cost: 300,
    capacity: '1M msgs/s intake · 5k writes/s drain per worker ($100)',
    when: 'Writes are bursty and a short delay is acceptable.',
    risk: '$300 + $100/worker. Risk: it buys time, not capacity — steady overload just grows the backlog.',
    simplifies: 'Ignores ordering, duplicate delivery (retries!), poison messages, and visibility-timeout tuning — the Design Review puzzles cover what queues really cost.',
    termKey: 'queue',
  },
]
