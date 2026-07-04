import React, { useState, useEffect, useRef, createContext, useContext } from "react";

/* ============================================================
   GROUNDED — BUILDER v0.3
   Now a learning tool first, a test second.
   - FIELD MANUAL: plain-language concepts with visuals
   - BRIEFINGS: every scenario story translated into numbers,
     step by step, before you build
   - GLOSSARY: every dotted term is clickable, everywhere
   ============================================================ */

const C = {
  bg: "#0F1930", panel: "#152238", panelUp: "#1B2C48", line: "#283A5C",
  text: "#E9EEF8", dim: "#8FA0C0", faint: "#5B6C8F",
  net: "#53DCEC", compute: "#F6BB52", storage: "#EF7BD0", mem: "#72EAA8",
  alert: "#F26D5E", ok: "#72EAA8",
};

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.gr-root { font-family: 'Space Grotesk', sans-serif; }
.gr-mono { font-family: 'IBM Plex Mono', monospace; }
.gr-root input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
.gr-root input[type=range]::-webkit-slider-runnable-track { height: 4px; background: #283A5C; border-radius: 2px; }
.gr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 22px; width: 10px; border-radius: 3px; background: #53DCEC; margin-top: -9px; cursor: pointer; }
.gr-root input[type=range]::-moz-range-track { height: 4px; background: #283A5C; border-radius: 2px; }
.gr-root input[type=range]::-moz-range-thumb { height: 22px; width: 10px; border: none; border-radius: 3px; background: #53DCEC; cursor: pointer; }
@keyframes gr-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) { .gr-root * { animation: none !important; transition: none !important; } }
`;

const fmtNum = (n) => {
  if (n >= 1e6) return (n / 1e6).toPrecision(3) + "M";
  if (n >= 1e3) return (n / 1e3).toPrecision(3) + "k";
  return Math.round(n).toLocaleString();
};

/* ============================================================
   GLOSSARY — every dotted term, everywhere, is clickable
   ============================================================ */
const GLOSSARY = {
  request: ["Request", "One message from a client ('give me this page', 'save this comment') and the reply to it. Everything in systems design is counting requests, pricing what each one costs, and deciding which machine handles it."],
  read: ["Read", "A request that only LOOKS AT data ('show me the post'). Reads are the easy kind: the answer can be copied to many places (caches, replicas) and served from any of them, because looking doesn't change anything."],
  write: ["Write", "A request that CHANGES data ('save my comment', 'record this GPS ping'). Writes are the hard kind: they must survive a crash (hit disk, not just RAM), and every copy of the data must eventually agree about them. You can't cache your way out of writes."],
  rps: ["RPS / QPS / TPS", "Requests, Queries, or Transactions Per Second — the pulse rate of a system. Same idea, different organs: RPS at the web tier, QPS at the database, TPS when writes/transactions are what's counted."],
  iot: ["IoT device", "'Internet of Things' — a small physical gadget with a network connection: a GPS tracker in a truck, a smart thermostat, a factory sensor. No human behind it; it generates traffic on a timer, relentlessly, 24/7."],
  phonehome: ["Phones home", "The device initiates contact with YOUR servers on a schedule ('here's my location, again') — you never call it. So traffic volume = number of devices × how often each reports. Predictable, machine-like, and almost all writes: the device has data to deposit and nothing to ask."],
  burst: ["Burst / spike", "A short period where traffic jumps far above normal. Classic causes: everyone acts at once (sale opens at noon, all trucks start at 8am), or a 'thundering herd' — a network blip disconnects thousands of devices and they ALL reconnect and resend at the same moment."],
  cache: ["Cache", "A small, very fast memory (RAM) holding copies of recently-used answers, sitting in front of the database. If the answer is there (a 'hit'), you skip the database entirely — ~1ms instead of ~5–50ms, and 10× the capacity per dollar. Only helps reads."],
  hitrate: ["Hit rate", "The % of lookups the cache can answer itself. 80% hit rate = only 20% of reads reach the database. Driven by how often people ask for the SAME thing: a viral post → 99%+; random user profiles → much lower. This one percentage decides your database's fate."],
  replica: ["Read replica", "A live copy of the database that receives every write from the primary and serves reads. Scaling reads = photocopying the data. Each replica adds ~20k reads/s. The catch: copies lag slightly behind — a just-written comment might not appear on a replica for a moment."],
  shard: ["Shard", "Splitting data across multiple independent databases — users A–M on box 1, N–Z on box 2. It's the only way to scale WRITES (copies don't help; every copy must apply every write). Powerful and painful: queries crossing shards get hard, so it's the last resort, not the first."],
  queue: ["Queue", "A durable waiting line (Kafka, SQS) between 'accept the write' and 'process the write'. The app appends the message in ~1ms and answers 'got it!' — workers drain the line into the database at a pace the database can survive. Absorbs bursts by buying TIME instead of capacity."],
  worker: ["Worker", "A background process that pulls messages off the queue and does the real work (write to DB, resize the image). Not serving users directly, so it can run steadily at its own pace. More workers = faster drain."],
  backlog: ["Backlog / lag", "Messages waiting in the queue because they arrive faster than workers drain them. A backlog during a burst is the queue doing its job. A backlog that never shrinks means your STEADY rate exceeds drain capacity — the queue is just delaying the funeral."],
  p99: ["p99 latency", "The response time your 99th-slowest-of-100 users experiences. Averages lie — 99 fast requests hide 1 awful one. If p99 is 2 seconds, then 1 in every 100 clicks feels broken, and your heaviest users (who click most) hit it daily. Interviewers and SLAs live at p99."],
  sla: ["SLA", "Service Level Agreement — the promise you're held to: 'p99 under 200ms, 99.9% of requests succeed.' Your design isn't done when it works; it's done when it keeps the promise at peak, at acceptable cost."],
  durable: ["Durability (fsync)", "A write is durable when it's physically on disk and survives a power cut. Forcing bytes to disk (fsync) is slow compared to RAM — this is THE reason a database handles ~10k writes/s but ~10× more reads/s. Reads live in memory; writes must touch the truth."],
  lb: ["Load balancer", "The front-door traffic cop: takes every incoming request and spreads them across your app servers. Lets you have 6 interchangeable servers behind one address, so any one can die without anyone noticing. Adds ~1ms."],
  appserver: ["App server", "The machine running YOUR code: checks the login, validates input, asks cache/DB for data, builds the response. Stateless (remembers nothing between requests), which is why you can add more like lego bricks. ~10k simple requests/s each."],
  util: ["Utilization", "How busy a component is: load ÷ capacity. The trap: waiting time explodes near full — at 95% busy, queueing delay is ~10× worse than at 50%, because random arrivals clump and there's no slack to absorb a clump. Healthy systems cruise at 60–70%. (Play THE QUEUE toy in the Intuition Lab.)"],
  readpct: ["Read/write mix", "What fraction of traffic is reads vs writes. THE first question to ask about any system — it decides the whole architecture. Read-heavy (social feeds, blogs: 90%+ reads) → caches and replicas. Write-heavy (telemetry, logging, chat ingest) → queues and shards. Different problems, different tools."],
};

const GlossCtx = createContext(() => {});

function T({ k, children }) {
  const open = useContext(GlossCtx);
  return (
    <button onClick={(e) => { e.stopPropagation(); open(k); }}
      style={{ background: "none", border: "none", padding: 0, color: C.net, cursor: "pointer", font: "inherit", borderBottom: `1px dotted ${C.net}88` }}>
      {children}
    </button>
  );
}

function GlossaryDrawer({ termKey, onClose }) {
  if (!termKey) return null;
  const [name, def] = GLOSSARY[termKey];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, background: C.panelUp, borderTop: `2px solid ${C.net}`, padding: "14px 20px 18px", boxShadow: "0 -8px 30px #0009" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <span className="gr-mono" style={{ color: C.net, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{name.toUpperCase()}</span>
          <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>{def}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 6, color: C.dim, cursor: "pointer", padding: "4px 10px", fontSize: 13 }}>✕</button>
      </div>
    </div>
  );
}

/* ============================================================
   FIELD MANUAL — teach before testing
   ============================================================ */
function RequestFlow() {
  const stops = [
    { label: "phone", ms: "", col: C.dim },
    { label: "load balancer", ms: "~1 ms", col: C.net },
    { label: "app server", ms: "~3 ms", col: C.compute },
    { label: "cache", ms: "~1 ms", col: C.mem },
    { label: "database", ms: "~5 ms", col: C.storage },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", margin: "14px 0" }}>
      {stops.map((s, i) => (
        <React.Fragment key={s.label}>
          <div style={{ textAlign: "center" }}>
            <div style={{ padding: "10px 12px", background: C.bg, border: `1.5px solid ${s.col}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: s.col, whiteSpace: "nowrap" }}>{s.label}</div>
            <div className="gr-mono" style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>{s.ms}</div>
          </div>
          {i < stops.length - 1 && <span style={{ color: C.faint, fontSize: 16, margin: "0 2px", paddingBottom: 14 }}>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Spark({ d, col }) {
  return (
    <svg width="110" height="34" viewBox="0 0 110 34">
      <polyline points={d} fill="none" stroke={col} strokeWidth="2" />
      <line x1="0" y1="32" x2="110" y2="32" stroke={C.line} />
    </svg>
  );
}

const MANUAL = [
  {
    id: "request", title: "Anatomy of one request",
    body: (
      <>
        <p>When someone taps a button, a <T k="request">request</T> makes this trip — and the reply retraces it:</p>
        <RequestFlow />
        <p>
          Each stop exists for one reason. The <T k="lb">load balancer</T> spreads traffic so servers are interchangeable.
          The <T k="appserver">app server</T> runs your logic. The <T k="cache">cache</T> intercepts repeat questions so most{" "}
          <T k="read">reads</T> never reach the database. The database is the slowest stop and the only one holding truth —
          which is why the whole architecture is arranged to protect it.
        </p>
        <p style={{ color: C.dim }}>
          Total: ~5–10 ms when healthy. Systems don't fail by this number growing gently — they fail when one stop saturates
          and its line explodes (see <T k="util">utilization</T>).
        </p>
      </>
    ),
  },
  {
    id: "rw", title: "Reads vs writes — why they're priced differently",
    body: (
      <>
        <p>
          The first question to ask about ANY system: what's the <T k="readpct">read/write mix</T>?
        </p>
        <p>
          A <T k="read">read</T> just looks. Looking is cheap to scale because answers can be <i>copied</i> — into a{" "}
          <T k="cache">cache</T>, onto <T k="replica">replicas</T> — and served from anywhere.
        </p>
        <p>
          A <T k="write">write</T> changes the truth. It must be <T k="durable">durable</T> (on disk before you say "saved"),
          and every copy must learn about it. So copies don't help writes — each copy must do every write anyway. Your only
          write moves: split the data (<T k="shard">shard</T>) or buffer the burst (<T k="queue">queue</T>).
        </p>
        <div className="gr-mono" style={{ fontSize: 12.5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", marginTop: 6 }}>
          read-heavy → cache + replicas &nbsp;·&nbsp; write-heavy → queue + shards
        </div>
      </>
    ),
  },
  {
    id: "traffic", title: "Where the traffic numbers come from",
    body: (
      <>
        <p>Interviewers give you a story, not a number. The translation is always the same shape:</p>
        <div className="gr-mono" style={{ fontSize: 13, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", margin: "8px 0" }}>
          (how many actors) × (actions per actor per time) = requests per second
        </div>
        <p>
          Humans: 10M daily users × 50 taps/day ÷ 86,400s ≈ 5,800 <T k="rps">req/s</T> average (shortcut: 1M/day ≈ 12/s), then
          × 2–5 for peak hours. Machines (<T k="iot">IoT</T>): 60,000 devices <T k="phonehome">phoning home</T> every 8s = 7,500/s
          flat, day and night — no peak hours, but brutal <T k="burst">bursts</T> when they all act at once.
        </p>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 10 }}>
          <div><Spark col={C.mem} d="0,20 20,19 40,21 60,19 80,20 110,20" /><div className="gr-mono" style={{ fontSize: 10.5, color: C.faint }}>machine-steady (IoT)</div></div>
          <div><Spark col={C.net} d="0,28 15,26 30,18 45,8 60,10 75,18 95,26 110,28" /><div className="gr-mono" style={{ fontSize: 10.5, color: C.faint }}>human-diurnal (apps)</div></div>
          <div><Spark col={C.alert} d="0,26 30,25 45,24 50,4 62,5 68,24 90,25 110,26" /><div className="gr-mono" style={{ fontSize: 10.5, color: C.faint }}>burst (launch, herd)</div></div>
        </div>
        <p style={{ color: C.dim, marginTop: 10 }}>Design for the peak, pay for the average — that tension is what queues and autoscaling are for.</p>
      </>
    ),
  },
  {
    id: "parts", title: "The parts bin",
    body: (
      <>
        {[
          { n: "Load balancer", k: "lb", ch: C.net, when: "Always — it's the front door.", price: "Basically free; one more ms." },
          { n: "App server", k: "appserver", ch: C.compute, when: "Add one per ~10k req/s of traffic.", price: "$150/mo each. Stateless, so adding more is painless." },
          { n: "Cache", k: "cache", ch: C.mem, when: "Reads repeat (hot posts, sessions, seat maps).", price: "$200/node. Risk: stale data, and a cold cache after restart stampedes the DB." },
          { n: "Read replica", k: "replica", ch: C.storage, when: "Read volume outgrows one DB and misses aren't cacheable.", price: "$400 each. Risk: replication lag — read-your-own-write surprises." },
          { n: "Shard", k: "shard", ch: C.storage, when: "WRITES outgrow one primary — the only real cure.", price: "$600 each, plus permanent complexity: cross-shard queries hurt forever." },
          { n: "Queue + workers", k: "queue", ch: C.net, when: "Writes are bursty AND a short delay is acceptable.", price: "$300 + $100/worker. Risk: it buys time, not capacity — steady overload just grows the backlog." },
        ].map((p) => (
          <div key={p.n} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ color: p.ch, fontWeight: 600, fontSize: 13.5 }}><T k={p.k}>{p.n}</T></div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: C.text }}>{p.when}</span>{" "}
              <span style={{ color: C.dim }}>{p.price}</span>
            </div>
          </div>
        ))}
      </>
    ),
  },
  {
    id: "judge", title: "How you're judged (and why)",
    body: (
      <>
        <p>
          <b><T k="p99">p99 latency</T></b> — not the average. 99 quick requests hide one 3-second disaster; averages forgive it,
          users don't. <b>Error rate</b> — a request dropped at a saturated component is a user seeing a spinner. <b>Cost</b> —
          anyone can pass with 10× hardware; the skill is passing at 60–70% <T k="util">utilization</T> with money left over.
        </p>
        <p style={{ color: C.dim }}>
          Together these are your <T k="sla">SLA</T>. In interviews say it out loud: "I'm designing for p99 under 200ms at
          peak, and I'll keep steady-state utilization near 70% for burst headroom." That sentence is half the interview.
        </p>
      </>
    ),
  },
];

