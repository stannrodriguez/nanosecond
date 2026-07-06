// The stack (ADR 0005, spec 081): the Lab map's vertical axis. A computer is
// machines built out of machines; at every floor data is only ever
// TRANSFORMED or MOVED, and moving is the expensive verb. Every toy lives on
// EXACTLY ONE floor (tests/schema.test.ts) — a claim about where its
// mechanism lives, not its channel (LSM vs B-tree is one box organizing a
// disk → THE MACHINE, even though its channel is storage). Thin floors state
// what they owe; an unlit floor is a curriculum promise, not an embarrassment.

export interface StackFloor {
  id: string
  name: string
  /** the two verbs at this floor, one line, plain language */
  gist: string
  /** ids into content/toys.ts */
  toyIds: string[]
  /** what this floor still owes (spec refs / v2 backlog), or null */
  promised: string | null
}

/** Ordered top (largest distances) to bottom (raw physics). */
export const FLOORS: StackFloor[] = [
  {
    id: 'planet',
    name: 'THE PLANET',
    gist: 'many machines pretending to be one — data survives by being copied, agrees by voting, scales by being split',
    toyIds: ['queue', 'connpool', 'stampede', 'replag', 'hotpartition', 'consensus', 'backpressure'],
    promised: null,
  },
  {
    id: 'network',
    name: 'THE NETWORK',
    gist: 'bytes crossing wires — every hop pays distance, and every acknowledgment pays it again',
    toyIds: ['pipe'],
    promised: "v2: a packet's life · DNS resolution · TCP slow start",
  },
  {
    id: 'machine',
    name: 'THE MACHINE',
    gist: 'one box pretending to be many programs — engines, files, and the maps between them',
    toyIds: ['lsmbtree'],
    promised: 'coming: THE TLB TOLL (spec 088) · v2: syscall toll booth, GC pause',
  },
  {
    id: 'chip',
    name: 'THE CHIP',
    gist: 'code becoming electricity — a fetch-decode-execute loop racing its own memory',
    toyIds: ['cachecliff'],
    promised: 'coming: THE INSTRUCTION LOOP · THE HEAT WALL · THE BRANCH PREDICTOR (spec 086) · FALSE SHARING (spec 088)',
  },
  {
    id: 'cell',
    name: 'THE CELL',
    gist: 'what a bit physically is — charge, magnetism, and the reading of whispers',
    toyIds: ['dram', 'disk'],
    promised: 'v2: NAND charge levels · the transistor switch',
  },
  {
    id: 'physics',
    name: 'THE PHYSICS',
    gist: 'the four walls — light speed, heat, leaking charge, moving metal',
    toyIds: ['light'],
    promised: null,
  },
]

export const floorForToy = (toyId: string): StackFloor | undefined => FLOORS.find((f) => f.toyIds.includes(toyId))
