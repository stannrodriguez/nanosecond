// The Ladder — nine numbers, each derived from a physical limit.
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
    tag: 'the single tick everything else is measured in',
    numberId: 'cpu-cycle',
    physics: [
      'A 3.3 GHz clock ticks 3.3 billion times a second, which gives 1 ÷ 3.3e9 ≈ 0.3 ns per tick.',
      'In 0.3 ns, light itself travels only 9 cm, and electrical signals in silicon move slower than light. That is why a chip die is roughly 2 cm wide: push the clock much faster and a signal cannot physically cross the die in one tick.',
      'Clock speeds stalled near 3 to 5 GHz around 2005 because power rises with voltage² × frequency, and the silicon runs out of ways to shed that heat. Physics ended the free speedups, which is why modern systems scale out across more cores and more machines instead of waiting for faster single cores.',
    ],
    matters: 'Every capacity ceiling in this game flows from this one tick. A single core can execute roughly 3 billion simple operations per second, full stop.',
  },
  {
    name: 'L1 cache hit',
    ns: 1,
    ch: 'mem',
    tag: 'data parked right beside the ALU',
    numberId: 'l1-hit',
    physics: [
      'L1 is roughly 48 KB of SRAM built directly inside the core, using 6 transistors per bit with no capacitor to recharge.',
      'A hit takes about 4 cycles, or ~1 ns. It stays that quick because it is both tiny and close: the round trip is just a few millimetres of wire.',
      'You cannot make L1 huge and keep it at 1 ns. More capacity means longer wires and heavier address-decode logic, so size versus speed is a geometric constraint, not a design oversight.',
    ],
    matters: "The whole memory hierarchy exists because 'big' and 'fast' cannot live in the same spot. Every cache in systems design is this same physical tradeoff repeating at a larger scale.",
  },
  {
    name: 'L2 cache hit',
    ns: 4,
    ch: 'mem',
    tag: 'the same trade, one ring farther out',
    numberId: 'l2-hit',
    physics: [
      'Roughly 1 MB per core, still SRAM, just a few millimetres farther from the ALU, which stretches access to ~14 cycles.',
      'Notice the rule of thumb taking shape: each tier in the hierarchy is roughly 4 to 10× larger and 4 to 10× slower. That pattern keeps repeating all the way out to cross-region networks.',
    ],
    matters: 'Whenever two neighboring layers of any system sit roughly 4 to 10× apart in latency, you are looking at a healthy hierarchy where each layer earns its place.',
  },
  {
    name: 'Main memory (DRAM)',
    ns: 100,
    ch: 'mem',
    tag: 'one tiny capacitor per bit, slowly leaking',
    numberId: 'dram-access',
    physics: [
      'DRAM stores each bit as electric charge on a microscopic capacitor paired with 1 transistor. Two parts instead of six is how it gets 100× denser and cheaper than SRAM.',
      'Reading a bit takes a whole routine: select a row, let tiny charges bleed onto long wires, and wait for sense amplifiers to call 0 or 1. Reading drains the cell, so the controller has to write the destroyed bit right back.',
      'Those capacitors leak steadily, so every cell must be refreshed every 64 ms or your data fades away. RAM is not quiet storage sitting on a shelf; it is charge being actively kept alive.',
      'All told, a random access takes ~100 ns, or roughly 300 CPU cycles. A 3 GHz core spends most of its life stalled, waiting for memory.',
    ],
    matters: "Multiply 100 ns by billions of accesses and you see why 'it fits in RAM' versus 'it does not' is the biggest performance fork in almost any design.",
  },
  {
    name: 'Compress 1 KB (snappy)',
    ns: 2000,
    ch: 'compute',
    tag: 'spend cheap CPU to skip expensive I/O',
    numberId: 'compress-1kb',
    physics: [
      'Fast compression spends ~2 µs of pure CPU, roughly 6,000 cycles, to shrink 1 KB by about 2 to 4×.',
      'Put that next to sending the same kilobyte cross-region, which costs 70,000,000 ns. Paying 2,000 ns up front to ship half as many bytes is a 1000:1 win.',
    ],
    matters: 'Good engineering reflex: CPU cycles are almost always cheaper than the I/O they can save. Compress, batch, and cache before reaching for bigger pipes.',
  },
  {
    name: 'NVMe SSD random read',
    ns: 80000,
    ch: 'storage',
    tag: 'measuring electrons trapped in silicon',
    numberId: 'nvme-read',
    physics: [
      'Flash stores bits as electrons trapped in a floating gate. Reading means applying voltages and sensing which cells conduct; for TLC (3 bits per cell), the drive has to distinguish 8 charge levels, which takes roughly 50 to 100 µs of careful analog sensing.',
      'You cannot read a single byte because the smallest readable unit is a page (~16 KB), and you cannot overwrite a page in place. Erasing happens in ~MB-sized blocks, so a translation layer constantly shuffles live data around, which creates write amplification.',
      'With no moving parts, the drive can run roughly 500k to 1M of these reads in parallel (IOPS). Latency is set by sensing physics; throughput comes from parallelism.',
    ],
    matters: 'An SSD is 800× slower than RAM per access, yet it survives power-off and costs roughly 10× less per GB. Databases live in this exact gap.',
  },
  {
    name: 'Same-datacenter round trip',
    ns: 500000,
    ch: 'net',
    tag: 'distance is free here, software pays the bill',
    numberId: 'same-dc-rtt',
    physics: [
      'Signal travel across a 100 m building takes about 0.5 µs, practically nothing.',
      'The remaining ~499.5 µs go to serializing bytes onto the wire, crossing 2 to 3 switch hops (~1 to 10 µs each), and mostly traversing the kernel network stack and scheduler on both ends.',
      'That is why kernel-bypass and RDMA exist: inside one datacenter, the latency floor is software, not light.',
    ],
    matters: 'At 0.5 ms per hop, a request fanning through 6 internal services spends 3 ms before doing any real work. Chatty microservices pay this tax on every single call.',
  },
  {
    name: 'HDD random read',
    ns: 8000000,
    ch: 'storage',
    tag: 'a mechanical arm inside your latency budget',
    numberId: 'hdd-seek',
    physics: [
      'A 7200 RPM platter spins 120 times a second, so one revolution takes 8.33 ms. On average, you wait half a spin, 4.2 ms, for your sector to swing around.',
      'Before that, the read head has to physically move to the right track, adding ~4 ms of actual moving metal.',
      'Together that is roughly 8 ms per random read, capping the disk at about 120 random reads per second. That number cannot budge because spinning the platter faster would tear it apart.',
      'Sequential access is the loophole: once the head is in position, data streams at ~200 MB/s, a 1000:1 gap between random and sequential I/O.',
    ],
    matters: "This single mechanical limit explains modern storage design: B-trees, LSM-trees, write-ahead logs, and Kafka's entire architecture all turn random I/O into sequential I/O.",
  },
  {
    name: 'Cross-region round trip (US E↔W)',
    ns: 70000000,
    ch: 'net',
    tag: 'the speed of light, billed per packet',
    numberId: 'cross-region-rtt',
    physics: [
      'Light moves at 300,000 km/s in vacuum, but fiber (refractive index ~1.47) slows it to ~200,000 km/s.',
      'NY↔SF runs roughly 4,700 km along non-straight fiber, putting the absolute floor at ~24 ms one way and ~48 ms round trip. Real routing and queuing bring reality to ~60 to 80 ms.',
      'No engineering trick fixes this. It is the exact same physics that stopped CPU clocks from scaling, only now at planetary size.',
    ],
    matters: 'Every consistency debate in distributed systems comes back to this number: synchronous cross-region agreement costs 70 ms per round trip, and consensus needs multiple rounds. At global scale, CAP is geography.',
  },
]