function FieldManual() {
  const [open, setOpen] = useState("request");
  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55 }}>
        Five short briefings — everything the scenarios assume you know. Dotted words are clickable here and everywhere
        else in the game. Read top to bottom once; after that, the scenarios will read like stories instead of jargon.
      </p>
      {MANUAL.map((m) => (
        <div key={m.id} style={{ background: C.panel, border: `1px solid ${open === m.id ? C.net + "66" : C.line}`, borderRadius: 10, marginBottom: 10 }}>
          <button onClick={() => setOpen(open === m.id ? "" : m.id)}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: C.text, padding: "14px 16px", fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between" }}>
            {m.title} <span style={{ color: C.faint }}>{open === m.id ? "−" : "+"}</span>
          </button>
          {open === m.id && (
            <div style={{ padding: "0 16px 16px", fontSize: 14, lineHeight: 1.6 }}>
              {m.body}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SCENARIOS — story first, numbers derived in front of you
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
    rps: 8000, readPct: 0.98, budget: 2000, p99Target: 150,
    profile: (t) => Math.min(1, t / 10),
    story: (
      <>
        You wrote a post last night. This morning it's #1 on Hacker News. Thousands of people are opening the <i>same page</i>{" "}
        right now — each visit is a <T k="read">read</T> (fetch the post, fetch comments). A handful leave comments — those are{" "}
        <T k="write">writes</T>. Nobody warned your one small server.
      </>
    ),
    translate: [
      { math: "~40k readers over the peak hour, ~5 page-loads each, clumped", out: "≈ 8,000 req/s at peak" },
      { math: "readers vastly outnumber commenters (lurker rule ~50:1)", out: "98% reads · 2% writes" },
      { math: "everyone wants the SAME post", out: "cache hit rate can be very high" },
    ],
    think: [
      <>Everyone is reading one identical page. What does that mean for a <T k="cache">cache</T>'s <T k="hitrate">hit rate</T> — and how little database do you actually need?</>,
      <>160 writes/s of comments — is the database's write side ever in danger here?</>,
    ],
  },
  {
    name: "Ticket sale launch",
    rps: 45000, readPct: 0.9, budget: 6500, p99Target: 200,
    profile: (t) => Math.min(1, t / 8),
    story: (
      <>
        A stadium show goes on sale at noon sharp. Half a million fans are camped on the page. At 12:00:00 they all start
        hammering refresh on seat maps and prices (<T k="read">reads</T>), and the lucky ones complete purchases (
        <T k="write">writes</T>). A purchase is a serious write: it must be <T k="durable">durable</T> and correct — selling
        one seat twice is a lawsuit, so no shortcuts on the write path.
      </>
    ),
    translate: [
      { math: "500k fans × ~5–6 refreshes/min in the rush, overlapping", out: "≈ 45,000 req/s at peak" },
      { math: "browsing dominates; only some reach checkout", out: "90% reads · 10% writes" },
      { math: "10% of 45k", out: "4,500 writes/s — versus one primary's ~10k ceiling" },
    ],
    think: [
      <>40,500 reads/s: mostly the same seat maps. How much reaches the database after an 85–90% <T k="hitrate">hit rate</T> — and can what's left fit, or do you need <T k="replica">replicas</T>?</>,
      <>4,500 writes/s fits one primary at ~45% <T k="util">utilization</T>… is that comfortable, or one clump away from the knee?</>,
      <>Could you <T k="queue">queue</T> purchases? Careful — a buyer needs to know NOW if they got the seat. Which writes tolerate delay is a design decision, not a technical one.</>,
    ],
  },
  {
    name: "Sensor firehose",
    rps: 9000, readPct: 0.15, budget: 5000, p99Target: 250,
    profile: (t) => (t >= 12 && t <= 22 ? 2.2 : 1) * Math.min(1, t / 6),
    story: (
      <>
        A logistics company straps a tracker on each of its 60,000 delivery vans. Every 8 seconds, every tracker{" "}
        <T k="phonehome">phones home</T>: "here's my GPS position, speed, engine temp." Each report is a <T k="write">write</T>{" "}
        — the device deposits data and asks nothing back. The only <T k="read">reads</T> are dispatchers watching dashboards.
        Mid-run, a cell-network hiccup disconnects a chunk of the fleet; when it recovers, they all reconnect and resend at
        once — a classic <T k="burst">thundering herd</T> at ~2× normal volume.
      </>
    ),
    translate: [
      { math: "60,000 vans ÷ 1 report per 8s", out: "= 7,500 writes/s, flat, 24/7" },
      { math: "dashboards + API queries on top", out: "≈ 9,000 req/s · 15% reads / 85% writes" },
      { math: "herd burst: 2.2 × 7,650", out: "≈ 16,800 writes/s vs one primary's 10k ceiling" },
    ],
    think: [
      <>Steady state fits one primary (~77% <T k="util">utilization</T> — already near the knee). The burst does not. Two philosophies: buy capacity for the peak (<T k="shard">shards</T>) or buy time (<T k="queue">queue</T>).</>,
      <>The deciding question: does anyone suffer if a GPS ping lands 30 seconds late? For telemetry — no. That tolerance is what makes the <T k="queue">queue</T> option legitimate here and NOT at the ticket checkout.</>,
      <>If you queue: workers + primary must drain the <T k="backlog">backlog</T> after the burst. Size the drain, not just the intake.</>,
    ],
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

  const uApp = util(rps, cfg.app * CAP.app.rps);
  if (uApp > 1) errors += rps ? (rps - cfg.app * CAP.app.rps) / rps : 0;
  comps.push({ id: "app", label: `App servers ×${cfg.app}`, ch: "compute", u: uApp, note: `${fmtNum(rps)} req/s vs ${fmtNum(cfg.app * CAP.app.rps)} cap` });

  let dbReads = reads, uCache = 0;
  if (cfg.cache > 0) {
    uCache = util(reads, cfg.cache * CAP.cacheNode.ops);
    if (uCache > 1) errors += reads ? ((reads - cfg.cache * CAP.cacheNode.ops) / reads) * sc.readPct : 0;
    dbReads = reads * (1 - cfg.hitRate);
    comps.push({ id: "cache", label: `Cache ×${cfg.cache} (${Math.round(cfg.hitRate * 100)}% hit)`, ch: "mem", u: uCache, note: `${fmtNum(reads)} lookups/s · ${fmtNum(dbReads)} miss → DB` });
  }

  let writesToDb = writesIn, lag = backlogRef.current;
  if (cfg.queue) {
    const drainCap = Math.min(cfg.workers * CAP.worker.drain, CAP.dbWrite * cfg.shards);
    const arriving = writesIn + backlogRef.current;
    writesToDb = Math.min(arriving, drainCap);
    backlogRef.current = Math.max(0, arriving - writesToDb);
    lag = backlogRef.current;
    comps.push({ id: "queue", label: `Queue + ${cfg.workers} workers`, ch: "net", u: util(writesToDb, drainCap), note: lag > 0 ? `backlog ${fmtNum(lag)} msgs` : `draining ${fmtNum(writesToDb)}/s` });
  }

  const uDbW = util(writesToDb, CAP.dbWrite * cfg.shards);
  let uDbR;
  if (cfg.replicas > 0) {
    uDbR = util(dbReads, cfg.replicas * CAP.replica.reads);
    comps.push({ id: "dbw", label: `DB primary ×${cfg.shards} shard${cfg.shards > 1 ? "s" : ""}`, ch: "storage", u: uDbW, note: `${fmtNum(writesToDb)} writes/s` });
    comps.push({ id: "dbr", label: `Read replicas ×${cfg.replicas}`, ch: "storage", u: uDbR, note: `${fmtNum(dbReads)} reads/s` });
    if (uDbR > 1) errors += sc.readPct * (1 - (cfg.cache ? cfg.hitRate : 0)) * Math.min(1, uDbR - 1);
  } else {
    uDbR = util(dbReads, CAP.dbRead * cfg.shards);
    const uBoth = uDbW + uDbR;
    comps.push({ id: "db", label: `DB primary ×${cfg.shards} (reads + writes)`, ch: "storage", u: uBoth, note: `${fmtNum(dbReads)} r/s + ${fmtNum(writesToDb)} w/s` });
    if (uBoth > 1) errors += Math.min(0.6, (uBoth - 1) * 0.5);
  }
  if (!cfg.queue && uDbW > 1) errors += (1 - sc.readPct) * Math.min(1, uDbW - 1);

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

const costOf = (cfg) =>
  cfg.app * CAP.app.cost + cfg.cache * CAP.cacheNode.cost + cfg.shards * CAP.dbCost +
  cfg.replicas * CAP.replica.cost + (cfg.queue ? CAP.queue.cost + cfg.workers * CAP.worker.cost : 0);

function Stepper({ label, val, set, min, max, col }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => set(Math.max(min, val - 1))} style={{ width: 26, height: 26, borderRadius: 6, background: C.bg, color: C.text, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: 15 }}>−</button>
        <span className="gr-mono" style={{ minWidth: 22, textAlign: "center", color: col, fontWeight: 600 }}>{val}</span>
        <button onClick={() => set(Math.min(max, val + 1))} style={{ width: 26, height: 26, borderRadius: 6, background: C.bg, color: C.text, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: 15 }}>+</button>
      </div>
    </div>
  );
}

function CH(ch) { return { compute: C.compute, mem: C.mem, storage: C.storage, net: C.net }[ch]; }

function Builder() {
  const [scIdx, setScIdx] = useState(0);
  const [stage, setStage] = useState("brief"); // brief -> build
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
  const pick = (i) => { setScIdx(i); setStage("brief"); setVerdict(null); setFrame(null); backlogRef.current = 0; };

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
        ...(cfg.queue ? [{ name: "backlog drained by end", pass: endLag < 1000, detail: endLag >= 1000 ? `${fmtNum(endLag)} msgs stranded — drain < intake` : "clean" }] : []),
      ];
      const diagnosis = [];
      const worst = h.reduce((a, f) => { f.comps.forEach((c) => { if (!a[c.id] || c.u > a[c.id].u) a[c.id] = c; }); return a; }, {});
      Object.values(worst).forEach((c) => {
        if (c.u >= 1) diagnosis.push(`${c.label} hit ${(c.u * 100).toFixed(0)}% — beyond capacity, requests queue then die. (${c.note})`);
        else if (c.u >= 0.8) diagnosis.push(`${c.label} peaked at ${(c.u * 100).toFixed(0)}% — past the ~80% knee, waiting time grows nonlinearly. It held, but one clump of traffic from failing.`);
      });
      if (checks.every((c) => c.pass) && cost < sc.budget * 0.75) diagnosis.push(`Passed with $${sc.budget - cost}/mo to spare. Interview move: name your headroom on purpose — "I'm at ~65% utilization to absorb 1.5× bursts."`);
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {SCENARIOS.map((s, i) => (
          <button key={s.name} onClick={() => pick(i)}
            style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: i === scIdx ? C.net : C.panel, color: i === scIdx ? C.bg : C.dim, border: `1px solid ${i === scIdx ? C.net : C.line}` }}>
            {s.name}
          </button>
        ))}
      </div>

      {/* ---- BRIEFING ---- */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
        <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 8 }}>BRIEFING — READ THE STORY, THEN WATCH IT BECOME NUMBERS</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{sc.story}</div>

        <div style={{ marginTop: 14 }}>
          <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 6 }}>TRANSLATE THE STORY INTO NUMBERS (the core interview skill)</div>
          {sc.translate.map((r, i) => (
            <div key={i} className="gr-mono" style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12.5, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ color: C.dim, flex: "1 1 300px" }}>{r.math}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{r.out}</span>
            </div>
          ))}
        </div>

        {stage === "brief" ? (
          <>
            <div style={{ marginTop: 14 }}>
              <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.mem, marginBottom: 6 }}>THINK BEFORE YOU BUILD</div>
              {sc.think.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13.5, lineHeight: 1.55 }}>
                  <span className="gr-mono" style={{ color: C.mem }}>{i + 1}.</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStage("build")}
              style={{ marginTop: 10, padding: "11px 22px", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              I've thought about it — open the workbench
            </button>
          </>
        ) : (
          <div className="gr-mono" style={{ fontSize: 12, color: C.dim, marginTop: 12 }}>
            target: peak {fmtNum(sc.rps)} req/s · {Math.round(sc.readPct * 100)}% reads · <T k="p99">p99</T> ≤ {sc.p99Target} ms · budget ${sc.budget}/mo
          </div>
        )}
      </div>

      {/* ---- WORKBENCH ---- */}
      {stage === "build" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
            <div className="gr-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.dim, marginBottom: 6 }}>YOUR ARCHITECTURE</div>
            <Stepper label={<><T k="appserver">App servers</T> · $150 · 10k rps</>} val={cfg.app} set={set("app")} min={1} max={12} col={C.compute} />
            <Stepper label={<><T k="cache">Cache nodes</T> · $200 · 100k ops</>} val={cfg.cache} set={set("cache")} min={0} max={6} col={C.mem} />
            {cfg.cache > 0 && (
              <div style={{ padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.dim }}><T k="hitrate">hit rate</T> (depends on the story!)</span>
                  <span className="gr-mono" style={{ color: C.mem }}>{Math.round(cfg.hitRate * 100)}%</span>
                </div>
                <input type="range" min={50} max={95} value={cfg.hitRate * 100} onChange={(e) => set("hitRate")(+e.target.value / 100)} />
              </div>
            )}
            <Stepper label={<><T k="shard">DB shards</T> · $600 · 10k w/s</>} val={cfg.shards} set={set("shards")} min={1} max={4} col={C.storage} />
            <Stepper label={<><T k="replica">Read replicas</T> · $400 · 20k r/s</>} val={cfg.replicas} set={set("replicas")} min={0} max={6} col={C.storage} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: cfg.queue ? `1px solid ${C.line}` : "none" }}>
              <span style={{ fontSize: 13 }}><T k="queue">Write queue</T> · $300</span>
              <button onClick={() => set("queue")(!cfg.queue)}
                style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: cfg.queue ? C.net : C.bg, color: cfg.queue ? C.bg : C.dim, border: `1px solid ${cfg.queue ? C.net : C.line}` }}>
                {cfg.queue ? "ON" : "OFF"}
              </button>
            </div>
            {cfg.queue && <Stepper label={<><T k="worker">Workers</T> · $100 · 5k w/s</>} val={cfg.workers} set={set("workers")} min={1} max={8} col={C.net} />}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, alignItems: "baseline" }}>
              <span className="gr-mono" style={{ fontSize: 11, color: C.dim }}>MONTHLY COST</span>
              <span className="gr-mono" style={{ fontSize: 18, fontWeight: 600, color: cost > sc.budget ? C.alert : C.ok }}>${cost}</span>
            </div>
            <button onClick={start} disabled={running}
              style={{ marginTop: 12, width: "100%", padding: "12px 0", background: running ? C.line : C.net, color: running ? C.dim : C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: running ? "default" : "pointer", fontFamily: "inherit" }}>
              {running ? `Running… t=${tick}/${TICKS}` : "Run scenario"}
            </button>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, minHeight: 280 }}>
            {!frame && !verdict && (
              <div style={{ color: C.faint, fontSize: 13.5, lineHeight: 1.6, padding: 8 }}>
                Traffic ramps to peak over the run. Bars go amber past 80% <T k="util">utilization</T> — where waiting stops
                being linear — and red at 100%, where requests die. Watch which component gets hot first: that's the story's
                real bottleneck telling on itself.
              </div>
            )}
            {frame && (
              <div>
                <div className="gr-mono" style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, marginBottom: 14 }}>
                  <span style={{ color: C.dim }}>in <b style={{ color: C.text }}>{fmtNum(frame.rps)}/s</b></span>
                  <span style={{ color: C.dim }}>p50 <b style={{ color: C.text }}>{frame.p50.toFixed(0)} ms</b></span>
                  <span style={{ color: C.dim }}>p99 <b style={{ color: frame.p99 > sc.p99Target ? C.alert : C.ok }}>{frame.p99.toFixed(0)} ms</b></span>
                  <span style={{ color: C.dim }}>errors <b style={{ color: frame.errRate > 0.005 ? C.alert : C.ok }}>{(frame.errRate * 100).toFixed(1)}%</b></span>
                  {frame.lag > 0 && <span style={{ color: C.compute }}>backlog {fmtNum(frame.lag)}</span>}
                </div>
                {frame.comps.map((c) => {
                  const col = c.u >= 1 ? C.alert : c.u >= 0.8 ? C.compute : CH(c.ch);
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
      )}
    </div>
  );
}

