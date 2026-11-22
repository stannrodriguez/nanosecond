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
  /**
   * The Forge (spec 070): the component id in content/forge.ts that gates this
   * part, or null for parts you always have (product-spec §3.8 — the unlock
   * graph covers six parts; the front door and the app tier are not among them).
   */
  forge: string | null
}

export const COMPONENTS: ComponentEntry[] = [
  {
    id: 'lb',
    name: 'Load balancer',
    ch: 'net',
    cost: 0,
    capacity: '+1 ms',
    when: "Always. It's the front door.",
    risk: 'Virtually free, costing just 1 ms per request.',
    simplifies: 'Real load balancers have connection ceilings, health-check lag, and become a single point of failure themselves until you pay for redundancy.',
    termKey: 'lb',
    forge: null,
  },
  {
    id: 'app',
    name: 'App server',
    ch: 'compute',
    cost: 150,
    capacity: '10k req/s · base 3 ms',
    when: 'Add one for roughly every 10k req/s of traffic.',
    risk: '$150/mo each. Stateless, so scaling out is straightforward.',
    simplifies: 'Treats every request as simple and identical. Real endpoints can differ 100× in CPU cost, and new servers take real boot time before they serve traffic.',
    termKey: 'appserver',
    forge: null,
  },
  {
    id: 'cache',
    name: 'Cache node',
    ch: 'mem',
    cost: 200,
    capacity: '100k ops/s · base 1 ms',
    when: 'When the same reads repeat (hot posts, sessions, seat maps).',
    risk: '$200/node. Watch for stale data, and a cold cache after a restart can stampede the DB.',
    simplifies: 'Leaves out eviction policy, hot-key skew, large values, and cold-cache warmup. The stampede elite encounter shows what happens when those bite.',
    termKey: 'cache',
    forge: 'cache',
  },
  {
    id: 'replica',
    name: 'Read replica',
    ch: 'storage',
    cost: 400,
    capacity: '20k reads/s',
    when: 'When read volume outgrows one DB and misses cannot be cached away.',
    risk: '$400 each. Watch for replication lag, which causes read-your-own-write surprises.',
    simplifies: 'The simulator models replicas as instantly consistent. Real replicas lag behind the primary, and failover promotion takes real minutes.',
    termKey: 'replica',
    forge: 'replicas',
  },
  {
    id: 'shard',
    name: 'DB shard',
    ch: 'storage',
    cost: 600,
    capacity: '10k writes/s and 20k reads/s · base 5 ms',
    when: 'When WRITES outgrow one primary. Nothing else truly expands write capacity.',
    risk: '$600 each, plus lasting operational weight: cross-shard queries hurt forever.',
    simplifies: 'Assumes keys spread evenly across shards. Real shards develop hot spots (see the Hot Partition puzzle), and resharding live data is a major project, not a slider.',
    termKey: 'shard',
    forge: 'shards',
  },
  {
    id: 'queue',
    name: 'Write queue',
    ch: 'net',
    cost: 300,
    capacity: '1M msgs/s intake (the buffer, not the drain)',
    when: 'When writes arrive in bursts and a short delay is acceptable.',
    risk: '$300. It buys time, not capacity: steady overload simply builds an endless backlog.',
    simplifies: 'Leaves out ordering guarantees, duplicate delivery on retries, poison messages, and visibility-timeout tuning. The Design Review puzzles unpack those real-world costs.',
    termKey: 'queue',
    forge: 'queue',
  },
  {
    id: 'worker',
    name: 'Workers',
    ch: 'net',
    cost: 100,
    capacity: '5k writes/s drained per worker',
    when: 'Always paired with a queue. The drain is what keeps the buffer from growing forever.',
    risk: '$100 each. If your drain sits below sustained intake, the backlog will never clear.',
    simplifies: 'Assumes every worker is identical and healthy. Real fleets deal with stragglers, poison messages that stall consumers, and warmup before reaching full drain speed.',
    termKey: 'worker',
    forge: 'workers',
  },
  {
    id: 'cdn',
    name: 'CDN',
    ch: 'net',
    cost: 450,
    capacity: '~45% of reads served at the edge, never reaching your stack',
    when: 'When reads are cacheable and your users live far from your servers.',
    risk: '$450/mo. Invalidation is the catch: the edge will cheerfully serve yesterday until its TTL expires.',
    simplifies: 'Models one flat hit fraction. Real edge hit rates shift with cache-control headers, personalization, and how many PoPs your users actually hit.',
    termKey: 'cdn',
    forge: 'cdn',
  },
]
