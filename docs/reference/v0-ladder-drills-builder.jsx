/* PORTED (specs 020/040/010) → src/modes/manual (ladder), src/modes/drills,
   src/modes/builder. The shipped code is the source of truth; do NOT re-read
   this file to build on those modes. Kept only as voice/feel reference. */

import React, { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   GROUNDED — learn systems design from the physics up
   Modes: LADDER (derive the numbers) · DRILLS (prove you know
   them) · BUILDER (assemble systems, watch them fail honestly)
   ============================================================ */

const C = {
  bg: "#0F1930",
  panel: "#152238",
  panelUp: "#1B2C48",
  line: "#283A5C",
  text: "#E9EEF8",
  dim: "#8FA0C0",
  faint: "#5B6C8F",
  net: "#53DCEC",     // network channel
  compute: "#F6BB52", // compute channel
  storage: "#EF7BD0", // storage channel
  mem: "#72EAA8",     // memory / cache channel
  alert: "#F26D5E",
  ok: "#72EAA8",
};

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.gr-root { font-family: 'Space Grotesk', sans-serif; }
.gr-mono { font-family: 'IBM Plex Mono', monospace; }
.gr-root ::selection { background: #53DCEC44; }
.gr-root input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
.gr-root input[type=range]::-webkit-slider-runnable-track { height: 4px; background: #283A5C; border-radius: 2px; }
.gr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 22px; width: 10px; border-radius: 3px; background: #53DCEC; margin-top: -9px; box-shadow: 0 0 10px #53DCEC88; cursor: pointer; }
.gr-root input[type=range]::-moz-range-track { height: 4px; background: #283A5C; border-radius: 2px; }
.gr-root input[type=range]::-moz-range-thumb { height: 22px; width: 10px; border: none; border-radius: 3px; background: #53DCEC; cursor: pointer; }
@keyframes gr-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes gr-sweep { from { transform: translateX(-100%);} to { transform: translateX(340%);} }
@media (prefers-reduced-motion: reduce) { .gr-root * { animation: none !important; transition: none !important; } }
`;

/* ---------- shared formatting ---------- */
const fmtNum = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
  if (n >= 10) return Math.round(n).toLocaleString();
  return n.toPrecision(2);
};
const fmtTimeNs = (ns) => {
  if (ns < 1e3) return `${ns % 1 === 0 ? ns : ns.toFixed(1)} ns`;
  if (ns < 1e6) return `${(ns / 1e3).toPrecision(3)} µs`;
  if (ns < 1e9) return `${(ns / 1e6).toPrecision(3)} ms`;
  return `${(ns / 1e9).toPrecision(3)} s`;
};
// humanized: 1 ns -> 1 s
const fmtHuman = (ns) => {
  const s = ns; // seconds in human scale
  if (s < 1) return `${(s * 1000).toFixed(0)} ms — a camera flash`;
  if (s < 60) return `${s.toPrecision(2)} s`;
  if (s < 3600) return `${(s / 60).toPrecision(2)} min`;
  if (s < 86400) return `${(s / 3600).toPrecision(2)} hours`;
  if (s < 86400 * 60) return `${(s / 86400).toPrecision(2)} days`;
  if (s < 86400 * 365) return `${(s / 86400 / 30.4).toPrecision(2)} months`;
  return `${(s / 86400 / 365).toPrecision(2)} years`;
};
const lightDistance = (ns) => {
  const m = ns * 0.2998; // vacuum, m per ns
  if (m < 1) return `${(m * 100).toFixed(0)} cm`;
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(0)} km`;
};

/* ============================================================
   MODE 1 — THE LADDER
   ============================================================ */
const RUNGS = [
  {
    name: "One CPU cycle", ns: 0.3, ch: "compute",
    tag: "the tick everything is measured in",
    physics: [
      "A 3.3 GHz clock ticks 3.3 billion times per second → 1 ÷ 3.3e9 ≈ 0.3 ns per tick.",
      "In 0.3 ns, light itself travels only 9 cm. A signal in silicon moves slower. This is why chips are ~2 cm across — at higher clocks, a signal literally cannot cross the die in one tick.",
      "Clock speeds stalled near 3–5 GHz around 2005: power grows with voltage² × frequency, and the heat can no longer leave the silicon. Physics ended the free lunch; that's why we scale OUT (more cores, more machines) instead of UP.",
    ],
    matters: "Every capacity number in this game is downstream of this: a core does ~3 billion simple things per second, full stop.",
  },
  {
    name: "L1 cache hit", ns: 1, ch: "mem",
    tag: "data sitting next to the ALU",
    physics: [
      "L1 is ~48 KB of SRAM physically inside the core — 6 transistors per bit, no capacitor to recharge.",
      "Access ≈ 4 cycles ≈ 1 ns. It's fast because it's SMALL and CLOSE: the round trip is a few millimetres of wire.",
      "You cannot make it big and keep it fast — bigger memory means longer wires and more address-decode logic. Size vs speed is a geometric constraint, not a design failure.",
    ],
    matters: "The entire memory hierarchy exists because 'big' and 'fast' are physically incompatible. Caching at every layer of systems design is this same trade, repeated.",
  },
  {
    name: "L2 cache hit", ns: 4, ch: "mem",
    tag: "same trade, one ring out",
    physics: [
      "~1 MB per core, still SRAM, a few mm farther from the ALU → ~14 cycles.",
      "Rule of thumb forming: each hierarchy level is ~4–10× bigger and ~4–10× slower. Watch it repeat all the way down to cross-region.",
    ],
    matters: "When you see a 4–10× latency ratio between two layers of ANY system, you're looking at a healthy hierarchy.",
  },
  {
    name: "Main memory (DRAM)", ns: 100, ch: "mem",
    tag: "one capacitor per bit, and it leaks",
    physics: [
      "DRAM stores each bit as charge on a microscopic capacitor — 1 transistor + 1 capacitor, which is why it's 100× denser and cheaper than SRAM.",
      "But reading it means selecting a row, letting tiny charges bleed onto long wires, and waiting for sense amplifiers to decide 0-or-1. Then the read destroyed the data, so it must be written back.",
      "The capacitors leak: every cell must be refreshed every 64 ms or your data evaporates. RAM is not 'storage' — it is charge, actively kept alive.",
      "Net: ~100 ns random access ≈ 300 CPU cycles. Your 3 GHz core spends most of its life waiting for memory.",
    ],
    matters: "100 ns × billions of accesses is why 'it fits in RAM' vs 'it doesn't' is the single biggest performance question in any design.",
  },
  {
    name: "Compress 1 KB (snappy)", ns: 2000, ch: "compute",
    tag: "compute is cheap — use it to avoid I/O",
    physics: [
      "~2 µs of pure CPU ≈ 6,000 cycles to shrink 1 KB by ~2–4×.",
      "Compare: sending that KB cross-region costs 70,000,000 ns. Spending 2,000 ns to send half as many bytes is a 1000:1 win.",
    ],
    matters: "Interview instinct: CPU is almost always cheaper than the I/O it can save. Compress, batch, cache.",
  },
  {
    name: "NVMe SSD random read", ns: 80000, ch: "storage",
    tag: "reading trapped electrons",
    physics: [
      "Flash stores bits as electrons trapped in a floating gate. Reading = applying voltages and sensing which cells conduct — for TLC (3 bits/cell) you must distinguish 8 charge levels, which takes ~50–100 µs of careful sensing.",
      "You can't read one byte: the page (~16 KB) is the smallest readable unit. And you can't overwrite: erase happens in ~MB-sized blocks, so a translation layer shuffles data constantly (this is write amplification).",
      "No moving parts → ~500k–1M of these reads can run in parallel per drive (IOPS). Latency is physics; throughput is parallelism.",
    ],
    matters: "SSD is 800× slower than RAM per access but survives power-off and costs ~10× less per GB. Databases live in this gap.",
  },
  {
    name: "Same-datacenter round trip", ns: 500000, ch: "net",
    tag: "distance is free here — software is the cost",
    physics: [
      "Propagation across a 100 m building: ~0.5 µs. Essentially nothing.",
      "The other ~499.5 µs: serializing bytes onto the wire, 2–3 switch hops (~1–10 µs each), and mostly the kernel network stack + scheduling on both ends.",
      "This is why kernel-bypass and RDMA exist — inside a DC the floor is software, not light.",
    ],
    matters: "0.5 ms per hop means a request that fans out through 6 internal services has spent 3 ms before doing any work. Chatty microservices pay this toll on every call.",
  },
  {
    name: "HDD random read", ns: 8000000, ch: "storage",
    tag: "a mechanical arm, in your latency budget",
    physics: [
      "A 7200 RPM platter spins 120 times/sec → one revolution = 8.33 ms → on average you wait half a spin, 4.2 ms, for your sector to come around.",
      "Plus the read head physically swings to the right track: ~4 ms of actual moving metal.",
      "≈ 8 ms per random read → a disk can do only ~120 random reads per second. This number CANNOT improve — it's rotation speed, bounded by the platter tearing itself apart.",
      "Sequential is the loophole: once positioned, data streams at ~200 MB/s. Random:sequential asymmetry is 1000:1.",
    ],
    matters: "This one number explains database design: B-trees, LSM-trees, write-ahead logs, and Kafka's entire architecture are all schemes to convert random I/O into sequential I/O.",
  },
  {
    name: "Cross-region round trip (US E↔W)", ns: 70000000, ch: "net",
    tag: "the speed of light, invoiced",
    physics: [
      "Light in vacuum: 300,000 km/s. In fiber (refractive index ~1.47): ~200,000 km/s.",
      "NY↔SF ≈ 4,700 km of non-straight fiber → ~24 ms one way → ~48 ms round trip as an ABSOLUTE FLOOR. Routing and queuing bring reality to ~60–80 ms.",
      "No engineering fixes this. It is the same physics that ended clock scaling, now at planetary size.",
    ],
    matters: "Every consistency debate in distributed systems is really about this number: synchronous cross-region agreement costs 70 ms per round, and consensus needs multiple rounds. CAP is geography.",
  },
];

const CH_COLOR = { compute: C.compute, mem: C.mem, storage: C.storage, net: C.net };
const CH_LABEL = { compute: "COMPUTE", mem: "MEMORY", storage: "STORAGE", net: "NETWORK" };

function Ladder() {
  const [open, setOpen] = useState(0);
  const minLog = Math.log10(0.3), maxLog = Math.log10(70000000);
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>The Ladder</h2>
        <span className="gr-mono" style={{ color: C.dim, fontSize: 12 }}>
          human scale: 1 ns = 1 second
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14, marginTop: 4, marginBottom: 20, lineHeight: 1.5 }}>
        Eight numbers, each derived from a physical limit. Don't memorize them — re-derive them.
        The bar shows how far light travels in that time; the right column shows the wait if one nanosecond were one second.
      </p>
      {RUNGS.map((r, i) => {
        const frac = (Math.log10(r.ns) - minLog) / (maxLog - minLog);
        const col = CH_COLOR[r.ch];
        const isOpen = open === i;
        return (
          <div key={r.name} onClick={() => setOpen(isOpen ? -1 : i)}
            style={{ background: isOpen ? C.panelUp : C.panel, border: `1px solid ${isOpen ? col + "66" : C.line}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer", transition: "border-color .2s, background .2s" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span className="gr-mono" style={{ color: col, fontSize: 10, letterSpacing: 1.5, minWidth: 66 }}>{CH_LABEL[r.ch]}</span>
              <span style={{ fontWeight: 600, fontSize: 15, flex: "1 1 auto" }}>{r.name}</span>
              <span className="gr-mono" style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{fmtTimeNs(r.ns)}</span>
              <span className="gr-mono" style={{ color: C.dim, fontSize: 12, minWidth: 160, textAlign: "right" }}>{fmtHuman(r.ns)}</span>
            </div>
            {/* log-scale bar */}
            <div style={{ position: "relative", height: 8, background: C.bg, borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, width: `${Math.max(frac * 100, 1.5)}%`, background: `linear-gradient(90deg, ${col}33, ${col})`, borderRadius: 4 }} />
            </div>
            <div className="gr-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, marginTop: 4 }}>
              <span>{r.tag}</span>
              <span>light travels {lightDistance(r.ns)}</span>
            </div>
            {isOpen && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                {r.physics.map((p, j) => (
                  <div key={j} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <span className="gr-mono" style={{ color: col, fontSize: 12, marginTop: 2 }}>▸</span>
                    <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55 }}>{p}</span>
                  </div>
                ))}
                <div style={{ background: C.bg, border: `1px solid ${col}44`, borderRadius: 8, padding: "10px 12px", marginTop: 10 }}>
                  <span className="gr-mono" style={{ color: col, fontSize: 10, letterSpacing: 1.5 }}>WHY IT MATTERS IN AN INTERVIEW</span>
                  <div style={{ fontSize: 13.5, marginTop: 5, lineHeight: 1.5 }}>{r.matters}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ color: C.faint, fontSize: 12.5, marginTop: 14, lineHeight: 1.6 }}>
        The pattern to internalize: <span style={{ color: C.mem }}>memory</span> is bounded by wire length and leaking charge,{" "}
        <span style={{ color: C.storage }}>storage</span> by sensing physics and moving metal,{" "}
        <span style={{ color: C.net }}>networks</span> by the speed of light, and{" "}
        <span style={{ color: C.compute }}>compute</span> by heat. Every architecture is a negotiation between these four walls.
      </div>
    </div>
  );
}

/* ============================================================
   MODE 2 — DRILLS
   ============================================================ */
const DRILLS = [
  {
    q: "One modern app server (16 cores) serving a simple JSON API over HTTP. How many requests/second before it saturates?",
    unit: "req/s", ans: 10000, lo: 2, hi: 6,
    derive: [
      "A simple request costs ~1–2 ms of CPU (parse, validate, serialize).",
      "One core: 1000 ms ÷ 1.5 ms ≈ 700 req/s.",
      "16 cores × 700 ≈ 11k — call it 10k req/s per box.",
    ],
  },
  {
    q: "A single Postgres primary on good hardware, indexed point reads, working set cached in RAM. Reads per second?",
    unit: "reads/s", ans: 30000, lo: 2, hi: 6.5,
    derive: [
      "A cached point read is a few B-tree hops in RAM + protocol overhead ≈ 0.1–0.5 ms of work.",
      "Across cores with connection overhead: tens of thousands/s — 20–50k is the honest band.",
      "Uncached (touching disk) divides this by 10×: now you're paying SSD latency per read.",
    ],
  },
  {
    q: "Same Postgres primary — durable WRITES per second (each must hit the write-ahead log)?",
    unit: "writes/s", ans: 8000, lo: 2, hi: 5.5,
    derive: [
      "Every commit must fsync the write-ahead log — you're bounded by sequential SSD flushes, not CPU.",
      "Group commit batches many transactions per flush, buying you thousands, not millions.",
      "5–10k TPS is the classic single-primary ceiling. Past it: shard, or buffer through a queue.",
    ],
  },
  {
    q: "One Redis node (single-threaded core doing the work). GET operations per second?",
    unit: "ops/s", ans: 100000, lo: 3, hi: 7,
    derive: [
      "A GET is a hash lookup in RAM: ~1 µs of actual work → in theory 1M/s per core.",
      "Network syscalls eat most of it; pipelining wins some back.",
      "~100k ops/s per node is the planning number — it's 10× a database because it skips the disk and the query engine entirely.",
    ],
  },
  {
    q: "One Kafka broker on modern hardware. Messages per second (small ~1 KB messages)?",
    unit: "msgs/s", ans: 1000000, lo: 4, hi: 7.5,
    derive: [
      "Kafka's trick: it ONLY appends sequentially — remember the HDD rung: sequential I/O is ~1000× cheaper than random.",
      "1 KB × 1M/s = 1 GB/s, within reach of NVMe sequential bandwidth.",
      "~1M msgs/s per broker. It's fast because it refuses to do random I/O, not because of magic.",
    ],
  },
  {
    q: "10 million daily active users, each writing 5 events of 1 KB per day. Storage accumulated per day?",
    unit: "bytes/day", ans: 5e10, lo: 8, hi: 13,
    derive: [
      "10M × 5 × 1 KB = 50M KB = 50 GB/day.",
      "Sanity check the shape: users × actions × size. Interviewers care that you decompose, not that you nail digits.",
      "≈ 18 TB/year — fits a handful of drives. Storage is rarely the bottleneck; access patterns are.",
    ],
  },
  {
    q: "Those 10M DAU each make 50 requests/day. Average requests per second — and know your peak multiplier.",
    unit: "req/s (average)", ans: 5800, lo: 2, hi: 6,
    derive: [
      "10M × 50 = 500M requests/day ÷ 86,400 s ≈ 5,800 req/s average.",
      "Shortcut worth memorizing: 1M/day ≈ 12/s.",
      "Peak is 2–5× average for consumer traffic. Design for ~15–25k req/s, quote both numbers.",
    ],
  },
  {
    q: "Round-trip time between US East and US West datacenters?",
    unit: "ms", ans: 70, lo: 0, hi: 3.5,
    derive: [
      "~4,700 km of fiber, light at 200,000 km/s in glass → ~24 ms one way, ~48 ms floor.",
      "Real routing isn't straight: 60–80 ms in practice.",
      "Derived from the speed of light — which is why you can trust it forever.",
    ],
  },
];

function logSliderVal(pos, lo, hi) {
  const lg = lo + (pos / 1000) * (hi - lo);
  const raw = Math.pow(10, lg);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.round(raw / (mag / 10)) * (mag / 10); // 2 sig figs
}

function Drills() {
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState(500);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState([]);
  const d = DRILLS[idx % DRILLS.length];
  const guess = logSliderVal(pos, d.lo, d.hi);
  const err = Math.abs(Math.log10(guess) - Math.log10(d.ans));
  const grade = err <= 0.3 ? { label: "DEAD ON", pts: 100, col: C.ok }
    : err <= 0.6 ? { label: "RIGHT BALLPARK", pts: 75, col: C.mem }
    : err <= 1.0 ? { label: "SAME UNIVERSE", pts: 40, col: C.compute }
    : { label: `OFF BY ${err.toFixed(1)} ORDERS OF MAGNITUDE`, pts: 0, col: C.alert };
  const total = history.reduce((a, h) => a + h, 0);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Number Drills</h2>
        <span className="gr-mono" style={{ fontSize: 12, color: C.dim }}>
          drill {history.length + 1} · score {total}{history.length > 0 ? ` / ${history.length * 100}` : ""}
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Scored the way an interviewer scores you: by order of magnitude. Within ⅓ of an order is a hit. Every answer shows the derivation — a miss here is worth more than a lucky hit.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 22 }}>
        <div className="gr-mono" style={{ color: C.net, fontSize: 10, letterSpacing: 1.5, marginBottom: 10 }}>ESTIMATE</div>
        <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, marginBottom: 26 }}>{d.q}</div>

        <div className="gr-mono" style={{ textAlign: "center", fontSize: 30, fontWeight: 600, color: revealed ? grade.col : C.net, marginBottom: 6 }}>
          {fmtNum(guess)} <span style={{ fontSize: 14, color: C.dim }}>{d.unit}</span>
        </div>
        <input type="range" min={0} max={1000} value={pos} disabled={revealed}
          onChange={(e) => setPos(+e.target.value)} style={{ width: "100%" }} />
        <div className="gr-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.faint, marginTop: 4 }}>
          <span>{fmtNum(Math.pow(10, d.lo))}</span>
          <span>log scale — each step ×10</span>
          <span>{fmtNum(Math.pow(10, d.hi))}</span>
        </div>

        {!revealed ? (
          <button onClick={() => { setRevealed(true); setHistory([...history, grade.pts]); }}
            style={{ marginTop: 22, width: "100%", padding: "12px 0", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
            Lock it in
          </button>
        ) : (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
              <span className="gr-mono" style={{ color: grade.col, fontWeight: 600, fontSize: 14 }}>{grade.label} · +{grade.pts}</span>
              <span className="gr-mono" style={{ fontSize: 13, color: C.dim }}>answer ≈ <span style={{ color: C.text, fontWeight: 600 }}>{fmtNum(d.ans)} {d.unit}</span></span>
            </div>
            <div style={{ background: C.bg, borderRadius: 8, padding: "12px 14px", marginTop: 12, border: `1px solid ${C.line}` }}>
              <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 8 }}>HOW TO DERIVE IT</div>
              {d.derive.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7 }}>
                  <span className="gr-mono" style={{ color: C.compute, fontSize: 12 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setIdx(idx + 1); setPos(500); setRevealed(false); }}
              style={{ marginTop: 14, width: "100%", padding: "11px 0", background: C.panelUp, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Next drill →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MODE 3 — THE BUILDER
   ============================================================ */
const CAP = {
  app: { rps: 10000, cost: 150, base: 3 },
  cacheNode: { ops: 100000, cost: 200, base: 1 },
  dbWrite: 10000, dbRead: 20000, dbCost: 600, dbBase: 5,
  replica: { reads: 20000, cost: 400 },
  queue: { cost: 300, cap: 1000000 },
  worker: { drain: 5000, cost: 100 },
  lbBase: 1,
};

const SCENARIOS = [
  {
    name: "Blog goes viral",
    desc: "A personal blog hits the front page. Read-heavy, spiky-ish, forgiving.",
    rps: 8000, readPct: 0.98, budget: 2000, p99Target: 150,
    profile: (t) => Math.min(1, t / 10),
    hint: "8k req/s, 98% reads. Almost everything is the same page — where should reads live?",
  },
  {
    name: "Ticket sale launch",
    desc: "Concert tickets drop at noon. Heavy sustained reads, real writes underneath.",
    rps: 45000, readPct: 0.9, budget: 6500, p99Target: 200,
    profile: (t) => Math.min(1, t / 8),
    hint: "45k req/s. Do the math on 40.5k reads/s and 4.5k writes/s before touching anything.",
  },
  {
    name: "Sensor firehose",
    desc: "An IoT fleet phones home. Write-heavy, with a 2× burst mid-run.",
    rps: 9000, readPct: 0.15, budget: 5000, p99Target: 250,
    profile: (t) => (t >= 12 && t <= 22 ? 2.2 : 1) * Math.min(1, t / 6),
    hint: "Steady writes fit in one primary — but the burst doesn't. Buy capacity for the peak, or buy time?",
  },
];

const TICKS = 30;

function simulate(cfg, sc, t, backlogRef) {
  const rps = sc.rps * sc.profile(t);
  const reads = rps * sc.readPct;
  const writesIn = rps * (1 - sc.readPct);

  const comps = [];
  let errors = 0;
  const util = (load, cap) => (cap <= 0 ? 2 : load / cap);
  const mult = (u) => (u >= 1 ? 20 : 1 / (1 - Math.min(u, 0.95)));

  // App tier
  const uApp = util(rps, cfg.app * CAP.app.rps);
  if (uApp > 1) errors += (rps ? (rps - cfg.app * CAP.app.rps) / rps : 0);
  comps.push({ id: "app", label: `App servers ×${cfg.app}`, ch: "compute", u: uApp, note: `${fmtNum(rps)} req/s vs ${fmtNum(cfg.app * CAP.app.rps)} cap` });

  // Cache tier — every read checks cache first
  let dbReads = reads;
  let uCache = 0;
  if (cfg.cache > 0) {
    uCache = util(reads, cfg.cache * CAP.cacheNode.ops);
    if (uCache > 1) errors += (reads ? ((reads - cfg.cache * CAP.cacheNode.ops) / reads) * sc.readPct : 0);
    dbReads = reads * (1 - cfg.hitRate);
    comps.push({ id: "cache", label: `Cache ×${cfg.cache} (${Math.round(cfg.hitRate * 100)}% hit)`, ch: "mem", u: uCache, note: `${fmtNum(reads)} lookups/s · ${fmtNum(dbReads)} miss to DB` });
  }

  // Queue tier
  let writesToDb = writesIn;
  let uQ = 0, lag = backlogRef.current;
  if (cfg.queue) {
    uQ = util(writesIn, CAP.queue.cap);
    const drainCap = cfg.workers * CAP.worker.drain;
    const dbWriteCap = CAP.dbWrite * cfg.shards;
    const canDrain = Math.min(drainCap, dbWriteCap);
    const arriving = writesIn + backlogRef.current;
    writesToDb = Math.min(arriving, canDrain);
    backlogRef.current = Math.max(0, arriving - writesToDb);
    lag = backlogRef.current;
    comps.push({ id: "queue", label: `Queue + ${cfg.workers} workers`, ch: "net", u: util(writesToDb, canDrain), note: lag > 0 ? `backlog ${fmtNum(lag)} msgs` : `draining ${fmtNum(writesToDb)}/s` });
  }

  // DB tier
  const uDbW = util(writesToDb, CAP.dbWrite * cfg.shards);
  const readCapPrimary = CAP.dbRead * cfg.shards;
  let uDbR;
  if (cfg.replicas > 0) {
    uDbR = util(dbReads, cfg.replicas * CAP.replica.reads);
    comps.push({ id: "dbw", label: `DB primary ×${cfg.shards} shard${cfg.shards > 1 ? "s" : ""}`, ch: "storage", u: uDbW, note: `${fmtNum(writesToDb)} writes/s` });
    comps.push({ id: "dbr", label: `Read replicas ×${cfg.replicas}`, ch: "storage", u: uDbR, note: `${fmtNum(dbReads)} reads/s` });
  } else {
    uDbR = util(dbReads, readCapPrimary);
    const uBoth = uDbW + uDbR;
    comps.push({ id: "db", label: `DB primary ×${cfg.shards} (reads + writes)`, ch: "storage", u: uBoth, note: `${fmtNum(dbReads)} r/s + ${fmtNum(writesToDb)} w/s` });
    if (uBoth > 1) errors += Math.min(0.6, (uBoth - 1) * 0.5);
  }
  if (!cfg.queue && uDbW > 1) errors += (1 - sc.readPct) * Math.min(1, uDbW - 1);
  if (cfg.replicas > 0 && uDbR > 1) errors += sc.readPct * (1 - (cfg.cache ? cfg.hitRate : 0)) * Math.min(1, uDbR - 1);

  // latency chain (rough M/M/1 flavor)
  const appLat = CAP.app.base * mult(uApp);
  const cacheLat = cfg.cache ? CAP.cacheNode.base * mult(uCache) : 0;
  const dbLat = CAP.dbBase * mult(cfg.replicas > 0 ? Math.max(uDbR, uDbW) : uDbR + uDbW);
  const hit = cfg.cache ? cfg.hitRate : 0;
  const readLat = CAP.lbBase + appLat + hit * cacheLat + (1 - hit) * (cacheLat + dbLat);
  const writeLat = CAP.lbBase + appLat + (cfg.queue ? 2 : CAP.dbBase * mult(uDbW));
  const p50 = sc.readPct * readLat + (1 - sc.readPct) * writeLat;
  const p99 = Math.min(5000, p50 * 3.2);

  return { rps, comps, p50, p99, errRate: Math.min(1, errors), lag };
}

function costOf(cfg) {
  return cfg.app * CAP.app.cost + cfg.cache * CAP.cacheNode.cost + cfg.shards * CAP.dbCost +
    cfg.replicas * CAP.replica.cost + (cfg.queue ? CAP.queue.cost + cfg.workers * CAP.worker.cost : 0);
}

function Stepper({ label, val, set, min, max, col }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 13.5 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => set(Math.max(min, val - 1))} style={{ width: 26, height: 26, borderRadius: 6, background: C.bg, color: C.text, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: 15 }}>−</button>
        <span className="gr-mono" style={{ minWidth: 22, textAlign: "center", color: col, fontWeight: 600 }}>{val}</span>
        <button onClick={() => set(Math.min(max, val + 1))} style={{ width: 26, height: 26, borderRadius: 6, background: C.bg, color: C.text, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: 15 }}>+</button>
      </div>
    </div>
  );
}

function Builder() {
  const [scIdx, setScIdx] = useState(0);
  const sc = SCENARIOS[scIdx];
  const [cfg, setCfg] = useState({ app: 2, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 });
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [frame, setFrame] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const histRef = useRef([]);
  const backlogRef = useRef(0);
  const cost = costOf(cfg);
  const set = (k) => (v) => { setCfg((c) => ({ ...c, [k]: v })); setVerdict(null); setFrame(null); };

  useEffect(() => {
    if (!running) return;
    if (tick > TICKS) {
      setRunning(false);
      const h = histRef.current;
      const worstP99 = Math.max(...h.map((f) => f.p99));
      const worstErr = Math.max(...h.map((f) => f.errRate));
      const endLag = h[h.length - 1].lag;
      const checks = [
        { name: `p99 ≤ ${sc.p99Target} ms`, pass: worstP99 <= sc.p99Target, detail: `worst p99: ${worstP99.toFixed(0)} ms` },
        { name: "error rate ≤ 0.5%", pass: worstErr <= 0.005, detail: `worst: ${(worstErr * 100).toFixed(1)}%` },
        { name: `cost ≤ $${sc.budget}/mo`, pass: cost <= sc.budget, detail: `$${cost}/mo` },
        ...(cfg.queue ? [{ name: "queue drained by end", pass: endLag < 1000, detail: endLag >= 1000 ? `${fmtNum(endLag)} msgs stranded` : "clean" }] : []),
      ];
      const diagnosis = [];
      const worst = h.reduce((a, f) => { f.comps.forEach((c) => { if (!a[c.id] || c.u > a[c.id].u) a[c.id] = c; }); return a; }, {});
      Object.values(worst).forEach((c) => {
        if (c.u >= 1) diagnosis.push(`${c.label} hit ${(c.u * 100).toFixed(0)}% — every request beyond capacity queued or died. (${c.note})`);
        else if (c.u >= 0.8) diagnosis.push(`${c.label} peaked at ${(c.u * 100).toFixed(0)}% — past ~80%, queueing delay explodes nonlinearly (1/(1−ρ)). This is why the cheat-sheet scale triggers sit at 70–80%.`);
      });
      if (checks.every((c) => c.pass) && cost < sc.budget * 0.75) diagnosis.push(`Passed with $${sc.budget - cost} to spare — in an interview, say what you'd cut and what headroom you're keeping on purpose.`);
      setVerdict({ pass: checks.every((c) => c.pass), checks, diagnosis });
      return;
    }
    const id = setTimeout(() => {
      const f = simulate(cfg, sc, tick, backlogRef);
      histRef.current.push(f);
      setFrame(f);
      setTick(tick + 1);
    }, 160);
    return () => clearTimeout(id);
  }, [running, tick]);

  const start = () => { histRef.current = []; backlogRef.current = 0; setVerdict(null); setTick(0); setFrame(null); setRunning(true); };

  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>The Builder</h2>
      <p style={{ color: C.dim, fontSize: 14, marginTop: 6, marginBottom: 18, lineHeight: 1.5 }}>
        Components use the numbers from your cheat sheet and the Ladder. Assemble a system, run the scenario, and watch honestly where it breaks. Passing cheap is worth more than passing big.
      </p>

      {/* scenario picker */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {SCENARIOS.map((s, i) => (
          <button key={s.name} onClick={() => { setScIdx(i); setVerdict(null); setFrame(null); backlogRef.current = 0; }}
            style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: i === scIdx ? C.net : C.panel, color: i === scIdx ? C.bg : C.dim, border: `1px solid ${i === scIdx ? C.net : C.line}` }}>
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{sc.desc}</div>
        <div className="gr-mono" style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>
          peak {fmtNum(sc.rps)} req/s · {Math.round(sc.readPct * 100)}% reads · SLA p99 ≤ {sc.p99Target} ms · budget ${sc.budget}/mo
        </div>
        <div style={{ fontSize: 12.5, color: C.compute, marginTop: 6 }}>◈ {sc.hint}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr", gap: 16, alignItems: "start" }}>
        {/* config */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
          <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.dim, marginBottom: 6 }}>YOUR ARCHITECTURE</div>
          <Stepper label={`App servers · $${CAP.app.cost} · 10k rps`} val={cfg.app} set={set("app")} min={1} max={12} col={C.compute} />
          <Stepper label={`Cache nodes · $${CAP.cacheNode.cost} · 100k ops`} val={cfg.cache} set={set("cache")} min={0} max={6} col={C.mem} />
          {cfg.cache > 0 && (
            <div style={{ padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: C.dim }}>hit rate (TTL / eviction trade)</span>
                <span className="gr-mono" style={{ color: C.mem }}>{Math.round(cfg.hitRate * 100)}%</span>
              </div>
              <input type="range" min={50} max={95} value={cfg.hitRate * 100} onChange={(e) => set("hitRate")(+e.target.value / 100)} style={{ width: "100%" }} />
            </div>
          )}
          <Stepper label={`DB shards · $${CAP.dbCost} · 10k w/s`} val={cfg.shards} set={set("shards")} min={1} max={4} col={C.storage} />
          <Stepper label={`Read replicas · $${CAP.replica.cost} · 20k r/s`} val={cfg.replicas} set={set("replicas")} min={0} max={6} col={C.storage} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: cfg.queue ? `1px solid ${C.line}` : "none" }}>
            <span style={{ fontSize: 13.5 }}>Write queue · ${CAP.queue.cost}</span>
            <button onClick={() => set("queue")(!cfg.queue)}
              style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: cfg.queue ? C.net : C.bg, color: cfg.queue ? C.bg : C.dim, border: `1px solid ${cfg.queue ? C.net : C.line}` }}>
              {cfg.queue ? "ON" : "OFF"}
            </button>
          </div>
          {cfg.queue && <Stepper label={`Workers · $${CAP.worker.cost} · 5k w/s`} val={cfg.workers} set={set("workers")} min={1} max={8} col={C.net} />}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "baseline" }}>
            <span className="gr-mono" style={{ fontSize: 11, color: C.dim }}>MONTHLY COST</span>
            <span className="gr-mono" style={{ fontSize: 18, fontWeight: 600, color: cost > sc.budget ? C.alert : C.ok }}>${cost}</span>
          </div>
          <button onClick={start} disabled={running}
            style={{ marginTop: 12, width: "100%", padding: "12px 0", background: running ? C.line : C.net, color: running ? C.dim : C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: running ? "default" : "pointer", fontFamily: "inherit" }}>
            {running ? `Running… t=${tick}/${TICKS}` : "Run scenario"}
          </button>
        </div>

        {/* live view */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, minHeight: 300 }}>
          {!frame && !verdict && (
            <div style={{ color: C.faint, fontSize: 13.5, lineHeight: 1.6, padding: 8 }}>
              Traffic will ramp to peak over the run. Utilization bars go amber past 80% — the point where queueing
              delay stops being linear — and red at 100%, where requests start dying. Latency compounds down the chain:
              LB → app → cache → database.
            </div>
          )}
          {frame && (
            <div>
              <div className="gr-mono" style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, marginBottom: 14 }}>
                <span style={{ color: C.dim }}>in <b style={{ color: C.text }}>{fmtNum(frame.rps)}/s</b></span>
                <span style={{ color: C.dim }}>p50 <b style={{ color: C.text }}>{frame.p50.toFixed(0)} ms</b></span>
                <span style={{ color: C.dim }}>p99 <b style={{ color: frame.p99 > sc.p99Target ? C.alert : C.ok }}>{frame.p99.toFixed(0)} ms</b></span>
                <span style={{ color: C.dim }}>errors <b style={{ color: frame.errRate > 0.005 ? C.alert : C.ok }}>{(frame.errRate * 100).toFixed(1)}%</b></span>
                {frame.lag > 0 && <span style={{ color: C.compute }}>lag {fmtNum(frame.lag)}</span>}
              </div>
              {frame.comps.map((c) => {
                const col = c.u >= 1 ? C.alert : c.u >= 0.8 ? C.compute : CH_COLOR[c.ch];
                return (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                      <span>{c.label}</span>
                      <span className="gr-mono" style={{ color: col, fontWeight: 600, animation: c.u >= 1 ? "gr-pulse 0.8s infinite" : "none" }}>{(c.u * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 14, background: C.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: `${Math.min(c.u, 1) * 100}%`, background: `linear-gradient(90deg, ${col}55, ${col})`, transition: "width .15s linear" }} />
                      <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: 1, background: C.faint }} />
                    </div>
                    <div className="gr-mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>{c.note}</div>
                  </div>
                );
              })}
            </div>
          )}
          {verdict && (
            <div style={{ marginTop: frame ? 8 : 0, borderTop: frame ? `1px solid ${C.line}` : "none", paddingTop: frame ? 14 : 0 }}>
              <div className="gr-mono" style={{ fontSize: 16, fontWeight: 700, color: verdict.pass ? C.ok : C.alert, marginBottom: 10 }}>
                {verdict.pass ? "✓ SYSTEM HELD" : "✗ SYSTEM FAILED"}
              </div>
              {verdict.checks.map((c) => (
                <div key={c.name} className="gr-mono" style={{ fontSize: 12.5, marginBottom: 5, color: c.pass ? C.dim : C.alert }}>
                  {c.pass ? "✓" : "✗"} {c.name} <span style={{ color: C.faint }}>— {c.detail}</span>
                </div>
              ))}
              {verdict.diagnosis.length > 0 && (
                <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", marginTop: 10 }}>
                  <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 6 }}>POST-MORTEM</div>
                  {verdict.diagnosis.map((d, i) => (
                    <div key={i} style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 6 }}>{d}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SHELL
   ============================================================ */
export default function Grounded() {
  const [mode, setMode] = useState("ladder");
  const modes = [
    { id: "ladder", label: "01 · THE LADDER", sub: "derive the numbers" },
    { id: "drills", label: "02 · DRILLS", sub: "prove you own them" },
    { id: "builder", label: "03 · BUILDER", sub: "assemble & break systems" },
  ];
  return (
    <div className="gr-root" style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <style>{FONT_CSS}</style>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "18px 20px 0" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>GROUNDED</h1>
            <span className="gr-mono" style={{ fontSize: 11.5, color: C.faint }}>systems design, from the physics up · prototype v0.1</span>
          </div>
          <nav style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
            {modes.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ padding: "10px 16px 12px", background: "transparent", border: "none", borderBottom: `2px solid ${mode === m.id ? C.net : "transparent"}`, color: mode === m.id ? C.text : C.dim, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, textAlign: "left" }}>
                <div style={{ fontWeight: 600, letterSpacing: 0.5 }}>{m.label}</div>
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{m.sub}</div>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ padding: "26px 20px 60px" }}>
        {mode === "ladder" && <Ladder />}
        {mode === "drills" && <Drills />}
        {mode === "builder" && <Builder />}
      </main>
    </div>
  );
}
