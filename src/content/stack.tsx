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
    gist: 'Many machines acting as one: data survives through copies, agrees by voting, and scales by splitting.',
    toyIds: ['queue', 'connpool', 'stampede', 'replag', 'hotpartition', 'consensus', 'backpressure'],
    promised: null,
  },
  {
    id: 'network',
    name: 'THE NETWORK',
    gist: 'Bytes crossing wires: every hop pays for distance, and every acknowledgment pays the fare a second time.',
    toyIds: ['pipe'],
    promised: "v2: a packet's life · DNS resolution · TCP slow start",
  },
  {
    id: 'machine',
    name: 'THE MACHINE',
    gist: 'One box acting like many separate programs: storage engines, files, and the address maps between them.',
    toyIds: ['lsmbtree', 'tlb-toll'],
    promised: 'v2: syscall toll booth · GC pause',
  },
  {
    id: 'chip',
    name: 'THE CHIP',
    gist: 'Code turning into electricity: a fetch-decode-execute loop forever racing its own memory.',
    toyIds: ['instruction-loop', 'heat-wall', 'branch-predictor', 'false-sharing', 'cachecliff'],
    promised: null,
  },
  {
    id: 'cell',
    name: 'THE CELL',
    gist: 'What a bit actually is in the physical world: tiny pockets of charge, spinning magnetism, and faint signals read back.',
    toyIds: ['dram', 'disk'],
    promised: 'v2: NAND charge levels · the transistor switch',
  },
  {
    id: 'physics',
    name: 'THE PHYSICS',
    gist: 'The four hard walls everything else negotiates with: light speed, heat, leaking charge, and moving metal.',
    toyIds: ['light'],
    promised: null,
  },
]

export const floorForToy = (toyId: string): StackFloor | undefined => FLOORS.find((f) => f.toyIds.includes(toyId))
