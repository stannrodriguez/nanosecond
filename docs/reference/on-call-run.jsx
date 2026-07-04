import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   GROUNDED: ON-CALL — a roguelike run (v0.1)
   You are the founding engineer. Survive from launch day to
   the IPO-eve boss. Slay-the-Spire rules, systems-design truth:
   - HP  = ERROR BUDGET (a real SRE concept: the failure your
           users forgive before trust collapses)
   - Gold = cloud budget
   - Relics = real architecture patterns
   - Bosses = real failure modes
   ============================================================ */

const C = {
  bg: "#0F1930", panel: "#152238", panelUp: "#1B2C48", line: "#283A5C",
  text: "#E9EEF8", dim: "#8FA0C0", faint: "#5B6C8F",
  net: "#53DCEC", compute: "#F6BB52", storage: "#EF7BD0", mem: "#72EAA8",
  alert: "#F26D5E", ok: "#72EAA8", gold: "#F6D452",
};
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.oc-root { font-family: 'Space Grotesk', sans-serif; }
.oc-mono { font-family: 'IBM Plex Mono', monospace; }
@keyframes oc-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes oc-dmg { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-24px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .oc-root * { animation: none !important; } }
.oc-root input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
.oc-root input[type=range]::-webkit-slider-runnable-track { height: 4px; background: #283A5C; border-radius: 2px; }
.oc-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 10px; border-radius: 3px; background: #53DCEC; margin-top: -8px; cursor: pointer; }
`;

const fmt = (n) => (n >= 1e6 ? (n / 1e6).toPrecision(3) + "M" : n >= 1e3 ? (n / 1e3).toPrecision(3) + "k" : Math.round(n).toLocaleString());

/* ---------------- PATTERNS (relics) ---------------- */
const PATTERNS = {
  autoscale: { name: "Autoscaling Group", price: 350, icon: "⇧",
    fx: "When traffic exceeds 75% of forecast peak, +2 app servers spin up automatically.",
    irl: "Real thing: scale-out rules on CPU/queue depth. The catch IRL: new instances take minutes to boot — autoscaling handles ramps, not spikes." },
  cdn: { name: "CDN Contract", price: 450, icon: "◍",
    fx: "45% of reads are served at the edge and never reach your stack.",
    irl: "Real thing: CloudFront/Fastly cache static and cacheable content in 300+ cities. Often the single cheapest capacity you can buy." },
  idem: { name: "Idempotency Keys", price: 300, icon: "≡",
    fx: "Failed writes retry safely: error-budget damage from write failures reduced 40%.",
    irl: "Real thing: client sends a unique key per operation; server dedupes. Turns 'scary retry' into 'free retry'. Interviewers love hearing this." },
  breaker: { name: "Circuit Breaker", price: 400, icon: "⏻",
    fx: "Total damage in any single encounter is capped at 30.",
    irl: "Real thing: when a dependency starts failing, stop calling it and fail fast — one sick component can't drag the whole system down with it." },
  degrade: { name: "Graceful Degradation", price: 250, icon: "◐",
    fx: "Slow responses (p99 breaches) deal no damage — users get a stale-but-instant page.",
    irl: "Real thing: serve cached/stale content under load instead of timing out. 'Slightly old' beats 'error 503' almost always." },
  drills: { name: "Chaos Drills", price: 200, icon: "◎",
    fx: "Forecasts reveal the hidden mechanics of elite and boss encounters.",
    irl: "Real thing: Netflix-style chaos engineering — break it on purpose in daylight so it can't surprise you at 3am." },
};

/* ---------------- ENCOUNTERS ---------------- */
/* mod(t) can return { hitZero, hitCap, writeMult, rpsMult } */
const ENC = {
  launch: { name: "Launch Day", rps: 3000, readPct: 0.95, ticks: 14, target: 200,
    flavor: "You shipped. A friendly trickle arrives — reads mostly, a few signups.", secret: null },
  press: { name: "Press Mention", rps: 18000, readPct: 0.97, ticks: 16, target: 200,
    flavor: "A tech blog covered you. 18k req/s of curious readers, all loading the same pages.", secret: null },
  stampede: { name: "ELITE · Cache Stampede", rps: 15000, readPct: 0.92, ticks: 18, target: 200, elite: true,
    flavor: "A deploy restarts your cache fleet mid-rush. For a while, EVERY read goes straight to the database.",
    secret: "Ticks 8–13: cache hit rate forced to 0%. Capacity headroom on the DB is the only defense.",
    mod: (t) => (t >= 8 && t <= 13 ? { hitZero: true } : null) },
  feature: { name: "Feature Launch", rps: 26000, readPct: 0.85, ticks: 16, target: 200,
    flavor: "The new feature lands on the homepage. Heavier traffic, and real write volume for the first time.", secret: null },
  bots: { name: "ELITE · Scraper Swarm", rps: 34000, readPct: 0.99, ticks: 18, target: 200, elite: true,
    flavor: "Bots crawl every page in your catalog. Huge read volume — but each URL is different.",
    secret: "Cache hit rate is capped at 60% — bots never ask for the same thing twice. Replicas shine here.",
    mod: () => ({ hitCap: 0.6 }) },
  surge: { name: "Onboarding Surge", rps: 24000, readPct: 0.7, ticks: 16, target: 200,
    flavor: "A partnership dumps new users on you. Signups, profile writes, uploads — the write side wakes up.", secret: null },
  herd: { name: "BOSS · THE THUNDERING HERD", rps: 15000, readPct: 0.75, ticks: 26, target: 250, boss: true,
    flavor: "IPO eve. A mobile-network blip disconnects half your client fleet. They will ALL come back at once, resending everything they queued offline.",
    secret: "Ticks 9–20: writes ×3 and traffic ×1.3 as the herd reconnects. One primary cannot absorb it — buy capacity (shards) or buy time (queue).",
    mod: (t) => (t >= 9 && t <= 20 ? { writeMult: 3, rpsMult: 1.3 } : null) },
};

/* ---------------- MAP ---------------- */
const LAYERS = [
  [{ kind: "fight", enc: "launch" }],
  [{ kind: "fight", enc: "press" }],
  [{ kind: "rest" }, { kind: "shop" }],
  [{ kind: "elite", enc: "stampede" }],
  [{ kind: "event" }],
  [{ kind: "fight", enc: "feature" }],
  [{ kind: "elite", enc: "bots" }, { kind: "fight", enc: "surge" }],
  [{ kind: "shop" }],
  [{ kind: "rest" }],
  [{ kind: "boss", enc: "herd" }],
];
const NODE_META = {
  fight: { label: "Traffic", icon: "▲", col: C.net },
  elite: { label: "Elite", icon: "◆", col: C.storage },
  boss: { label: "Boss", icon: "☠", col: C.alert },
  shop: { label: "Vendor", icon: "$", col: C.gold },
  rest: { label: "Sprint break", icon: "☕", col: C.mem },
  event: { label: "Page at 3am", icon: "?", col: C.compute },
};

/* ---------------- SIM ---------------- */
const CAP = { appRps: 10000, cacheOps: 100000, dbW: 10000, dbR: 20000, repR: 20000, wDrain: 5000 };
const PRICE = { app: 150, cache: 200, shard: 600, replica: 400, queue: 300, worker: 100 };

function simTick(cfg, enc, t, pats, backlogRef) {
  const m = enc.mod ? enc.mod(t) || {} : {};
  const ramp = Math.min(1, t / 6);
  const rps0 = enc.rps * ramp * (m.rpsMult || 1);
  let reads = rps0 * enc.readPct;
  let writes = rps0 * (1 - enc.readPct) * (m.writeMult || 1);
  if (pats.includes("cdn")) reads *= 0.55;
  const rps = reads + writes;

  const effApp = cfg.app + (pats.includes("autoscale") && rps0 > 0.75 * enc.rps ? 2 : 0);
  const comps = [];
  let readErr = 0, writeErr = 0;
  const U = (l, c) => (c <= 0 ? 2 : l / c);
  const M = (u) => (u >= 1 ? 20 : 1 / (1 - Math.min(u, 0.95)));

  const uApp = U(rps, effApp * CAP.appRps);
  if (uApp > 1) { const drop = (rps - effApp * CAP.appRps) / rps; readErr += drop * (reads / rps); writeErr += drop * (writes / rps); }
  comps.push({ id: "app", label: `App ×${effApp}${effApp > cfg.app ? " (autoscaled)" : ""}`, ch: C.compute, u: uApp, note: `${fmt(rps)} req/s` });

  let hit = 0, dbReads = reads;
  if (cfg.cache > 0) {
    hit = m.hitZero ? 0 : Math.min(cfg.hitRate + (pats.includes("cdn") ? 0.05 : 0), m.hitCap ?? 1);
    const uC = U(reads, cfg.cache * CAP.cacheOps);
    if (uC > 1) readErr += ((reads - cfg.cache * CAP.cacheOps) / reads) * 0.5;
    dbReads = reads * (1 - hit);
    comps.push({ id: "cache", label: `Cache ×${cfg.cache} (${Math.round(hit * 100)}% hit${m.hitZero ? " — STAMPEDE" : m.hitCap ? " — capped" : ""})`, ch: C.mem, u: uC, note: `${fmt(dbReads)} miss → DB` });
  }

  let dbWrites = writes, lag = backlogRef.current;
  if (cfg.queue) {
    let drain = cfg.workers * CAP.wDrain * (cfg.workers >= 3 ? 1.25 : 1);
    drain = Math.min(drain, CAP.dbW * cfg.shards);
    const arriving = writes + backlogRef.current;
    dbWrites = Math.min(arriving, drain);
    backlogRef.current = Math.max(0, arriving - dbWrites);
    lag = backlogRef.current;
    comps.push({ id: "q", label: `Queue + ${cfg.workers} workers${cfg.workers >= 3 ? " ⚡tuned" : ""}`, ch: C.net, u: U(dbWrites, drain), note: lag > 0 ? `backlog ${fmt(lag)}` : `drain ${fmt(dbWrites)}/s` });
  }

  const uW = U(dbWrites, CAP.dbW * cfg.shards);
  let uR;
  if (cfg.replicas > 0) {
    uR = U(dbReads, cfg.replicas * CAP.repR);
    comps.push({ id: "dbw", label: `Primary ×${cfg.shards}`, ch: C.storage, u: uW, note: `${fmt(dbWrites)} w/s` });
    comps.push({ id: "dbr", label: `Replicas ×${cfg.replicas}`, ch: C.storage, u: uR, note: `${fmt(dbReads)} r/s` });
    if (uR > 1) readErr += (1 - hit) * Math.min(1, uR - 1) * 0.7;
  } else {
    uR = U(dbReads, CAP.dbR * cfg.shards);
    const uB = uW + uR;
    comps.push({ id: "db", label: `Primary ×${cfg.shards} (r+w)`, ch: C.storage, u: uB, note: `${fmt(dbReads)} r/s + ${fmt(dbWrites)} w/s` });
    if (uB > 1) { readErr += Math.min(0.5, (uB - 1) * 0.4); writeErr += Math.min(0.5, (uB - 1) * 0.4); }
  }
  if (!cfg.queue && uW > 1) writeErr += Math.min(1, uW - 1) * 0.8;

  const appLat = 3 * M(uApp);
  const dbLat = 5 * M(cfg.replicas > 0 ? Math.max(uR, uW) : uR + uW);
  const readLat = 1 + appLat + (cfg.cache ? hit * 1 + (1 - hit) * (1 + dbLat) : dbLat);
  const writeLat = 1 + appLat + (cfg.queue ? 2 : 5 * M(uW));
  const p50 = (reads * readLat + writes * writeLat) / Math.max(1, rps);
  const p99 = Math.min(5000, p50 * 3.2);

  // damage
  let dmg = (readErr * (reads / Math.max(1, rps)) + writeErr * (writes / Math.max(1, rps)) * (pats.includes("idem") ? 0.6 : 1)) * 30;
  if (p99 > enc.target && !pats.includes("degrade")) dmg += 1.5;
  return { comps, p50, p99, err: Math.min(1, readErr + writeErr), dmg, lag, rps };
}

const stackCost = (c) =>
  c.app * PRICE.app + c.cache * PRICE.cache + c.shards * PRICE.shard + c.replicas * PRICE.replica + (c.queue ? PRICE.queue + c.workers * PRICE.worker : 0);

/* ---------------- UI atoms ---------------- */
function Bar({ label, u, ch, note, pulsing }) {
  const col = u >= 1 ? C.alert : u >= 0.8 ? C.compute : ch;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
        <span>{label}</span>
        <span className="oc-mono" style={{ color: col, fontWeight: 600, animation: pulsing && u >= 1 ? "oc-pulse .8s infinite" : "none" }}>{(u * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: 12, background: C.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${Math.min(u, 1) * 100}%`, background: `linear-gradient(90deg, ${col}55, ${col})`, transition: "width .14s linear" }} />
        <div style={{ position: "absolute", left: "80%", top: 0, bottom: 0, width: 1, background: C.faint }} />
      </div>
      <div className="oc-mono" style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{note}</div>
    </div>
  );
}

