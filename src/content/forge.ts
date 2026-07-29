// The Forge — the unlock graph (product-spec §3.8) as content, plus the six
// mini-challenges that gate each part. Engines never import this; the Lab
// renders the challenge, the Builder and On-Call read the forged set.
//
// Graph, per §3.8: cdn ← Race Light · queue ← The Disk · cache ← the hit-rate
// toy · workers ← The Queue · shards ← Hot Partition · replicas ← Replication
// Lag. One deviation from the doc: the hit-rate challenge attaches to TTL &
// STAMPEDE, not LEAKY BITS — the cache component is about hit rate and misses,
// which is the stampede toy's whole subject, while Leaky Bits is DRAM refresh
// physics with no hit rate to challenge on. `TOYS[].forgeUnlocks` already
// carried that assignment; this file agrees with the content, not the prose.
//
// Each challenge is answerable ONLY if the toy clicked: the wrong options are
// all defensible-sounding, and each one names a specific misreading of the
// mechanism the toy just showed.

import type { Channel } from '../theme'

export interface ForgeOption {
  text: string
  /** exactly one option per challenge is correct */
  ok?: boolean
  /** the post-mortem for this choice — plain language, no scolding */
  why: string
}

export interface ForgeChallenge {
  /** component id — matches TOYS[].forgeUnlocks and the parts-bin `forge` key */
  id: string
  /** the part this forges, as it reads in the bin */
  part: string
  ch: Channel
  /** the toy that forges it (id into content/toys.ts) */
  toyId: string
  /** short name of the challenge, per §3.8 ("hit-rate challenge") */
  label: string
  /** the setup — a concrete situation, with the numbers stated */
  setup: string
  question: string
  options: ForgeOption[]
  /** ids into content/numbers.ts the challenge leans on */
  numberIds: string[]
  /** glossary keys rendered as tappable terms under the challenge */
  terms: string[]
}

