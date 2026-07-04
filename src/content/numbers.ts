// The numbers database (docs/architecture.md · "Numbers database").
// Every number the game displays must be derivable from an entry here.
// derivation is exactly 3 steps: mechanism → math → result.

export interface NumberEntry {
  id: string
  value: number
  unit: string
  derivation: [string, string, string]
  boundingPhysics: string
  /** which Lab toy makes this number unforgettable (null = no toy yet) */
  toyId: string | null
  confusions: string
  simplifies?: string
}

export const NUMBERS: NumberEntry[] = [
  /* ---------- the latency ladder ---------- */
  {
    id: 'cpu-cycle',
    value: 0.3,
    unit: 'ns',
    derivation: [
      'A 3.3 GHz clock ticks 3.3 billion times per second.',
      '1 ÷ 3.3e9 seconds ≈ 0.3 ns per tick.',
      'In 0.3 ns light travels only 9 cm — a signal cannot cross a bigger chip in one tick, which is why dies are ~2 cm and clocks stalled near 3–5 GHz.',
    ],
    boundingPhysics: 'Speed of light across the die; heat (power ∝ V²·f) capped the frequency race in ~2005.',
    toyId: 'light',
    confusions: 'A cycle is not an instruction — modern cores retire several instructions per cycle, and stall for hundreds waiting on memory.',
  },
  {
    id: 'l1-hit',
    value: 1,
    unit: 'ns',
    derivation: [
      'L1 is ~48 KB of SRAM physically inside the core — 6 transistors per bit, no capacitor to recharge.',
      'Access ≈ 4 cycles × 0.3 ns ≈ 1 ns.',
      'It is fast because it is SMALL and CLOSE: the round trip is a few millimetres of wire.',
    ],
    boundingPhysics: 'Wire length: bigger memories need longer wires and more address-decode logic, so big and fast are geometrically incompatible.',
    toyId: 'light',
    confusions: 'L1 is per-core, not shared; hitting in a neighbor core’s cache costs far more (coherence traffic).',
  },
  {
    id: 'l2-hit',
    value: 4,
    unit: 'ns',
    derivation: [
      '~1 MB per core, still SRAM, a few mm farther from the ALU.',
      '≈ 14 cycles × 0.3 ns ≈ 4 ns.',
      'Each hierarchy level is ~4–10× bigger and ~4–10× slower — the ratio repeats all the way down to cross-region.',
    ],
    boundingPhysics: 'Same wire-length geometry as L1, one ring farther out.',
    toyId: null,
    confusions: 'A 4–10× latency ratio between adjacent layers of ANY system is a healthy hierarchy, not a bug.',
  },
  {
    id: 'l3-hit',
    value: 12,
    unit: 'ns',
    derivation: [
      'L3 is tens of MB of SRAM shared by all cores, physically spread across the die.',
      '≈ 40 cycles × 0.3 ns ≈ 12 ns.',
      'Shared means farther: the data may sit in a slice on the other side of the chip.',
    ],
    boundingPhysics: 'On-die distance plus arbitration between cores.',
    toyId: null,
    confusions: 'L3 is the last stop before the ~10× cliff to DRAM — "fits in L3" vs "spills to RAM" decides many benchmark mysteries.',
  },
  {
    id: 'dram-access',
    value: 100,
    unit: 'ns',
    derivation: [
      'DRAM stores each bit as charge on a microscopic capacitor (1 transistor + 1 capacitor — that is why it is dense and cheap).',
      'Reading = select a row, let a whisper of charge bleed onto a long wire, wait for a sense amplifier to decide 0-or-1, then REWRITE the bit the read destroyed.',
      'The whole dance ≈ 100 ns ≈ 300 CPU cycles of the core doing nothing.',
    ],
    boundingPhysics: 'Sense-amplifier settling time on long, high-capacitance wires; capacitors leak, so every row is refreshed every 64 ms forever.',
    toyId: 'dram',
    confusions: 'Sequential/streaming DRAM reads amortize to much better than 100 ns — the number is for a RANDOM access.',
    simplifies: 'Row-buffer hits, prefetching, and NUMA distance all move this number in real machines.',
  },
  {
    id: 'compress-1kb',
    value: 2_000,
    unit: 'ns',
    derivation: [
      'Fast compressors (snappy, lz4) run ~500 MB/s per core.',
      '1 KB ÷ 500 MB/s ≈ 2 µs ≈ 6,000 cycles for a 2–4× size cut.',
      'Sending that KB cross-region costs 70,000,000 ns — paying 2,000 ns to halve the bytes is a ~1000:1 win.',
    ],
    boundingPhysics: 'Pure CPU arithmetic — which is exactly the point: compute is the cheap resource.',
    toyId: null,
    confusions: 'Heavy compressors (gzip -9, brotli) are 10–50× slower; the interview instinct is fast-compression-by-default, not max ratio.',
  },
  {
    id: 'nvme-read',
    value: 80_000,
    unit: 'ns',
    derivation: [
      'Flash stores bits as electrons trapped in a floating gate; TLC packs 3 bits per cell as 8 distinguishable charge levels.',
      'Reading = applying stepped voltages and sensing which cells conduct ≈ 50–100 µs of careful analog work.',
      'Call it 80 µs per random read — 800× slower than DRAM, but it survives power-off.',
    ],
    boundingPhysics: 'Charge-sensing precision: more bits per cell = finer voltage steps = slower, less durable reads.',
    toyId: 'light',
    confusions: 'Latency is physics but throughput is parallelism — one drive still does ~500k–1M IOPS because thousands of reads run at once.',
    simplifies: 'Page (~16 KB) granularity, erase blocks, and the translation layer (write amplification) are hidden here.',
  },
  {
    id: 'same-dc-rtt',
    value: 500_000,
    unit: 'ns',
    derivation: [
      'Propagation across a 100 m building is ~0.5 µs — essentially nothing.',
      'The other ~499.5 µs is software: serialization, 2–3 switch hops, and the kernel network stack + scheduling on both ends.',
      '≈ 0.5 ms per in-DC round trip; a request fanning through 6 internal services pays ~3 ms before doing any work.',
    ],
    boundingPhysics: 'Inside a datacenter the floor is software, not light — which is why kernel-bypass and RDMA exist.',
    toyId: null,
    confusions: 'Do not confuse with cross-region RTT (~140× worse) — "a network call" is not one number.',
  },
  {
    id: 'hdd-seek',
    value: 8_000_000,
    unit: 'ns',
    derivation: [
      'A 7200 RPM platter spins 120 times/sec → one revolution = 8.33 ms → you wait half a spin (~4.2 ms) on average for your sector.',
      'Plus the head physically swings to the right track: ~4 ms of moving metal.',
      '≈ 8 ms per random read → ~120 random reads/second, forever.',
    ],
    boundingPhysics: 'Rotation speed — bounded by the platter tearing itself apart. This number cannot be engineered away.',
    toyId: 'disk',
    confusions: 'Sequential is the loophole: once positioned, data streams at ~200 MB/s — a 1000:1 asymmetry that designed the entire data stack.',
  },
  {
    id: 'cross-region-rtt',
    value: 70_000_000,
    unit: 'ns',
    derivation: [
      'Light in fiber (refractive index ~1.47) travels ~200,000 km/s.',
      'NY↔SF ≈ 4,700 km of non-straight fiber → ~24 ms one way → ~48 ms round trip as an absolute floor.',
      'Routing and queuing bring reality to ~60–80 ms; call it 70 ms.',
    ],
    boundingPhysics: 'The speed of light in glass. No engineering fixes this; CAP is geography.',
    toyId: 'light',
    confusions: 'Consensus needs MULTIPLE round trips — global strong writes cost ~150 ms, not 70.',
  },

  /* ---------- rates & capacities ---------- */
  {
    id: 'req-per-day-rule',
    value: 12,
    unit: 'req/s per 1M/day',
    derivation: [
      'One day is 86,400 seconds.',
      '1,000,000 ÷ 86,400 ≈ 11.6.',
      'Shortcut worth memorizing: 1M/day ≈ 12/s average.',
    ],
    boundingPhysics: 'Arithmetic — the length of a day.',
    toyId: null,
    confusions: 'That is the AVERAGE; consumer traffic peaks at 2–5× average, so quote both numbers.',
  },
  {
    id: 'peak-multiplier',
    value: 3,
    unit: '× average (2–5 range)',
    derivation: [
      'Human traffic is diurnal: most of a region is active in the same few evening hours.',
      'Squeezing ~50% of daily traffic into ~4 of 24 hours ≈ 3× the flat average.',
      'Design for the peak, pay for the average — that tension is what queues and autoscaling are for.',
    ],
    boundingPhysics: 'Human sleep schedules, not silicon.',
    toyId: null,
    confusions: 'Machine (IoT) traffic is flat 24/7 — no peak hours, but brutal synchronized bursts instead.',
  },
  {
    id: 'hdd-iops',
    value: 120,
    unit: 'IOPS',
    derivation: [
      'Every random read costs ~8 ms of rotation + seek (see hdd-seek).',
      '1000 ms ÷ 8 ms ≈ 120 operations per second.',
      'B-trees, LSM-trees, WALs, and Kafka all exist to dodge this number.',
    ],
    boundingPhysics: 'Rotation physics — same bound as hdd-seek, expressed as a rate.',
    toyId: 'disk',
    confusions: 'An SSD does ~500k–1M IOPS; if a design assumes spinning disks, say so out loud.',
  },
  {
    id: 'nvme-iops',
    value: 750_000,
    unit: 'IOPS (500k–1M)',
    derivation: [
      'One flash read takes ~80 µs (see nvme-read), so one channel does only ~12k/s.',
      'But a drive has many dies and deep queues — thousands of reads in flight at once.',
      'Parallelism × per-read physics ≈ 500k–1M random reads/s per drive.',
    ],
    boundingPhysics: 'Latency is charge-sensing physics; throughput is how many sensors run in parallel.',
    toyId: null,
    confusions: 'One thread doing sequential dependent reads gets ~12k/s, not a million — IOPS numbers assume queue depth.',
  },
  {
    id: 'redis-ops',
    value: 100_000,
    unit: 'ops/s per node',
    derivation: [
      'A GET is a hash lookup in RAM: ~1 µs of actual work → in theory 1M/s per core.',
      'Network syscalls eat most of it; pipelining wins some back.',
      '~100k ops/s per node is the honest planning number.',
    ],
    boundingPhysics: 'Kernel networking overhead per request, not the lookup itself.',
    toyId: null,
    confusions: 'It is 10× a database because it skips disk AND the query engine — not because RAM is magic.',
    simplifies: 'Ignores connection limits, big values, hot-key skew, and cold-start warmup.',
  },
  {
    id: 'kafka-msgs',
    value: 1_000_000,
    unit: 'msgs/s per broker',
    derivation: [
      'Kafka ONLY appends sequentially — recall the disk toy: sequential I/O is ~1000× cheaper than random.',
      '1 KB × 1M/s = 1 GB/s, within NVMe sequential bandwidth.',
      '~1M small msgs/s per broker: fast because it refuses to do random I/O, not because of magic.',
    ],
    boundingPhysics: 'Sequential disk bandwidth plus zero-copy networking.',
    toyId: 'disk',
    confusions: 'Consumers that fall behind and read old data turn the workload random again — and the number collapses.',
  },
  {
    id: 'pg-writes',
    value: 8_000,
    unit: 'TPS (5–10k)',
    derivation: [
      'Every commit must fsync the write-ahead log — bounded by sequential flush latency, not CPU.',
      'Group commit batches many transactions per flush, buying thousands, not millions.',
      '5–10k durable TPS is the classic single-primary ceiling; past it you shard or buffer through a queue.',
    ],
    boundingPhysics: 'fsync durability: the write must physically reach non-volatile media before "saved".',
    toyId: 'dram',
    confusions: 'Read throughput is 3–5× higher because cached reads never touch the truth on disk.',
    simplifies: 'Real ceilings vary with row size, indexes, and replication mode; this is the planning number.',
  },
  {
    id: 'pg-reads',
    value: 30_000,
    unit: 'QPS (20–50k)',
    derivation: [
      'A cached point read is a few B-tree hops in RAM + protocol overhead ≈ 0.1–0.5 ms.',
      'Across cores with connection overhead: tens of thousands per second.',
      '20–50k cached QPS; uncached (touching disk) divides by ~10.',
    ],
    boundingPhysics: 'Memory access + per-connection software overhead.',
    toyId: null,
    confusions: '"Working set fits in RAM" is doing all the work in this number — check it before quoting it.',
  },
  {
    id: 'app-server-rps',
    value: 10_000,
    unit: 'req/s per box',
    derivation: [
      'A simple request costs ~1–2 ms of CPU (parse, validate, serialize).',
      'One core: 1000 ms ÷ 1.5 ms ≈ 700 req/s.',
      '16 cores × 700 ≈ 11k — call it 10k req/s per box.',
    ],
    boundingPhysics: 'CPU cycles per request; cores per box (heat-bounded, see cpu-cycle).',
    toyId: 'queue',
    confusions: '"Simple" is load-bearing: one downstream call or JSON blob 10× bigger changes the answer.',
    simplifies: 'The simulator treats app servers as perfectly interchangeable and stateless.',
  },
  {
    id: 'queue-knee',
    value: 0.8,
    unit: 'utilization',
    derivation: [
      'Random arrivals clump; near full utilization there is no slack to absorb a clump.',
      'Waiting time grows like 1/(1−u) — gentle at 0.5, vertical past ~0.8.',
      'Every cheat-sheet scale trigger (CPU > 70%, memory > 80%) is this same knee on this same curve.',
    ],
    boundingPhysics: 'Queueing theory (M/M/1): variance + finite capacity, true of any server anywhere.',
    toyId: 'queue',
    confusions: 'Throughput barely changes as you cross the knee — it is WAITING that explodes, which is why the failure surprises people.',
  },
]

export const numberById = (id: string): NumberEntry | undefined => NUMBERS.find((n) => n.id === id)
