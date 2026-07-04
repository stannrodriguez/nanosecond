import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   GROUNDED: DESIGN REVIEW (v0.1)
   Three drills that train JUDGMENT, not just capacity math:
   01 FIND THE FLAW — a plausible design hides one killer bug.
      Click your suspect, then watch traffic expose the truth.
   02 PREDICT & RUN — commit predictions BEFORE the sim runs.
      Calibration is the skill interviews actually measure.
   03 TASTE TEST — two defensible designs, one requirement.
      Good vs bad is not absolute; it's fit.
   Puzzles seeded from a real whiteboard: the distributed
   job scheduler (watcher, SQS, DynamoDB, visibility timeouts).
   ============================================================ */

const C = {
  bg: "#0F1930", panel: "#152238", panelUp: "#1B2C48", line: "#283A5C",
  text: "#E9EEF8", dim: "#8FA0C0", faint: "#5B6C8F",
  net: "#53DCEC", compute: "#F6BB52", storage: "#EF7BD0", mem: "#72EAA8",
  alert: "#F26D5E", ok: "#72EAA8",
};
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.dr-root { font-family: 'Space Grotesk', sans-serif; }
.dr-mono { font-family: 'IBM Plex Mono', monospace; }
@keyframes dr-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.dr-root input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
.dr-root input[type=range]::-webkit-slider-runnable-track { height: 4px; background: #283A5C; border-radius: 2px; }
.dr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 22px; width: 10px; border-radius: 3px; background: #53DCEC; margin-top: -9px; cursor: pointer; }
`;
const fmt = (n) => (n >= 1e6 ? (n / 1e6).toPrecision(3) + "M" : n >= 1e3 ? (n / 1e3).toPrecision(3) + "k" : Math.round(n).toLocaleString());

/* ============================================================
   SHARED — architecture diagram renderer
   ============================================================ */
function Diagram({ nodes, edges, picked, onPick, flaw, revealed, locked }) {
  const W = 660, H = 250, NW = 122, NH = 46;
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: C.bg, borderRadius: 10, border: `1px solid ${C.line}` }}>
      {edges.map((e, i) => {
        const a = pos[e.a], b = pos[e.b];
        return (
          <g key={i}>
            <line x1={a.x + NW / 2} y1={a.y + NH / 2} x2={b.x + NW / 2} y2={b.y + NH / 2} stroke={C.line} strokeWidth="1.5" />
            {e.label && (
              <text x={(a.x + b.x + NW) / 2} y={(a.y + b.y + NH) / 2 - 5} fill={C.faint} fontSize="9" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">{e.label}</text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const isPicked = picked === n.id;
        const isFlaw = revealed && flaw === n.id;
        const stroke = isFlaw ? C.alert : isPicked ? C.net : n.chip ? C.compute + "88" : C.line;
        return (
          <g key={n.id} onClick={() => !locked && onPick(n.id)} style={{ cursor: locked ? "default" : "pointer" }}>
            <rect x={n.x} y={n.y} width={NW} height={NH} rx={n.chip ? 14 : 8}
              fill={isFlaw ? C.alert + "22" : isPicked ? C.panelUp : C.panel}
              stroke={stroke} strokeWidth={isPicked || isFlaw ? 2 : 1.2}
              style={isFlaw ? { animation: "dr-pulse 1s infinite" } : {}} />
            <text x={n.x + NW / 2} y={n.y + (n.sub ? 20 : 27)} fill={isFlaw ? C.alert : C.text} fontSize="11.5" fontWeight="600" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif">{n.label}</text>
            {n.sub && <text x={n.x + NW / 2} y={n.y + 35} fill={C.faint} fontSize="8.5" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">{n.sub}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function Bars({ bars }) {
  return (
    <div>
      {bars.map((b) => {
        const col = b.u >= 1 ? C.alert : b.u >= 0.8 ? C.compute : b.col || C.net;
        return (
          <div key={b.label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span>{b.label}</span>
              <span className="dr-mono" style={{ color: col, fontWeight: 600 }}>{b.txt || `${Math.round(b.u * 100)}%`}</span>
            </div>
            <div style={{ height: 11, background: C.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", width: `${Math.min(b.u, 1) * 100}%`, background: `linear-gradient(90deg, ${col}55, ${col})`, transition: "width .5s" }} />
              <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: 1, background: C.faint }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   01 — FIND THE FLAW
   ============================================================ */
const PUZZLES = [
  {
    id: "sawtooth",
    title: "The Sawtooth Scheduler",
    reqs: "Job scheduler · 10k jobs/sec · NFR: execute within 2s of scheduled time",
    brief: "A teammate proposes this: jobs land in DynamoDB; a Watcher wakes every 5 minutes, queries everything due, and pushes it all to SQS for workers. It demos beautifully. One piece of this design cannot survive the requirements — click your suspect.",
    nodes: [
      { id: "api", x: 10, y: 100, label: "API Gateway" },
      { id: "svc", x: 160, y: 100, label: "Jobs Service" },
      { id: "db", x: 310, y: 30, label: "DynamoDB", sub: "jobs table" },
      { id: "watch", x: 310, y: 170, label: "Watcher", sub: "polls every 5 min" },
      { id: "sqs", x: 470, y: 170, label: "SQS" },
      { id: "work", x: 470, y: 30, label: "Workers ×N" },
    ],
    edges: [
      { a: "api", b: "svc" }, { a: "svc", b: "db", label: "write job" },
      { a: "watch", b: "db", label: "query due jobs" }, { a: "watch", b: "sqs", label: "enqueue all" },
      { a: "sqs", b: "work" }, { a: "work", b: "db", label: "update status" },
    ],
    flaw: "watch",
    frames: [
      { cap: "12:00:00 — the Watcher wakes and queries every job due in the window…", bars: [{ label: "DynamoDB reads", u: 0.2, col: C.storage }, { label: "SQS enqueue", u: 0.1, col: C.net }, { label: "Job scheduled 12:00:31", u: 0, txt: "waiting", col: C.mem }] },
      { cap: "10k jobs/sec × 300s = THREE MILLION rows in one query burst.", bars: [{ label: "DynamoDB reads", u: 1.35, col: C.storage }, { label: "SQS enqueue", u: 0.95, col: C.net }, { label: "Job scheduled 12:00:31", u: 0, txt: "waiting", col: C.mem }] },
      { cap: "12:00:31 — a job's scheduled moment arrives. The Watcher is asleep for 4½ more minutes.", bars: [{ label: "DynamoDB reads", u: 0.05, col: C.storage }, { label: "SQS enqueue", u: 0.05, col: C.net }, { label: "Job scheduled 12:00:31", u: 0.3, txt: "0:00 late…", col: C.compute }] },
      { cap: "12:05:00 — finally picked up. Executed 4 minutes 29 seconds late. The SLA said two SECONDS.", bars: [{ label: "DynamoDB reads", u: 1.35, col: C.storage }, { label: "SQS enqueue", u: 0.95, col: C.net }, { label: "Job scheduled 12:00:31", u: 1, txt: "4:29 LATE", col: C.alert }] },
    ],
    explain: "The polling cadence is caught in an impossible squeeze: poll rarely → jobs run minutes late and each poll is a 3M-row avalanche; poll every 2 seconds → you hammer the database with huge scans all day. No polling frequency satisfies both the 2-second SLA and sane DB load.",
    fix: "Break the tension by separating DISCOVERY from PRECISION: the Watcher polls ahead (every 5 min, fetch jobs due in the NEXT window) and enqueues them to SQS with per-job delayed delivery — the queue releases each message at its exact second. Jobs created inside the window skip the Watcher and go straight to the queue. DB is scanned once per window; precision is the queue's job.",
    line: "\u201CPolling frequency is a tradeoff between staleness and load — I'd rather move the precision requirement into the queue via delayed delivery than tighten the poll.\u201D",
  },
  {
    id: "hothour",
    title: "The Hot Hour",
    reqs: "Executions table · 10k writes/sec · partitioned key-value store (DynamoDB)",
    brief: "The executions table uses time_bucket (the current hour, e.g. \u201C2026-07-03T11\u201D) as its partition key — \u201Cso the Watcher can query one bucket per window, super efficient!\u201D Writes are timing out in production. Click the suspect.",
    nodes: [
      { id: "svc", x: 10, y: 100, label: "Jobs Service" },
      { id: "pk", x: 175, y: 100, label: "Partition key", sub: "time_bucket (hour)", chip: true },
      { id: "p1", x: 360, y: 12, label: "Partition A", sub: "hour 09" },
      { id: "p2", x: 360, y: 100, label: "Partition B", sub: "hour 10 (now)" },
      { id: "p3", x: 360, y: 188, label: "Partition C", sub: "hour 11" },
      { id: "work", x: 520, y: 100, label: "Workers" },
    ],
    edges: [
      { a: "svc", b: "pk", label: "10k writes/s" }, { a: "pk", b: "p1" }, { a: "pk", b: "p2" }, { a: "pk", b: "p3" },
      { a: "work", b: "p2", label: "status updates" },
    ],
    flaw: "pk",
    frames: [
      { cap: "It's 10:14. Every single write this hour computes the same partition key: \u201Chour 10\u201D.", bars: [{ label: "Partition A (hour 09)", u: 0.02, col: C.storage }, { label: "Partition B (hour 10)", u: 0.6, col: C.storage }, { label: "Partition C (hour 11)", u: 0.0, col: C.storage }] },
      { cap: "Dynamo scales by spreading KEYS across partitions. But right now there is only ONE key.", bars: [{ label: "Partition A (hour 09)", u: 0.02, col: C.storage }, { label: "Partition B (hour 10)", u: 1.1, col: C.storage }, { label: "Partition C (hour 11)", u: 0.0, col: C.storage }] },
      { cap: "One partition sustains ~1k writes/sec. 10k/sec are arriving. Nine of ten writes are throttled.", bars: [{ label: "Partition A (hour 09)", u: 0.02, col: C.storage }, { label: "Partition B (hour 10)", u: 3.0, txt: "THROTTLING", col: C.alert }, { label: "Partition C (hour 11)", u: 0.0, col: C.storage }] },
      { cap: "At 11:00 the pain doesn't end — it just moves to Partition C. A hot partition on wheels.", bars: [{ label: "Partition A (hour 09)", u: 0.02, col: C.storage }, { label: "Partition B (hour 10)", u: 0.05, col: C.storage }, { label: "Partition C (hour 11)", u: 3.0, txt: "THROTTLING", col: C.alert }] },
    ],
    explain: "A partitioned store's whole superpower is spreading load across keys — and this schema funnels 100% of current writes into one key. Any key derived from \u201Cnow\u201D (hour buckets, today's date) or from popularity (a viral post's ID) creates the same rolling hot spot. The cluster is huge and 97% of it is idle.",
    fix: "Salt the key: time_bucket#shard_N with N random in 0..9 spreads the hour across 10 partitions (exactly the fix on your whiteboard). Readers query all suffixes for the bucket and merge — a small, bounded read cost buying 10× write headroom. Alternative: partition by job_id and use a GSI on (time_bucket, next_execution_time) for the Watcher's query.",
    line: "\u201CBefore I commit a partition key I ask: will many concurrent writers compute the SAME value? Timestamps and 'today' are the classic trap — I'd salt with a suffix and fan-in on read.\u201D",
  },
  {
    id: "vanish",
    title: "The Vanishing Job",
    reqs: "NFR: every job runs AT LEAST once · workers are ordinary machines (they crash)",
    brief: "Worker logic: (1) receive message from SQS, (2) delete the message — \u201Cso no one else grabs it\u201D, (3) execute the job, (4) write COMPLETED to the DB. Tidy. Occasionally a job silently never happens. Click the suspect.",
    nodes: [
      { id: "sqs", x: 10, y: 100, label: "SQS" },
      { id: "ack", x: 175, y: 100, label: "Ack policy", sub: "delete on receive", chip: true },
      { id: "wa", x: 350, y: 30, label: "Worker A" },
      { id: "wb", x: 350, y: 170, label: "Worker B" },
      { id: "db", x: 520, y: 100, label: "DynamoDB", sub: "status" },
    ],
    edges: [
      { a: "sqs", b: "ack" }, { a: "ack", b: "wa", label: "job #4411" }, { a: "ack", b: "wb" },
      { a: "wa", b: "db", label: "COMPLETED" }, { a: "wb", b: "db" },
    ],
    flaw: "ack",
    frames: [
      { cap: "Worker A receives job #4411 and immediately deletes the message. The queue forgets it existed.", bars: [{ label: "Job #4411 in queue", u: 0, txt: "DELETED", col: C.net }, { label: "Worker A", u: 0.5, txt: "executing…", col: C.compute }, { label: "Status in DB", u: 0.3, txt: "IN_PROGRESS", col: C.mem }] },
      { cap: "Mid-execution, Worker A's instance dies. Hardware does that. It's Tuesday.", bars: [{ label: "Job #4411 in queue", u: 0, txt: "DELETED", col: C.net }, { label: "Worker A", u: 1, txt: "💀 CRASHED", col: C.alert }, { label: "Status in DB", u: 0.3, txt: "IN_PROGRESS", col: C.mem }] },
      { cap: "Job #4411 now exists NOWHERE. Not in the queue, not on a worker, not done.", bars: [{ label: "Job #4411 in queue", u: 0, txt: "gone", col: C.net }, { label: "Worker B", u: 0.05, txt: "sees nothing to do", col: C.compute }, { label: "Status in DB", u: 0.3, txt: "IN_PROGRESS forever", col: C.alert }] },
      { cap: "\u201CAt least once\u201D just became \u201Cmaybe zero times.\u201D The deletion was the moment of no return.", bars: [{ label: "Job #4411 in queue", u: 0, txt: "gone", col: C.net }, { label: "Worker B", u: 0.05, txt: "idle", col: C.compute }, { label: "Status in DB", u: 1, txt: "LOST", col: C.alert }] },
    ],
    explain: "Deleting on receive hands the job's ONLY copy to a machine that's allowed to die. The guarantee you're paid for — at-least-once — lives or dies on when you acknowledge. Ack-before-work means crashes lose work; that's at-MOST-once.",
    fix: "Use the queue's visibility timeout (your whiteboard's orange note, exactly): receiving a message hides it instead of deleting it; the worker deletes it only AFTER writing COMPLETED. If the worker crashes, the timeout expires and the message reappears for Worker B. Crash insurance, built into the queue.",
    line: "\u201CI ack only after the side effect is durable. The visibility timeout means a dead worker's jobs automatically return to the pool — the queue is my crash recovery.\u201D",
  },
  {
    id: "double",
    title: "The Double Send",
    reqs: "Jobs have real side effects (send email, charge card) · retries with exponential backoff on failure",
    brief: "Failure handling looks solid: on timeout or error, re-enqueue with exponential backoff, mark RETRYING, cap attempts. Customers start reporting duplicate emails — and one duplicate charge. Click the suspect.",
    nodes: [
      { id: "sqs", x: 10, y: 100, label: "SQS" },
      { id: "work", x: 165, y: 100, label: "Worker" },
      { id: "retry", x: 165, y: 12, label: "Retry policy", sub: "exp backoff ×3", chip: true },
      { id: "eff", x: 340, y: 100, label: "Email API", sub: "the side effect", chip: false },
      { id: "idem", x: 340, y: 188, label: "Request identity", sub: "none — each retry is new", chip: true },
      { id: "db", x: 515, y: 100, label: "DB status" },
    ],
    edges: [
      { a: "sqs", b: "work" }, { a: "retry", b: "work" }, { a: "work", b: "eff", label: "send" },
      { a: "eff", b: "idem" }, { a: "work", b: "db" },
    ],
    flaw: "idem",
    frames: [
      { cap: "Worker sends the email. The email GOES OUT… but the response times out on the way back.", bars: [{ label: "Email actually sent", u: 1, txt: "1 sent ✓", col: C.mem }, { label: "Worker's view", u: 0.5, txt: "timeout — failed?", col: C.compute }, { label: "Customer inbox", u: 0.2, txt: "1 email", col: C.net }] },
      { cap: "The worker can't distinguish \u201Cfailed\u201D from \u201Csucceeded, reply lost.\u201D It does the safe-looking thing: retry.", bars: [{ label: "Email actually sent", u: 1, txt: "2 sent", col: C.compute }, { label: "Worker's view", u: 0.5, txt: "retrying…", col: C.compute }, { label: "Customer inbox", u: 0.5, txt: "2 emails", col: C.compute }] },
      { cap: "Backoff, retry, backoff, retry. Each attempt is a brand-new request with no identity.", bars: [{ label: "Email actually sent", u: 1, txt: "4 sent", col: C.alert }, { label: "Worker's view", u: 0.5, txt: "still 'failing'", col: C.compute }, { label: "Customer inbox", u: 1, txt: "4 emails 😡", col: C.alert }] },
      { cap: "The retry policy isn't the bug — retries are correct! The bug: nothing lets the API say \u201Cseen this one already.\u201D", bars: [{ label: "Email actually sent", u: 1, txt: "4 sent", col: C.alert }, { label: "Worker's view", u: 0.5, txt: "gives up", col: C.compute }, { label: "Customer inbox", u: 1, txt: "4 emails", col: C.alert }] },
    ],
    explain: "At-least-once delivery GUARANTEES occasional duplicates — that's the 'at least'. Retries are the immune system of distributed systems; they're only safe when operations are idempotent. The missing piece isn't fewer retries, it's giving each logical operation a stable identity.",
    fix: "Attach an idempotency key (the job_execution_id you already have!) to every side-effecting call; the receiving API stores processed keys and turns duplicates into no-ops. Same pattern behind Stripe's idempotency keys and exactly-once-looking payment flows.",
    line: "\u201CAt-least-once plus non-idempotent side effects equals duplicates — so I make every side effect idempotent with an operation ID, and then retries become free.\u201D",
  },
];

function FindTheFlaw({ onScore }) {
  const [pi, setPi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState("inspect"); // inspect | reveal | done
  const [fi, setFi] = useState(0);
  const p = PUZZLES[pi];
  const correct = picked === p.flaw;

  useEffect(() => {
    if (phase !== "reveal") return;
    if (fi >= p.frames.length - 1) { const t = setTimeout(() => setPhase("done"), 1400); return () => clearTimeout(t); }
    const t = setTimeout(() => setFi(fi + 1), 1700);
    return () => clearTimeout(t);
  }, [phase, fi]);

  const lockIn = () => { setFi(0); setPhase("reveal"); onScore(correct ? 100 : 0); };
  const next = () => { setPi((pi + 1) % PUZZLES.length); setPicked(null); setPhase("inspect"); setFi(0); };
  const frame = p.frames[Math.min(fi, p.frames.length - 1)];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{p.title}</span>
        <span className="dr-mono" style={{ fontSize: 11, color: C.dim }}>puzzle {pi + 1}/{PUZZLES.length}</span>
      </div>
      <div className="dr-mono" style={{ fontSize: 11.5, color: C.compute, margin: "4px 0 8px" }}>{p.reqs}</div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, marginBottom: 12 }}>{p.brief}</p>

      <Diagram nodes={p.nodes} edges={p.edges} picked={picked} onPick={setPicked} flaw={p.flaw} revealed={phase === "done"} locked={phase !== "inspect"} />

      {phase === "inspect" && (
        <button onClick={lockIn} disabled={!picked}
          style={{ marginTop: 14, padding: "11px 24px", background: picked ? C.alert : C.line, color: picked ? "#fff" : C.faint, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: picked ? "pointer" : "default", fontFamily: "inherit" }}>
          {picked ? "Lock in suspicion — run the traffic" : "Click a component to accuse it"}
        </button>
      )}

      {(phase === "reveal" || phase === "done") && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
          <div className="dr-mono" style={{ fontSize: 12.5, color: C.compute, minHeight: 36, lineHeight: 1.5, marginBottom: 12 }}>▸ {frame.cap}</div>
          <Bars bars={frame.bars} />
        </div>
      )}

      {phase === "done" && (
        <div style={{ marginTop: 14 }}>
          <div className="dr-mono" style={{ fontSize: 15, fontWeight: 700, color: correct ? C.ok : C.alert }}>
            {correct ? "✓ CORRECT — you smelled it before the traffic did" : `✗ You accused "${p.nodes.find((n) => n.id === picked)?.label}" — the real flaw was "${p.nodes.find((n) => n.id === p.flaw)?.label}"`}
          </div>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
            <div>{p.explain}</div>
            <div style={{ marginTop: 10 }}><span className="dr-mono" style={{ color: C.mem, fontSize: 10.5, letterSpacing: 1.5 }}>THE FIX · </span>{p.fix}</div>
            <div style={{ marginTop: 10, borderLeft: `3px solid ${C.net}`, paddingLeft: 12, color: C.dim, fontStyle: "italic" }}>
              <span className="dr-mono" style={{ color: C.net, fontSize: 10.5, letterSpacing: 1.5, fontStyle: "normal" }}>SAY IT IN THE INTERVIEW · </span>{p.line}
            </div>
          </div>
          <button onClick={next} style={{ marginTop: 12, padding: "10px 22px", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Next puzzle →
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   02 — PREDICT & RUN
   ============================================================ */
const ROUNDS = [
  {
    name: "Round 1 · Read-heavy launch",
    stack: "3 app servers (10k rps ea) · 2 cache nodes @ 85% hit · 1 DB primary (10k w/s) · 2 read replicas (20k r/s ea)",
    traffic: "ramps to 45k req/s · 90% reads / 10% writes",
    peak: 45000, readPct: 0.9, app: 3, cacheHit: 0.85, replicas: 2, shards: 1,
    q1: { prompt: "Which tier crosses the 80% danger line FIRST as traffic ramps?", opts: ["App servers", "Cache", "Read replicas", "DB primary (writes)"], ans: 0 },
    q2: { prompt: "At roughly what req/s do ERRORS begin?", lo: 10000, hi: 60000, ans: 30000 },
    lesson: "Most people accuse the database — it feels like the fragile one. But do the per-tier arithmetic: replicas see only the 15% cache misses (≈6k r/s at peak vs 40k capacity — loafing), the primary sees 4.5k writes vs 10k. The app tier hits its 30k ceiling first. Bottlenecks live where the MATH says, not where the fear says.",
  },
  {
    name: "Round 2 · The mix flips",
    stack: "Same stack: 3 app · 2 cache @85% · 1 primary · 2 replicas",
    traffic: "a bulk-import feature ships — ramps to 35k req/s · 60% reads / 40% writes",
    peak: 35000, readPct: 0.6, app: 3, cacheHit: 0.85, replicas: 2, shards: 1,
    q1: { prompt: "Same stack, new mix. Which tier crosses 80% FIRST now?", opts: ["App servers", "Cache", "Read replicas", "DB primary (writes)"], ans: 3 },
    q2: { prompt: "At roughly what req/s do ERRORS begin?", lo: 10000, hi: 60000, ans: 25000 },
    lesson: "Identical hardware, different answer: 40% writes means the primary's 10k w/s ceiling is hit at just 25k total rps — before the app tier's 30k. This is why the read/write mix is the FIRST question you ask in any interview: it decides which wall you hit and therefore which architecture you need. Caches were useless here; they only ever help reads.",
  },
];

function sliderVal(pos, lo, hi) { return Math.round((lo + (pos / 1000) * (hi - lo)) / 500) * 500; }

function PredictRun({ onScore }) {
  const [ri, setRi] = useState(0);
  const [q1, setQ1] = useState(null);
  const [pos, setPos] = useState(500);
  const [phase, setPhase] = useState("predict"); // predict | run | done
  const [t, setT] = useState(0);
  const r = ROUNDS[ri];
  const guess = sliderVal(pos, r.q2.lo, r.q2.hi);
  const TICKS = 22;

  const calc = (rps) => {
    const reads = rps * r.readPct, writes = rps * (1 - r.readPct);
    const misses = reads * (1 - r.cacheHit);
    return [
      { label: "App servers", u: rps / (r.app * 10000), col: C.compute },
      { label: "Cache", u: reads / 200000, col: C.mem },
      { label: "Read replicas", u: misses / (r.replicas * 20000), col: C.storage },
      { label: "DB primary (writes)", u: writes / (r.shards * 10000), col: C.storage },
    ];
  };

  useEffect(() => {
    if (phase !== "run") return;
    if (t > TICKS) { setPhase("done"); return; }
    const id = setTimeout(() => setT(t + 1), 170);
    return () => clearTimeout(id);
  }, [phase, t]);

  const rpsNow = r.peak * Math.min(1, t / (TICKS - 4));
  const bars = calc(rpsNow);
  const firstIdx = (() => { const at80 = calc(r.peak).map((b, i) => ({ i, at: 0.8 / (calc(1)[i].u || 1e-9) })); return at80.sort((a, b) => a.at - b.at)[0].i; })();
  const q1Right = q1 === r.q1.ans;
  const errLog = Math.abs(Math.log10(guess) - Math.log10(r.q2.ans));
  const q2Pts = errLog <= 0.08 ? 100 : errLog <= 0.2 ? 60 : 0;

  const lock = () => { setT(0); setPhase("run"); onScore((q1Right ? 100 : 0) + q2Pts); };
  const next = () => { setRi((ri + 1) % ROUNDS.length); setQ1(null); setPos(500); setPhase("predict"); setT(0); };

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55 }}>
        Watching a simulation teaches a little. <b style={{ color: C.text }}>Forecasting one, then being wrong in public,</b> teaches a lot —
        it's also literally what an interviewer asks: \u201Cwhere does this break first?\u201D Commit before you see anything.
      </p>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</div>
        <div className="dr-mono" style={{ fontSize: 11.5, color: C.dim, marginTop: 6, lineHeight: 1.6 }}>STACK · {r.stack}<br />TRAFFIC · {r.traffic}</div>

        {phase === "predict" && (
          <>
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600 }}>{r.q1.prompt}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {r.q1.opts.map((o, i) => (
                <button key={o} onClick={() => setQ1(i)}
                  style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, background: q1 === i ? C.net : C.bg, color: q1 === i ? C.bg : C.dim, border: `1px solid ${q1 === i ? C.net : C.line}`, fontWeight: 600 }}>
                  {o}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 14, fontWeight: 600 }}>{r.q2.prompt}</div>
            <div className="dr-mono" style={{ textAlign: "center", fontSize: 24, fontWeight: 600, color: C.net, margin: "6px 0" }}>{fmt(guess)} <span style={{ fontSize: 13, color: C.dim }}>req/s</span></div>
            <input type="range" min={0} max={1000} value={pos} onChange={(e) => setPos(+e.target.value)} />
            <button onClick={lock} disabled={q1 === null}
              style={{ marginTop: 16, width: "100%", padding: "12px 0", background: q1 !== null ? C.alert : C.line, color: q1 !== null ? "#fff" : C.faint, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: q1 !== null ? "pointer" : "default", fontFamily: "inherit" }}>
              Commit predictions — run it
            </button>
          </>
        )}

        {(phase === "run" || phase === "done") && (
          <div style={{ marginTop: 16 }}>
            <div className="dr-mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 10 }}>traffic: <b style={{ color: C.text }}>{fmt(rpsNow)}/s</b></div>
            <Bars bars={bars} />
          </div>
        )}

        {phase === "done" && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            <div className="dr-mono" style={{ fontSize: 13, marginBottom: 4, color: q1Right ? C.ok : C.alert }}>
              {q1Right ? "✓" : "✗"} First past 80%: <b>{r.q1.opts[firstIdx]}</b> {q1Right ? "— you called it" : `(you said ${r.q1.opts[q1]})`}
            </div>
            <div className="dr-mono" style={{ fontSize: 13, marginBottom: 10, color: q2Pts >= 60 ? C.ok : C.alert }}>
              {q2Pts >= 60 ? "✓" : "✗"} Errors begin ≈ <b>{fmt(r.q2.ans)}/s</b> — you predicted {fmt(guess)}/s {q2Pts === 100 ? "(dead on)" : q2Pts === 60 ? "(close)" : ""}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px" }}>{r.lesson}</div>
            <button onClick={next} style={{ marginTop: 12, padding: "10px 22px", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {ri === ROUNDS.length - 1 ? "Round 1 again (beat your score)" : "Next round →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   03 — TASTE TEST
   ============================================================ */
const TASTES = [
  {
    prompt: "Distributed job scheduler. NFRs: 10k jobs/sec created · every job executes within 2s of its scheduled time.",
    a: { name: "Design A — Two-phase + delayed delivery", desc: "Watcher polls once per 5-min window for jobs due in the NEXT window; enqueues each to SQS with per-job delayed delivery (the queue releases it at its exact second). Jobs created inside the window bypass the Watcher, straight to the queue." },
    b: { name: "Design B — Tight polling loop", desc: "A scheduler service polls the jobs table every 2 seconds for anything due right now and dispatches immediately to workers. Simple, one moving part, obviously meets the 2s SLA." },
    ans: "a",
    whys: [
      { t: "Polling is an anti-pattern; event-driven is always better.", ok: false, why: "Absolutist. Design A polls too! Polling is fine — the question is what each poll costs and what precision it must deliver." },
      { t: "A scans the DB once per window and delegates precision to the queue's delay feature; B must scan a 10k-jobs/sec table every 2 seconds forever — enormous repeated reads to meet the same SLA.", ok: true, why: "This is the actual mechanism: separate discovery (cheap, infrequent) from precision (the queue's delayed delivery). Same SLA, ~1% of the DB load." },
      { t: "A is better because SQS is managed and serverless.", ok: false, why: "Vendor-brained. A self-hosted queue with delayed delivery (RabbitMQ, Redis sorted sets) gives the same architectural win. The idea, not the logo, is the answer." },
      { t: "B is better: simplest thing that meets the requirement.", ok: false, why: "Simplicity is a genuine virtue and B WOULD win at small scale — a startup's cron table should absolutely be a 2s polling loop. At 10k jobs/sec the polling cost breaks it. Taste = fit to the numbers, and the numbers here say no." },
    ],
    flip: "When does B win? At 50 jobs/minute. A polling loop on Postgres is bulletproof, debuggable, and done by lunch. Reaching for Design A at that scale is resume-driven engineering — ALSO a taste failure. The design isn't good or bad; the (design, requirements) PAIR is.",
  },
  {
    prompt: "Storage for the scheduler's executions. NFRs: massive scale · availability ≫ consistency · pure key-value access (write status, read by id/time-bucket).",
    a: { name: "Design A — PostgreSQL primary + replicas", desc: "One Postgres primary for writes, read replicas for queries. Rich SQL, transactions, joins, the ecosystem everyone knows." },
    b: { name: "Design B — DynamoDB / Cassandra", desc: "Partitioned key-value store: writes scale horizontally with partitions, tunable/eventual consistency, multi-node availability by default." },
    ans: "b",
    whys: [
      { t: "Postgres can't handle scale; NoSQL is what serious companies use.", ok: false, why: "Absolutist and false — Postgres serves enormous companies. The reasoning has to come from THIS system's requirements, not vibes about seriousness." },
      { t: "The requirements literally describe a partitioned KV store: no joins or cross-row transactions needed, availability explicitly beats consistency, uniform access by key. Postgres's superpowers (transactions, rich queries) would be UNUSED while its single-primary write ceiling is exactly the wall this workload hits.", ok: true, why: "The taste move: list what each tool is great at, check which strengths this workload actually exercises. Paying Postgres's constraints while using none of its powers is a bad trade." },
      { t: "B is better because eventual consistency is faster.", ok: false, why: "Half-true but not the reason — plenty of eventually-consistent systems are slow, and speed wasn't the stated requirement. Availability-over-consistency was, which is a CAP posture, not a speed claim." },
      { t: "A is better because SQL makes the status queries easier to write.", ok: false, why: "True and irrelevant at this scale: the access pattern shown is get/put by key. Developer convenience is a real factor — it just loses to a hard scaling wall in THIS spec." },
    ],
    flip: "When does A win? The moment requirements say 'exactly-once billing' or 'complex reporting across users' — transactions and joins earn their constraints. Also at modest scale, where one Postgres box outruns your whole company. Never say 'X is better than Y' in an interview; say 'X is better HERE, because these requirements exercise X's strengths.'",
  },
];

function TasteTest({ onScore }) {
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState(null);
  const [why, setWhy] = useState(null);
  const [done, setDone] = useState(false);
  const q = TASTES[qi];

  const submit = () => { setDone(true); onScore((pick === q.ans ? 50 : 0) + (q.whys[why].ok ? 50 : 0)); };
  const next = () => { setQi((qi + 1) % TASTES.length); setPick(null); setWhy(null); setDone(false); };

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55 }}>
        Two defensible designs, one set of requirements. Picking the right one is worth half; picking the right <b style={{ color: C.text }}>reason</b> is
        worth the other half — because \u201Ccorrect answer, wrong reason\u201D is the most dangerous state in engineering: it works until it catastrophically doesn't.
      </p>
      <div className="dr-mono" style={{ fontSize: 12, color: C.compute, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", margin: "12px 0" }}>
        {q.prompt}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {["a", "b"].map((k) => (
          <button key={k} onClick={() => !done && setPick(k)}
            style={{ textAlign: "left", background: pick === k ? C.panelUp : C.panel, border: `1.5px solid ${done && q.ans === k ? C.ok : pick === k ? C.net : C.line}`, borderRadius: 10, padding: 14, cursor: done ? "default" : "pointer", fontFamily: "inherit", color: C.text }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: pick === k ? C.net : C.text }}>{q[k].name}</div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, marginTop: 6 }}>{q[k].desc}</div>
          </button>
        ))}
      </div>
      {pick && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Why? Choose the strongest justification:</div>
          {q.whys.map((w, i) => (
            <button key={i} onClick={() => !done && setWhy(i)}
              style={{ display: "block", width: "100%", textAlign: "left", background: why === i ? C.panelUp : C.panel, border: `1px solid ${done ? (w.ok ? C.ok : why === i ? C.alert : C.line) : why === i ? C.net : C.line}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, cursor: done ? "default" : "pointer", fontFamily: "inherit", color: C.text, fontSize: 13, lineHeight: 1.5 }}>
              {w.t}
              {done && (why === i || w.ok) && <div style={{ marginTop: 6, fontSize: 12.5, color: w.ok ? C.ok : C.alert }}>{w.why}</div>}
            </button>
          ))}
          {!done ? (
            <button onClick={submit} disabled={why === null}
              style={{ marginTop: 6, padding: "11px 24px", background: why !== null ? C.alert : C.line, color: why !== null ? "#fff" : C.faint, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: why !== null ? "pointer" : "default", fontFamily: "inherit" }}>
              Defend it
            </button>
          ) : (
            <>
              <div style={{ background: C.bg, border: `1px solid ${C.net}44`, borderRadius: 8, padding: "12px 14px", marginTop: 8, fontSize: 13.5, lineHeight: 1.6 }}>
                <span className="dr-mono" style={{ color: C.net, fontSize: 10.5, letterSpacing: 1.5 }}>THE TABLES TURN · </span>{q.flip}
              </div>
              <button onClick={next} style={{ marginTop: 12, padding: "10px 22px", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                Next matchup →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SHELL
   ============================================================ */
export default function DesignReview() {
  const [mode, setMode] = useState("flaw");
  const [score, setScore] = useState(0);
  const add = (n) => setScore((s) => s + n);
  const tabs = [
    { id: "flaw", label: "01 · FIND THE FLAW", sub: "smell the bug before traffic does" },
    { id: "predict", label: "02 · PREDICT & RUN", sub: "commit, then face the sim" },
    { id: "taste", label: "03 · TASTE TEST", sub: "right answer, right reason" },
  ];
  return (
    <div className="dr-root" style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <style>{FONT_CSS}</style>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "18px 20px 0" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>DESIGN REVIEW</h1>
            <span className="dr-mono" style={{ fontSize: 11.5, color: C.faint }}>the judgment gym · score {score}</span>
          </div>
          <nav style={{ display: "flex", gap: 2, marginTop: 14, flexWrap: "wrap" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setMode(t.id)}
                style={{ padding: "10px 14px 12px", background: "transparent", border: "none", borderBottom: `2px solid ${mode === t.id ? C.net : "transparent"}`, color: mode === t.id ? C.text : C.dim, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, textAlign: "left" }}>
                <div style={{ fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{t.sub}</div>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ padding: "22px 20px 60px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {mode === "flaw" && <FindTheFlaw onScore={add} />}
          {mode === "predict" && <PredictRun onScore={add} />}
          {mode === "taste" && <TasteTest onScore={add} />}
        </div>
      </main>
    </div>
  );
}
