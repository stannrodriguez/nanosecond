// The Ladder — eight numbers, each derived from a physical limit.
// Rendered in the Field Manual mode; physics text sourced from the prototype.

import type { Channel } from '../theme'

export interface Rung {
  name: string
  ns: number
  ch: Channel
  tag: string
  physics: string[]
  matters: string
  /** id into src/content/numbers.ts */
  numberId: string
}

export const RUNGS: Rung[] = [
  {
    name: 'One CPU cycle',
    ns: 0.3,
    ch: 'compute',
    tag: 'the tick everything is measured in',
    numberId: 'cpu-cycle',
    physics: [
      'A 3.3 GHz clock ticks 3.3 billion times per second → 1 ÷ 3.3e9 ≈ 0.3 ns per tick.',
      'In 0.3 ns, light itself travels only 9 cm. A signal in silicon moves slower. This is why chips are ~2 cm across — at higher clocks, a signal literally cannot cross the die in one tick.',
      "Clock speeds stalled near 3–5 GHz around 2005: power grows with voltage² × frequency, and the heat can no longer leave the silicon. Physics ended the free lunch; that's why we scale OUT (more cores, more machines) instead of UP.",
    ],
    matters: 'Every capacity number in this game is downstream of this: a core does ~3 billion simple things per second, full stop.',
  },
  {
    name: 'L1 cache hit',
    ns: 1,
    ch: 'mem',
    tag: 'data sitting next to the ALU',
    numberId: 'l1-hit',
    physics: [
      'L1 is ~48 KB of SRAM physically inside the core — 6 transistors per bit, no capacitor to recharge.',
      "Access ≈ 4 cycles ≈ 1 ns. It's fast because it's SMALL and CLOSE: the round trip is a few millimetres of wire.",
      'You cannot make it big and keep it fast — bigger memory means longer wires and more address-decode logic. Size vs speed is a geometric constraint, not a design failure.',
    ],
    matters: "The entire memory hierarchy exists because 'big' and 'fast' are physically incompatible. Caching at every layer of systems design is this same trade, repeated.",
  },
  {
    name: 'L2 cache hit',
    ns: 4,
    ch: 'mem',
    tag: 'same trade, one ring out',
    numberId: 'l2-hit',
    physics: [
      '~1 MB per core, still SRAM, a few mm farther from the ALU → ~14 cycles.',
      'Rule of thumb forming: each hierarchy level is ~4–10× bigger and ~4–10× slower. Watch it repeat all the way down to cross-region.',
    ],
    matters: "When you see a 4–10× latency ratio between two layers of ANY system, you're looking at a healthy hierarchy.",
  },
  {
    name: 'Main memory (DRAM)',
    ns: 100,
    ch: 'mem',
    tag: 'one capacitor per bit, and it leaks',
    numberId: 'dram-access',
    physics: [
      "DRAM stores each bit as charge on a microscopic capacitor — 1 transistor + 1 capacitor, which is why it's 100× denser and cheaper than SRAM.",
      'But reading it means selecting a row, letting tiny charges bleed onto long wires, and waiting for sense amplifiers to decide 0-or-1. Then the read destroyed the data, so it must be written back.',
      'The capacitors leak: every cell must be refreshed every 64 ms or your data evaporates. RAM is not "storage" — it is charge, actively kept alive.',
      'Net: ~100 ns random access ≈ 300 CPU cycles. Your 3 GHz core spends most of its life waiting for memory.',
    ],
    matters: "100 ns × billions of accesses is why 'it fits in RAM' vs 'it doesn't' is the single biggest performance question in any design.",
  },
  {
    name: 'Compress 1 KB (snappy)',
    ns: 2000,
    ch: 'compute',
    tag: 'compute is cheap — use it to avoid I/O',
    numberId: 'compress-1kb',
    physics: [
      '~2 µs of pure CPU ≈ 6,000 cycles to shrink 1 KB by ~2–4×.',
      'Compare: sending that KB cross-region costs 70,000,000 ns. Spending 2,000 ns to send half as many bytes is a 1000:1 win.',
    ],
    matters: 'Interview instinct: CPU is almost always cheaper than the I/O it can save. Compress, batch, cache.',
  },
  {
    name: 'NVMe SSD random read',
    ns: 80000,
    ch: 'storage',
    tag: 'reading trapped electrons',
    numberId: 'nvme-read',
    physics: [
      'Flash stores bits as electrons trapped in a floating gate. Reading = applying voltages and sensing which cells conduct — for TLC (3 bits/cell) you must distinguish 8 charge levels, which takes ~50–100 µs of careful sensing.',
      "You can't read one byte: the page (~16 KB) is the smallest readable unit. And you can't overwrite: erase happens in ~MB-sized blocks, so a translation layer shuffles data constantly (this is write amplification).",
      'No moving parts → ~500k–1M of these reads can run in parallel per drive (IOPS). Latency is physics; throughput is parallelism.',
    ],
    matters: 'SSD is 800× slower than RAM per access but survives power-off and costs ~10× less per GB. Databases live in this gap.',
  },
  {
    name: 'Same-datacenter round trip',
    ns: 500000,
    ch: 'net',
    tag: 'distance is free here — software is the cost',
    numberId: 'same-dc-rtt',
    physics: [
      'Propagation across a 100 m building: ~0.5 µs. Essentially nothing.',
      'The other ~499.5 µs: serializing bytes onto the wire, 2–3 switch hops (~1–10 µs each), and mostly the kernel network stack + scheduling on both ends.',
      'This is why kernel-bypass and RDMA exist — inside a DC the floor is software, not light.',
    ],
    matters: '0.5 ms per hop means a request that fans out through 6 internal services has spent 3 ms before doing any work. Chatty microservices pay this toll on every call.',
  },
  {
    name: 'HDD random read',
    ns: 8000000,
    ch: 'storage',
    tag: 'a mechanical arm, in your latency budget',
    numberId: 'hdd-seek',
    physics: [
      'A 7200 RPM platter spins 120 times/sec → one revolution = 8.33 ms → on average you wait half a spin, 4.2 ms, for your sector to come around.',
      'Plus the read head physically swings to the right track: ~4 ms of actual moving metal.',
      "≈ 8 ms per random read → a disk can do only ~120 random reads per second. This number CANNOT improve — it's rotation speed, bounded by the platter tearing itself apart.",
      'Sequential is the loophole: once positioned, data streams at ~200 MB/s. Random:sequential asymmetry is 1000:1.',
    ],
    matters: "This one number explains database design: B-trees, LSM-trees, write-ahead logs, and Kafka's entire architecture are all schemes to convert random I/O into sequential I/O.",
  },
  {
    name: 'Cross-region round trip (US E↔W)',
    ns: 70000000,
    ch: 'net',
    tag: 'the speed of light, invoiced',
    numberId: 'cross-region-rtt',
    physics: [
      'Light in vacuum: 300,000 km/s. In fiber (refractive index ~1.47): ~200,000 km/s.',
      'NY↔SF ≈ 4,700 km of non-straight fiber → ~24 ms one way → ~48 ms round trip as an ABSOLUTE FLOOR. Routing and queuing bring reality to ~60–80 ms.',
      'No engineering fixes this. It is the same physics that ended clock scaling, now at planetary size.',
    ],
    matters: 'Every consistency debate in distributed systems is really about this number: synchronous cross-region agreement costs 70 ms per round, and consensus needs multiple rounds. CAP is geography.',
  },
]
