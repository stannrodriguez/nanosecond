// The Forge — the progression spine (product-spec §3.8). "You may not USE a
// component you haven't understood." Every buildable component is LOCKED in the
// Builder and On-Call until you forge it in the Lab by (1) completing its toy
// and (2) passing a one-question mini-challenge that proves the mechanism
// clicked. This is content, not engine — engines never import it.
//
// The unlock graph mirrors TOYS[].forgeUnlocks (content/toys.ts); the schema
// test asserts the two stay in lockstep and cover all six components. Note the
// shipped mapping forges `cache` at TTL & Stampede (the caching toy) rather than
// at Leaky Bits — a hit-rate challenge belongs to the toy about cache hits.

import { TOYS } from './toys'

export interface ForgeEntry {
  /** component id — matches a TOYS[].forgeUnlocks value */
  component: string
  /** how the component reads in the parts bin / workbench */
  label: string
  /** the toy you forge it at (deep-link target: /lab/:toyId) */
  toyId: string
  /** the toy's display name, for locked-state copy */
  toyName: string
  /** the named mini-challenge (product-spec §3.8) */
  challenge: string
  /** the question posed once the mechanism is in hand */
  prompt: string
  options: string[]
  correctIx: number
  /** why that answer is the whole point — shown the moment it forges */
  reveal: string
}

export const FORGE: ForgeEntry[] = [
  {
    component: 'cache',
    label: 'Cache node',
    toyId: 'stampede',
    toyName: 'TTL & STAMPEDE',
    challenge: 'hit-rate challenge',
    prompt: 'A cache only helps if reads repeat. At a 90% hit rate, 10,000 reads/s arrive. How many still reach the database?',
    options: ['0 — the cache absorbs them all', '1,000/s — the 10% that miss', '9,000/s — most of them', "10,000/s — caches don't cut DB load"],
    correctIx: 1,
    reveal: 'Hit rate is the whole game: 90% hit means 10% — 1,000/s — still hit the DB, so you size the DB for the misses. And a cold cache after a restart sends 100% straight through: that spike is the stampede.',
  },
  {
    component: 'queue',
    label: 'Write queue',
    toyId: 'disk',
    toyName: 'THE DISK',
    challenge: 'append challenge',
    prompt: 'The disk is ~1000× faster appending than seeking. Putting a write queue in front of it turns scattered writes into what?',
    options: ['Random reads spread across the platter', 'A sequential append-only log the workers drain in order', 'Fewer total writes', 'Instant durability with no disk at all'],
    correctIx: 1,
    reveal: 'A queue converts scattered random writes into one sequential append — the single access pattern the disk is fast at. That is why it buys time under bursty writes: the log absorbs the spike, workers drain it in order.',
  },
  {
    component: 'replicas',
    label: 'Read replica',
    toyId: 'replag',
    toyName: 'REPLICATION LAG',
    challenge: 'failover challenge',
    prompt: 'Your primary dies. A read replica was lagging 4 seconds behind; you promote it. What happens to those 4 seconds of writes?',
    options: ['Nothing — replicas are always in sync', 'Safe — replicas store everything twice', 'Lost — the replica never received them', 'They replay automatically from the dead primary'],
    correctIx: 2,
    reveal: 'Failover promotes the recent past. Any write the primary had not yet shipped to the replica is gone. Replicas scale reads and survive a node loss — they do not make unreplicated writes durable.',
  },
  {
    component: 'shards',
    label: 'DB shard',
    toyId: 'hotpartition',
    toyName: 'HOT PARTITION',
    challenge: 'key-choice challenge',
    prompt: 'You shard by timestamp across eight nodes. Every write is "now". Where does the traffic land?',
    options: ['Spread evenly — that is what sharding does', "All on one node — the 'now' partition melts while seven idle", 'On the two newest nodes', 'Nowhere — timestamps cannot be shard keys'],
    correctIx: 1,
    reveal: 'Sharding only helps if the key spreads load. A monotonic key — timestamp, auto-increment id — funnels every write to one partition. Pick a key with high cardinality and no hot "now".',
  },
  {
    component: 'workers',
    label: 'Workers',
    toyId: 'queue',
    toyName: 'THE QUEUE',
    challenge: 'drain-sizing challenge',
    prompt: 'Intake holds at 20,000 msgs/s. Each worker drains 5,000/s and you run 3. What does the backlog do over a steady hour?',
    options: ['Stays flat — the queue has infinite buffer', 'Grows without bound — drain (15k) < intake (20k)', 'Shrinks — workers sit idle', 'The queue silently drops the excess'],
    correctIx: 1,
    reveal: 'A queue buys time, not capacity. If steady drain is below steady intake, the backlog grows forever. Size workers so total drain ≥ sustained intake — the queue only absorbs bursts, never a permanent deficit.',
  },
  {
    component: 'cdn',
    label: 'CDN',
    toyId: 'light',
    toyName: 'RACE LIGHT',
    challenge: 'placement challenge',
    prompt: 'A user in Sydney fetches a static image from your US-East origin. Cross-region round-trips dominate. What does a CDN actually change?',
    options: ['Makes the origin server faster', 'Serves it from a node near Sydney — the request never crosses the ocean', 'Compresses the image so it is smaller', 'Nothing for static files'],
    correctIx: 1,
    reveal: 'Latency is distance ÷ the speed of light. A CDN cannot beat physics — it moves the bytes closer so the request travels less far. Place data near users; you cannot clock the ocean away.',
  },
]

export const forgeForToy = (toyId: string): ForgeEntry | undefined => FORGE.find((f) => f.toyId === toyId)
export const forgeForComponent = (component: string): ForgeEntry | undefined =>
  FORGE.find((f) => f.component === component)

/** All six component ids the Forge gates. */
export const FORGE_COMPONENTS: string[] = FORGE.map((f) => f.component)

// Keep the graph honest at module load: every forge entry must correspond to a
// real toy that declares the same forgeUnlocks. (Belt-and-suspenders alongside
// the schema test, so a drift can't ship even if tests are skipped.)
if (import.meta.env?.DEV) {
  for (const f of FORGE) {
    const toy = TOYS.find((t) => t.id === f.toyId)
    if (!toy || toy.forgeUnlocks !== f.component)
      // eslint-disable-next-line no-console
      console.error(`forge: ${f.toyId} → ${f.component} does not match toys.ts`)
  }
}