function Step({ label, val, canDec, canInc, onDec, onInc, col, price }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 12.5 }}>{label} <span className="oc-mono" style={{ color: C.gold, fontSize: 11 }}>${price}</span></span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button disabled={!canDec} onClick={onDec} style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, color: canDec ? C.text : C.faint, border: `1px solid ${C.line}`, cursor: canDec ? "pointer" : "default", fontSize: 14 }}>−</button>
        <span className="oc-mono" style={{ minWidth: 20, textAlign: "center", color: col, fontWeight: 600, fontSize: 13 }}>{val}</span>
        <button disabled={!canInc} onClick={onInc} style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, color: canInc ? C.text : C.faint, border: `1px solid ${C.line}`, cursor: canInc ? "pointer" : "default", fontSize: 14 }}>+</button>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function OnCall() {
  const fresh = () => ({
    phase: "map", layer: 0, node: null,
    hp: 100, gold: 900,
    cfg: { app: 2, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 },
    pats: [], draft: null, over: null, log: [],
  });
  const [g, setG] = useState(fresh);
  const [tick, setTick] = useState(-1);
  const [frame, setFrame] = useState(null);
  const [encDmg, setEncDmg] = useState(0);
  const [result, setResult] = useState(null);
  const backlogRef = useRef(0);
  const dmgRef = useRef(0);
  const histRef = useRef([]);

  const enc = g.node && g.node.enc ? ENC[g.node.enc] : null;
  const upd = (patch) => setG((s) => ({ ...s, ...patch }));

  /* ---- encounter runner ---- */
  useEffect(() => {
    if (tick < 0 || !enc) return;
    if (tick > enc.ticks) {
      const dmg = Math.round(g.pats.includes("breaker") ? Math.min(30, dmgRef.current) : dmgRef.current);
      const strandedLag = histRef.current.length ? histRef.current[histRef.current.length - 1].lag : 0;
      const extraLag = strandedLag > 2000 ? 8 : 0;
      const total = dmg + extraLag;
      const hp = g.hp - total;
      if (hp <= 0) {
        upd({ hp: 0, over: { win: false, why: `${enc.name} burned through your remaining error budget. Users lost faith.` } });
      } else {
        const reward = enc.boss ? 0 : enc.elite ? 1100 : 700;
        setResult({ dmg: total, lagNote: extraLag > 0, reward, boss: enc.boss });
        upd({ hp });
      }
      setTick(-1);
      return;
    }
    const id = setTimeout(() => {
      const f = simTick(g.cfg, enc, tick, g.pats, backlogRef);
      dmgRef.current += f.dmg;
      histRef.current.push(f);
      setFrame(f);
      setEncDmg(Math.round(g.pats.includes("breaker") ? Math.min(30, dmgRef.current) : dmgRef.current));
      setTick(tick + 1);
    }, 150);
    return () => clearTimeout(id);
  }, [tick]);

  const startEnc = () => { backlogRef.current = 0; dmgRef.current = 0; histRef.current = []; setEncDmg(0); setResult(null); setFrame(null); setTick(0); };

  const finishNode = (extra = {}) => {
    const nextLayer = g.layer + 1;
    if (nextLayer >= LAYERS.length) { upd({ over: { win: true }, ...extra }); return; }
    upd({ phase: "map", layer: nextLayer, node: null, ...extra });
    setFrame(null); setResult(null);
  };

  const makeDraft = () => {
    const pool = Object.keys(PATTERNS).filter((k) => !g.pats.includes(k));
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    return [...picks.map((k) => ({ kind: "pat", k })), { kind: "gold", amt: 400 }];
  };

  /* ---- buy/sell helpers ---- */
  const buy = (k, price) => {
    if (g.gold < price) return;
    if (k === "queue") upd({ gold: g.gold - price, cfg: { ...g.cfg, queue: true } });
    else upd({ gold: g.gold - price, cfg: { ...g.cfg, [k]: g.cfg[k] + 1 } });
  };
  const sell = (k, price) => {
    const refund = Math.round(price * 0.6);
    if (k === "queue") upd({ gold: g.gold + refund, cfg: { ...g.cfg, queue: false } });
    else upd({ gold: g.gold + refund, cfg: { ...g.cfg, [k]: g.cfg[k] - 1 } });
  };

  /* ---------------- SCREENS ---------------- */
  const Header = (
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.line}`, marginBottom: 16 }}>
      <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3 }}>ON-CALL</span>
      <span className="oc-mono" style={{ fontSize: 12, color: C.dim }}>node {Math.min(g.layer + 1, LAYERS.length)}/{LAYERS.length}</span>
      <span className="oc-mono" style={{ fontSize: 13 }}>
        <span style={{ color: C.faint }}>error budget </span>
        <b style={{ color: g.hp > 50 ? C.ok : g.hp > 25 ? C.compute : C.alert }}>{g.hp}</b><span style={{ color: C.faint }}>/100</span>
      </span>
      <div style={{ width: 110, height: 8, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${g.hp}%`, background: g.hp > 50 ? C.ok : g.hp > 25 ? C.compute : C.alert, transition: "width .3s" }} />
      </div>
      <span className="oc-mono" style={{ fontSize: 13, color: C.gold }}>${g.gold}</span>
      <div style={{ display: "flex", gap: 6 }}>
        {g.pats.map((k) => (
          <span key={k} title={`${PATTERNS[k].name}: ${PATTERNS[k].fx}`} className="oc-mono"
            style={{ width: 26, height: 26, borderRadius: 6, background: C.panelUp, border: `1px solid ${C.net}55`, color: C.net, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "help" }}>
            {PATTERNS[k].icon}
          </span>
        ))}
      </div>
    </div>
  );

  /* game over */
  if (g.over) {
    const w = g.over.win;
    return (
      <Shell>{Header}
        <div style={{ maxWidth: 620, margin: "40px auto", textAlign: "center" }}>
          <div className="oc-mono" style={{ fontSize: 30, fontWeight: 700, color: w ? C.ok : C.alert }}>{w ? "YOU SURVIVED TO IPO" : "PAGED OUT"}</div>
          <p style={{ color: C.dim, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            {w ? `The Thundering Herd came, resent everything, and your system held. Final error budget: ${g.hp}/100 with $${g.gold} unspent.`
              : g.over.why}
          </p>
          {g.pats.length > 0 && (
            <div style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 20 }}>
              <div className="oc-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 10 }}>PATTERNS YOU NOW KNOW — THESE ARE REAL</div>
              {g.pats.map((k) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <span style={{ color: C.net, fontWeight: 600, fontSize: 13.5 }}>{PATTERNS[k].icon} {PATTERNS[k].name}</span>
                  <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{PATTERNS[k].irl}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setG(fresh()); setFrame(null); setResult(null); }}
            style={{ marginTop: 22, padding: "12px 28px", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
            New run
          </button>
        </div>
      </Shell>
    );
  }

  /* MAP */
  if (g.phase === "map") {
    return (
      <Shell>{Header}
        <p style={{ color: C.dim, fontSize: 13.5, maxWidth: 640 }}>
          Your route to IPO. Choose your path when it forks — elites hit harder but pay better. Your error budget does
          not regenerate on its own: spend it wisely, defend it fiercely.
        </p>
        <div style={{ maxWidth: 560, margin: "18px auto" }}>
          {LAYERS.map((layer, li) => (
            <div key={li} style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 10, opacity: li < g.layer ? 0.35 : 1 }}>
              {layer.map((node, ni) => {
                const meta = NODE_META[node.kind];
                const active = li === g.layer;
                const e = node.enc ? ENC[node.enc] : null;
                return (
                  <button key={ni} disabled={!active}
                    onClick={() => upd({ phase: node.kind === "fight" || node.kind === "elite" || node.kind === "boss" ? "encounter" : node.kind, node })}
                    style={{ flex: 1, maxWidth: 270, textAlign: "left", background: active ? C.panelUp : C.panel, border: `1.5px solid ${active ? meta.col : C.line}`, borderRadius: 10, padding: "10px 14px", cursor: active ? "pointer" : "default", fontFamily: "inherit", color: C.text, boxShadow: active ? `0 0 14px ${meta.col}33` : "none" }}>
                    <span className="oc-mono" style={{ color: meta.col, fontSize: 12, fontWeight: 600 }}>{meta.icon} {meta.label}</span>
                    <div style={{ fontSize: 13, marginTop: 3, color: active ? C.text : C.dim }}>
                      {e ? e.name.replace("ELITE · ", "").replace("BOSS · ", "") : node.kind === "shop" ? "Buy patterns & capacity" : node.kind === "rest" ? "Recover trust or raise funds" : "Something needs a decision"}
                    </div>
                    {e && <div className="oc-mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{fmt(e.rps)} req/s · {Math.round(e.readPct * 100)}% reads</div>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  /* REST */
  if (g.phase === "rest") {
    return (
      <Shell>{Header}
        <Card title="SPRINT BREAK" col={C.mem}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>A quiet week. The pager is silent. You can invest it one way:</p>
          <Choice onClick={() => finishNode({ hp: Math.min(100, g.hp + 30) })}
            title="Reliability sprint · error budget +30"
            sub="Fix the flaky retries, add the missing timeouts. Trust is rebuilt one boring fix at a time." />
          <Choice onClick={() => finishNode({ gold: g.gold + 500 })}
            title="Pitch investors · +$500"
            sub="A crisp demo, a bigger cheque. The reliability debt stays where it is." />
        </Card>
      </Shell>
    );
  }

  /* EVENT */
  if (g.phase === "event") {
    return (
      <Shell>{Header}
        <Card title="PAGE AT 3AM" col={C.compute}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            A schema migration must run before the next launch, and it takes a table lock. The safe way costs money;
            the fast way costs trust. (This exact tradeoff has ruined a thousand real Tuesdays.)
          </p>
          <Choice onClick={() => finishNode({ hp: Math.max(1, g.hp - 10) })}
            title="Run it live tonight · error budget −10"
            sub="The lock stalls writes for 40 seconds. Some users see errors. It's over quickly." />
          <Choice disabled={g.gold < 400} onClick={() => finishNode({ gold: g.gold - 400 })}
            title="Blue-green migration · −$400"
            sub="Stand up a copy, migrate it, switch traffic over. Zero user impact — paid for in cloud bills." />
        </Card>
      </Shell>
    );
  }

  /* SHOP */
  if (g.phase === "shop") {
    const forSale = Object.keys(PATTERNS).filter((k) => !g.pats.includes(k)).slice(0, 3);
    return (
      <Shell>{Header}
        <Card title="VENDOR EXPO" col={C.gold}>
          <p style={{ fontSize: 14, color: C.dim }}>Patterns are permanent for the run. Capacity you can also buy right before any encounter.</p>
          {forSale.map((k) => {
            const p = PATTERNS[k];
            return (
              <Choice key={k} disabled={g.gold < p.price}
                onClick={() => upd({ pats: [...g.pats, k], gold: g.gold - p.price })}
                title={`${p.icon} ${p.name} · $${p.price}`} sub={p.fx} />
            );
          })}
          <Choice disabled={g.gold < 250 || g.hp >= 100} onClick={() => upd({ hp: Math.min(100, g.hp + 20), gold: g.gold - 250 })}
            title="Incident retro workshop · $250 · error budget +20"
            sub="A blameless postmortem turns last week's outage into next week's safeguard." />
          <button onClick={() => finishNode()} style={{ marginTop: 14, padding: "10px 22px", background: C.panelUp, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Leave the expo →
          </button>
        </Card>
      </Shell>
    );
  }

  /* ENCOUNTER */
  const running = tick >= 0;
  const revealed = enc && (!enc.secret || g.pats.includes("drills") || !!enc.boss === false && !enc.elite ? true : g.pats.includes("drills"));
  const showSecret = enc && enc.secret && (g.pats.includes("drills"));
  return (
    <Shell>{Header}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span className="oc-mono" style={{ fontSize: 15, fontWeight: 700, color: enc.boss ? C.alert : enc.elite ? C.storage : C.net }}>{enc.name}</span>
        <span className="oc-mono" style={{ fontSize: 12, color: C.dim }}>forecast: {fmt(enc.rps)} req/s · {Math.round(enc.readPct * 100)}% reads · p99 ≤ {enc.target}ms</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, margin: "8px 0" }}>{enc.flavor}</p>
      {enc.secret && (
        <div className="oc-mono" style={{ fontSize: 12, color: showSecret ? C.compute : C.faint, background: C.panel, border: `1px dashed ${showSecret ? C.compute : C.line}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          {showSecret ? `◎ CHAOS DRILLS INTEL: ${enc.secret}` : "??? — monitoring is vague about what this will actually do. (Chaos Drills would tell you.)"}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(250px, 300px) 1fr", gap: 16, alignItems: "start" }}>
        {/* workbench */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
          <div className="oc-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.dim, marginBottom: 4 }}>STACK · sell refunds 60%</div>
          <Step label="App servers" price={PRICE.app} val={g.cfg.app} col={C.compute}
            canDec={!running && g.cfg.app > 1} canInc={!running && g.gold >= PRICE.app}
            onDec={() => sell("app", PRICE.app)} onInc={() => buy("app", PRICE.app)} />
          <Step label="Cache nodes" price={PRICE.cache} val={g.cfg.cache} col={C.mem}
            canDec={!running && g.cfg.cache > 0} canInc={!running && g.gold >= PRICE.cache}
            onDec={() => sell("cache", PRICE.cache)} onInc={() => buy("cache", PRICE.cache)} />
          <Step label="DB shards" price={PRICE.shard} val={g.cfg.shards} col={C.storage}
            canDec={!running && g.cfg.shards > 1} canInc={!running && g.gold >= PRICE.shard}
            onDec={() => sell("shards", PRICE.shard)} onInc={() => buy("shards", PRICE.shard)} />
          <Step label="Read replicas" price={PRICE.replica} val={g.cfg.replicas} col={C.storage}
            canDec={!running && g.cfg.replicas > 0} canInc={!running && g.gold >= PRICE.replica}
            onDec={() => sell("replicas", PRICE.replica)} onInc={() => buy("replicas", PRICE.replica)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: g.cfg.queue ? `1px solid ${C.line}` : "none" }}>
            <span style={{ fontSize: 12.5 }}>Write queue <span className="oc-mono" style={{ color: C.gold, fontSize: 11 }}>${PRICE.queue}</span></span>
            <button disabled={running || (!g.cfg.queue && g.gold < PRICE.queue)}
              onClick={() => (g.cfg.queue ? sell("queue", PRICE.queue) : buy("queue", PRICE.queue))}
              style={{ padding: "3px 11px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, background: g.cfg.queue ? C.net : C.bg, color: g.cfg.queue ? C.bg : C.dim, border: `1px solid ${g.cfg.queue ? C.net : C.line}` }}>
              {g.cfg.queue ? "ON" : "OFF"}
            </button>
          </div>
          {g.cfg.queue && (
            <Step label="Workers" price={PRICE.worker} val={g.cfg.workers} col={C.net}
              canDec={!running && g.cfg.workers > 1} canInc={!running && g.gold >= PRICE.worker}
              onDec={() => sell("workers", PRICE.worker)} onInc={() => buy("workers", PRICE.worker)} />
          )}
          {g.cfg.queue && g.cfg.workers >= 3 && <div className="oc-mono" style={{ fontSize: 10.5, color: C.net, marginTop: 6 }}>⚡ SYNERGY: 3+ workers → drain ×1.25</div>}
          {g.cfg.cache > 0 && g.pats.includes("cdn") && <div className="oc-mono" style={{ fontSize: 10.5, color: C.mem, marginTop: 4 }}>⚡ SYNERGY: CDN + cache → hit rate +5%</div>}
          <button onClick={startEnc} disabled={running || !!result}
            style={{ marginTop: 12, width: "100%", padding: "11px 0", background: running ? C.line : C.alert, color: running ? C.dim : "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: running ? "default" : "pointer", fontFamily: "inherit" }}>
            {running ? `t=${tick}/${enc.ticks}` : result ? "Survived" : enc.boss ? "FACE THE HERD" : "Take the traffic"}
          </button>
        </div>

        {/* live */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, minHeight: 260 }}>
          {!frame && !result && <div style={{ color: C.faint, fontSize: 13.5, lineHeight: 1.6 }}>Configure, then take the traffic. Damage to your error budget comes from dropped requests and (unless you degrade gracefully) blown p99s.</div>}
          {frame && (
            <div>
              <div className="oc-mono" style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, marginBottom: 12 }}>
                <span style={{ color: C.dim }}>in <b style={{ color: C.text }}>{fmt(frame.rps)}/s</b></span>
                <span style={{ color: C.dim }}>p99 <b style={{ color: frame.p99 > enc.target ? C.alert : C.ok }}>{frame.p99.toFixed(0)}ms</b></span>
                <span style={{ color: C.dim }}>errors <b style={{ color: frame.err > 0.005 ? C.alert : C.ok }}>{(frame.err * 100).toFixed(1)}%</b></span>
                <span style={{ color: encDmg > 0 ? C.alert : C.dim }}>budget damage <b>−{encDmg}</b></span>
                {frame.lag > 0 && <span style={{ color: C.compute }}>backlog {fmt(frame.lag)}</span>}
              </div>
              {frame.comps.map((c) => <Bar key={c.id} label={c.label} u={c.u} ch={c.ch} note={c.note} pulsing />)}
            </div>
          )}
          {result && (
            <div style={{ borderTop: frame ? `1px solid ${C.line}` : "none", paddingTop: 12, marginTop: 6 }}>
              <div className="oc-mono" style={{ fontSize: 15, fontWeight: 700, color: result.dmg > 25 ? C.alert : result.dmg > 0 ? C.compute : C.ok }}>
                {result.dmg === 0 ? "FLAWLESS — no error budget spent" : `Survived · error budget −${result.dmg}`}
              </div>
              {result.lagNote && <div style={{ fontSize: 12.5, color: C.compute, marginTop: 4 }}>Backlog left stranded in the queue — late data cost you extra trust. Size the drain, not just the intake.</div>}
              {!result.boss && <div className="oc-mono" style={{ fontSize: 13, color: C.gold, marginTop: 6 }}>funding +${result.reward}</div>}
              {!result.boss ? (
                !g.draft ? (
                  <button onClick={() => upd({ gold: g.gold + result.reward, draft: makeDraft() })}
                    style={{ marginTop: 12, padding: "10px 20px", background: C.net, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    Collect & draft reward
                  </button>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <div className="oc-mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 8 }}>CHOOSE ONE</div>
                    {g.draft.map((d, i) => d.kind === "pat" ? (
                      <Choice key={i} onClick={() => { upd({ pats: [...g.pats, d.k], draft: null }); finishNode(); }}
                        title={`${PATTERNS[d.k].icon} ${PATTERNS[d.k].name}`} sub={PATTERNS[d.k].fx} />
                    ) : (
                      <Choice key={i} onClick={() => { upd({ gold: g.gold + d.amt, draft: null }); finishNode(); }}
                        title={`+$${d.amt} funding`} sub="Cash keeps options open. Patterns keep systems up." />
                    ))}
                  </div>
                )
              ) : (
                <button onClick={() => upd({ over: { win: true } })}
                  style={{ marginTop: 12, padding: "10px 20px", background: C.ok, color: C.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Ring the bell 🔔
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );

  /* helpers rendered above */
  function Shell({ children }) {
    return (
      <div className="oc-root" style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "0 20px 60px" }}>
        <style>{FONT_CSS}</style>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>{children}</div>
      </div>
    );
  }
  function Card({ title, col, children }) {
    return (
      <div style={{ maxWidth: 620, margin: "20px auto", background: C.panel, border: `1px solid ${col}55`, borderRadius: 12, padding: 20 }}>
        <div className="oc-mono" style={{ fontSize: 11, letterSpacing: 2, color: col, marginBottom: 10 }}>{title}</div>
        {children}
      </div>
    );
  }
  function Choice({ title, sub, onClick, disabled }) {
    return (
      <button onClick={onClick} disabled={disabled}
        style={{ display: "block", width: "100%", textAlign: "left", background: C.panelUp, border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 14px", marginTop: 10, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", color: disabled ? C.faint : C.text, opacity: disabled ? 0.55 : 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: C.dim, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
      </button>
    );
  }
}