/* ============================================================
   SHELL
   ============================================================ */
export default function GroundedBuilder() {
  const [mode, setMode] = useState("manual");
  const [term, setTerm] = useState(null);
  return (
    <GlossCtx.Provider value={setTerm}>
      <div className="gr-root" style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingBottom: term ? 120 : 0 }}>
        <style>{FONT_CSS}</style>
        <header style={{ borderBottom: `1px solid ${C.line}`, padding: "18px 20px 0" }}>
          <div style={{ maxWidth: 940, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>THE BUILDER</h1>
              <span className="gr-mono" style={{ fontSize: 11.5, color: C.faint }}>learn it, then survive it · dotted words are clickable</span>
            </div>
            <nav style={{ display: "flex", gap: 4, marginTop: 14 }}>
              {[
                { id: "manual", label: "01 · FIELD MANUAL", sub: "learn the vocabulary" },
                { id: "build", label: "02 · SCENARIOS", sub: "briefing → build → break" },
              ].map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  style={{ padding: "10px 16px 12px", background: "transparent", border: "none", borderBottom: `2px solid ${mode === m.id ? C.net : "transparent"}`, color: mode === m.id ? C.text : C.dim, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, textAlign: "left" }}>
                  <div style={{ fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{m.sub}</div>
                </button>
              ))}
            </nav>
          </div>
        </header>
        <main style={{ padding: "24px 20px 60px" }}>
          {mode === "manual" ? <FieldManual /> : <Builder />}
        </main>
        <GlossaryDrawer termKey={term} onClose={() => setTerm(null)} />
      </div>
    </GlossCtx.Provider>
  );
}