export const FORGE: ForgeChallenge[] = [
  {
    id: 'cdn',
    part: 'CDN',
    ch: 'net',
    toyId: 'light',
    label: 'placement challenge',
    setup:
      'Your servers are in Virginia. They render a page in 10 ms. A user in Sydney waits 170 ms for it, every time, on a fast connection.',
    question: 'Where does that 160 ms actually live — and what removes it?',
    options: [
      {
        text: 'In the distance. Only a copy of the bytes closer to Sydney removes it.',
        ok: true,
        why: 'Right. Sydney↔Virginia is ~16,000 km of fiber; light in glass covers it in ~80 ms one way, so ~160 ms round trip is the floor no amount of server tuning moves. The only lever is a shorter trip — a copy at the edge.',
      },
      {
        text: 'In the render. Add app servers in Virginia so the 10 ms drops.',
        why: 'The render is 10 ms of a 170 ms wait. Halve it and the user in Sydney saves 5 ms out of 170 — you optimized the 6% and left the 94% untouched.',
      },
      {
        text: 'In the payload. Compress the response so fewer bytes cross the ocean.',
        why: 'Compression cuts transfer time, not the round trip. The first byte still cannot arrive before light does — a 1 KB page and a 100 KB page both wait out the same 160 ms of distance first.',
      },
    ],
    numberIds: ['cross-region-rtt'],
    terms: ['cdn', 'request'],
  },
  {
    id: 'queue',
    part: 'Write queue',
    ch: 'net',
    toyId: 'disk',
    label: 'append challenge',
    setup:
      'A write burst arrives: 40k writes/s for ninety seconds. The database behind it tops out around 5k writes/s. You put a queue in front, on the same hardware.',
    question: 'Why can the queue swallow the burst that the database cannot?',
    options: [
      {
        text: 'The queue only ever appends — one sequential stream. The database writes land at scattered offsets and pay for the jump.',
        ok: true,
        why: 'Right, and this is the 1000× from The Disk. An append is the one access pattern that never moves the arm: the head is already where the next byte goes. Index updates are random by definition — each one is a seek the queue never pays.',
      },
      {
        text: 'The queue holds messages in memory, so no disk is involved during the burst.',
        why: 'Durable queues fsync to disk — that is what makes them a safe place to park a write. Their speed is the access pattern, not the absence of disk; an in-memory queue that loses the burst on restart has not bought you anything.',
      },
      {
        text: 'The queue batches many writes into fewer, larger ones.',
        why: 'Batching helps, but it is the smaller half of the story. Batch the same random writes and each batch still scatters. Sequential-vs-random is the 1000×; batching is the 2–5×.',
      },
    ],
    numberIds: ['hdd-seek', 'hdd-iops'],
    terms: ['queue', 'durable'],
  },
  {
    id: 'cache',
    part: 'Cache node',
    ch: 'mem',
    toyId: 'stampede',
    label: 'hit-rate challenge',
    setup:
      'Reads arrive at 50k/s. The database behind the cache serves about 10k reads/s before latency runs away. You have exactly one cache node in front of it.',
    question: 'What hit rate does the cache have to hold?',
    options: [
      {
        text: '80% — misses have to fall to 10k/s, so 40k of the 50k must be served from cache.',
        ok: true,
        why: 'Right: the number that matters is the miss rate, because misses are the load the database actually sees. 50k × 20% = 10k/s. Note how brittle that is — drop to 70% and the database gets 15k/s, half again over its ceiling.',
      },
      {
        text: '50% — half the reads served from memory is a healthy cache.',
        why: '50% leaves 25k/s of misses hitting a 10k/s database — 2.5× over. "Healthy hit rate" is not a property of the cache; it is whatever number the tier behind it can survive.',
      },
      {
        text: '95% — always push the hit rate as high as it will go.',
        why: 'Aiming higher is not wrong, it is unanchored. Without deriving the 80% you cannot tell whether 95% is comfortable headroom or an impossible target for this key distribution — and you cannot say what breaks when a TTL expiry drops you below it.',
      },
    ],
    numberIds: ['pg-reads', 'redis-ops'],
    terms: ['hitrate', 'cache'],
  },
  {
    id: 'workers',
    part: 'Workers',
    ch: 'net',
    toyId: 'queue',
    label: 'drain-sizing challenge',
    setup:
      'Writes land in the queue at 12k/s and stay there for the full peak hour — not a spike, a plateau. Each worker drains 5k writes/s.',
    question: 'How many workers do you run?',
    options: [
      {
        text: 'Three. Two drain 10k/s against 12k/s of intake, so the backlog grows for the whole hour and never comes back.',
        ok: true,
        why: 'Right. The queue buys time, not capacity: while drain < intake the backlog rises linearly — 2k/s × 3600 s = 7.2M stranded messages by the end of the hour. Sizing the drain above sustained intake is the only thing that makes a queue a solution instead of a delay.',
      },
      {
        text: 'Two. 10k/s is close to 12k/s and the queue absorbs the difference.',
        why: 'A queue absorbs a burst, which is finite, not a deficit, which is not. "Close" still means the backlog grows every second of the hour — you would be 7.2M messages behind when traffic finally drops.',
      },
      {
        text: 'One. The queue is the buffer; the worker just has to keep up on average.',
        why: 'The average is 12k/s — that IS the sustained rate. One worker drains 5k/s, so you are shedding 7k/s into a backlog that only unwinds after peak, hours later, if ever.',
      },
    ],
    numberIds: ['kafka-msgs', 'queue-knee'],
    terms: ['worker', 'backlog'],
  },
  {
    id: 'shards',
    part: 'DB shard',
    ch: 'storage',
    toyId: 'hotpartition',
    label: 'key-choice challenge',
    setup:
      'Ticket sales. One primary can absorb about 5k writes/s; a stadium on-sale drives 30k writes/s, all of it for a single concert, in a two-minute window.',
    question: 'Which shard key survives the on-sale?',
    options: [
      {
        text: '(event_id, seat_block) — the hot concert is the problem, so split inside the event.',
        ok: true,
        why: 'Right. Sharding only helps if the key spreads the load that is actually hot. Adding a second field the writes vary across turns one 30k/s partition into ten 3k/s partitions — each under the 5k/s ceiling.',
      },
      {
        text: 'event_id — every query already names an event, so no query ever crosses shards.',
        why: 'This is the trap the Hot Partition toy exists to spring. It is the cleanest query plan and the worst write distribution: the on-sale is one event, so all 30k/s lands on one shard while the other nine idle. Sharding by the hot key is not sharding.',
      },
      {
        text: 'user_id — users are numerous and evenly distributed, so writes spread perfectly.',
        why: 'The writes do spread. But now the seat map for one concert is scattered across every shard, so the read every buyer issues fans out to all of them — you traded a hot partition for a fan-out on the hottest read in the system.',
      },
    ],
    numberIds: ['partition-write-cap', 'pg-writes'],
    terms: ['shard', 'hotpartition'],
  },
  {
    id: 'replicas',
    part: 'Read replica',
    ch: 'storage',
    toyId: 'replag',
    label: 'failover challenge',
    setup:
      'The primary dies mid-afternoon. Your replica is healthy and, per the lag graph, 400 ms behind. The runbook says promote.',
    question: 'You promote it. What did you just decide?',
    options: [
      {
        text: 'That losing the last 400 ms of acknowledged writes costs less than staying down.',
        ok: true,
        why: 'Right — and saying it out loud is the whole skill. Asynchronous replication means promotion is a data-loss event with a size you can estimate: 400 ms of writes, gone, already acknowledged to users. You take that trade knowingly, or you run synchronous replication and pay the latency instead.',
      },
      {
        text: 'Nothing much — the new primary replays the rest of the old primary log after promotion.',
        why: 'There is nothing to replay from. The dead primary is the only place those 400 ms of writes existed; that is what "asynchronous" means. If it never comes back, neither do they.',
      },
      {
        text: 'That reads are stale for 400 ms after promotion, then consistent again.',
        why: 'This describes replication lag during normal operation, not failover. After promotion the replica IS the truth — the missing writes are not late, they are lost, and the system will never notice they are gone.',
      },
    ],
    numberIds: ['same-dc-rtt', 'cross-region-rtt'],
    terms: ['replica', 'failover'],
  },
]

/** every component id the Forge gates */
export const FORGEABLE = FORGE.map((f) => f.id)

export const forgeById = (id: string): ForgeChallenge | undefined => FORGE.find((f) => f.id === id)

/** the challenge a given toy forges, if any */
export const forgeForToy = (toyId: string): ForgeChallenge | undefined => FORGE.find((f) => f.toyId === toyId)
