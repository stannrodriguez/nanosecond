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
      'Your servers sit in Virginia and render a page in 10 ms. A user in Sydney waits 170 ms for it every time, even on a fast connection.',
    question: 'Where is that extra 160 ms coming from, and what actually removes it?',
    options: [
      {
        text: 'Distance. Only putting a copy of the bytes closer to Sydney removes it.',
        ok: true,
        why: 'Exactly. Sydney to Virginia is about 16,000 km of fiber, and light in glass takes around 80 ms one way. That puts a ~160 ms round-trip floor under every request that no server tuning can move. The only way to shorten the wait is to shorten the trip by serving a copy from the edge.',
      },
      {
        text: 'Server render time. Add more app servers in Virginia to bring the 10 ms down.',
        why: 'Rendering only accounts for 10 ms of a 170 ms wait. Even if you cut render time in half, your user in Sydney saves 5 ms out of 170. You just spent your effort on 6% of the problem and left the other 94% untouched.',
      },
      {
        text: 'Payload size. Compress the response so fewer bytes have to cross the ocean.',
        why: 'Compression shrinks transfer time, not the round trip. The very first byte still cannot outrun light, so a 1 KB page and a 100 KB page both pay the same 160 ms of distance before anything arrives.',
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
      'A burst hits: 40k writes/s for ninety seconds. Your database tops out around 5k writes/s, so you put a queue in front of it on the exact same hardware.',
    question: 'Why can the queue absorb a burst that knocks the database over?',
    options: [
      {
        text: 'The queue only appends in one sequential stream, while database writes jump to scattered offsets and pay for every seek.',
        ok: true,
        why: 'Right, and that is the 1000× gap from The Disk. Appending is the one access pattern that keeps the disk head right where the next byte belongs. Database index updates land at scattered locations by nature, turning every write into a seek the queue never has to pay.',
      },
      {
        text: 'The queue keeps messages in memory, so it skips the disk entirely during the burst.',
        why: 'Durable queues fsync straight to disk, because durability is the whole reason you can safely park a write there. Their speed comes from sequential access, not from skipping disk. An in-memory queue that drops the burst on restart has not saved you.',
      },
      {
        text: 'The queue batches small writes together into fewer, larger writes.',
        why: 'Batching helps, but it is the smaller half of the win. If you batch random writes, the disk still has to jump between scattered offsets for each one. Sequential versus random is the 1000× gap; batching is more like 2 to 5×.',
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
      'Reads come in at 50k/s. The database behind your cache serves about 10k reads/s before latency runs away, and you have one cache node sitting in front of it.',
    question: 'What hit rate does the cache need to hold?',
    options: [
      {
        text: '80%: misses have to drop to 10k/s, so the cache needs to serve 40k of the 50k reads.',
        ok: true,
        why: 'Spot on. Miss rate is the number that actually determines survival, because misses are what reach the database: 50k × 20% = 10k/s. Notice how thin that margin is, too. Slip from 80% to 70% and the database suddenly takes 15k/s, half again past its ceiling.',
      },
      {
        text: '50%: serving half your reads from memory is already a healthy cache.',
        why: 'At 50%, 25k/s of misses still slam into a 10k/s database, which is 2.5× over its limit. A "healthy" hit rate is never a property of the cache alone; it is whatever number keeps the database behind it standing.',
      },
      {
        text: '95%: push the hit rate as high as it can possibly go.',
        why: 'Aiming high is fine, but without deriving the 80% floor you have no anchor. You cannot tell whether 95% is comfortable headroom or unrealistic for your key distribution, and you will not see the cliff coming when a TTL expiry dips you below 80%.',
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
      'Writes arrive in the queue at 12k/s and hold steady for a full peak hour, not a brief spike. Each worker can drain 5k writes/s.',
    question: 'How many workers do you need to run?',
    options: [
      {
        text: 'Three. Two workers only drain 10k/s against 12k/s coming in, so the backlog climbs all hour and never recovers.',
        ok: true,
        why: 'Exactly. A queue buys time, not capacity. As long as drain stays below intake, the backlog grows every second: 2k/s × 3600 s = 7.2M stranded messages by the end of the hour. Sizing your drain above sustained intake is what turns a queue into a real fix instead of a slow-motion outage.',
      },
      {
        text: 'Two. 10k/s is close enough to 12k/s, and the queue can soak up the difference.',
        why: 'Queues absorb finite bursts, not open-ended deficits. "Close enough" still leaves you falling behind by 2k/s every single second, adding up to 7.2M messages sitting in the backlog by the time traffic finally eases.',
      },
      {
        text: 'One. The queue acts as the buffer, so the worker only needs to keep up on average.',
        why: 'For that peak hour, 12k/s IS the sustained average. A single worker draining 5k/s leaves 7k/s piling into the backlog, creating hours of catch-up work after peak ends, if the queue ever catches up at all.',
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
      'Concert ticket sales. One primary can absorb about 5k writes/s, and a stadium on-sale drives 30k writes/s for a single concert over two intense minutes.',
    question: 'Which shard key survives the on-sale?',
    options: [
      {
        text: '(event_id, seat_block): the hot concert is the bottleneck, so split traffic inside that event.',
        ok: true,
        why: 'Right. Sharding only works when the key actually breaks up the hot load. Adding a second field that writes vary across turns one 30k/s hot partition into ten 3k/s partitions, keeping every shard comfortably under the 5k/s ceiling.',
      },
      {
        text: 'event_id: every query already filters by event, so no query has to cross shards.',
        why: 'That is the exact trap the Hot Partition toy exists to spring. You get the cleanest query plan and the worst write distribution: because the entire on-sale is one event, all 30k/s hits a single shard while the other nine sit idle. Sharding by the hot key is not sharding.',
      },
      {
        text: 'user_id: users are plentiful and evenly spread, so writes distribute smoothly.',
        why: 'Writes do spread evenly, but now the seat map for one concert is scattered across every shard in the fleet. Every buyer checking available seats triggers a fan-out read across all of them, trading a hot write partition for a painful fan-out on your hottest read.',
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
      'Your primary dies mid-afternoon. The replica is healthy and, according to the lag graph, 400 ms behind. The runbook says to promote it.',
    question: 'You promote the replica. What decision did you just make?',
    options: [
      {
        text: 'That losing the last 400 ms of acknowledged writes hurts less than staying offline.',
        ok: true,
        why: 'Right, and naming that tradeoff out loud is the real skill. With asynchronous replication, promoting a lagging replica is a data-loss event whose size you can calculate: 400 ms of writes, already acknowledged to users, now gone. Either you accept that loss knowingly, or you run synchronous replication and pay the latency cost up front.',
      },
      {
        text: 'Nothing drastic: the new primary will replay the rest of the old primary log once it comes up.',
        why: 'There is nowhere to replay those writes from. The dead primary was the only machine holding that last 400 ms of data, which is what asynchronous replication means. If that machine does not come back, neither do those writes.',
      },
      {
        text: 'That reads will look stale for 400 ms after promotion, then settle back to consistent.',
        why: 'That is how replication lag behaves during normal traffic, not during failover. Once you promote the replica, it becomes the source of truth. Those missing writes are not delayed; they are lost, and the system has no idea they ever existed.',
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
