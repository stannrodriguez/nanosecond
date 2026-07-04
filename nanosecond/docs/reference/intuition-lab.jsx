import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   GROUNDED — INTUITION LAB (v0.2)
   Numbers don't stick. Mechanisms do.
   Four playable machines, each of which makes one famous
   number impossible to forget:
   1. RACE LIGHT   -> why latency numbers are what they are
   2. THE DISK     -> why random I/O is 1000x worse (8ms)
   3. LEAKY BITS   -> what RAM actually is (100ns, refresh)
   4. THE QUEUE    -> why every scale trigger says 80%
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
.gr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 22px; width: 10px; border-radius: 3px; background: #53DCEC; margin-top: -9px; box-shadow: 0 0 10px #53DCEC88; cursor: pointer; }
.gr-root input[type=range]::-moz-range-track { height: 4px; background: #283A5C; border-radius: 2px; }
.gr-root input[type=range]::-moz-range-thumb { height: 22px; width: 10px; border: none; border-radius: 3px; background: #53DCEC; cursor: pointer; }
@keyframes gr-flash { 0% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .gr-root * { animation: none !important; } }
`;

/* ---------- helpers ---------- */
const fmtTimeNs = (ns) => {
  if (ns < 1e3) return `${ns < 10 ? ns.toFixed(1) : Math.round(ns)} ns`;
  if (ns < 1e6) return `${(ns / 1e3).toPrecision(3)} µs`;
  if (ns < 1e9) return `${(ns / 1e6).toPrecision(3)} ms`;
  return `${(ns / 1e9).toPrecision(3)} s`;
};
const fmtDist = (m) => {
  if (m < 0.01) return `${(m * 1000).toFixed(1)} mm`;
  if (m < 1) return `${(m * 100).toFixed(0)} cm`;
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${Math.round(m / 1000).toLocaleString()} km`;
};
const fmtBig = (n) => {
  if (n >= 1e9) return (n / 1e9).toPrecision(3) + " billion";
  if (n >= 1e6) return (n / 1e6).toPrecision(3) + " million";
  if (n >= 1e3) return Math.round(n).toLocaleString();
  return Math.round(n).toString();
};

// rAF loop hook
function useRaf(cb, running) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!running) return;
    let id, last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      cbRef.current(dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running]);
}

function Punchline({ color, children }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${color}55`, borderRadius: 8, padding: "12px 14px", marginTop: 14, fontSize: 14, lineHeight: 1.55 }}>
      {children}
    </div>
  );
}

/* ============================================================
   TOY 1 — RACE LIGHT
   Pick an operation. Watch how far light gets before it ends.
   ============================================================ */
const LIGHT_OPS = [
  { name: "1 CPU cycle", ns: 0.3, ch: C.compute,
    punch: "Light barely crossed the chip. One tick of a 3.3 GHz clock is the time light needs to cross a die 9 cm wide — this is WHY chips are 2 cm across, and why clock speed stopped climbing. The chip can't be bigger than one tick of light." },
  { name: "L1 cache hit", ns: 1, ch: C.mem,
    punch: "30 cm — light crossed your keyboard. L1 is fast because it's physically millimetres from the ALU. 'Fast' and 'close' are the same word in hardware." },
  { name: "RAM fetch (DRAM)", ns: 100, ch: C.mem,
    punch: "While your CPU fetched ONE value from RAM, light crossed a 30-metre building — and the CPU sat through ~300 cycles doing nothing. That idle gap is the entire reason caches, prefetching, and 'keep it in L1' engineering exist." },
  { name: "NVMe SSD read", ns: 80000, ch: C.storage,
    punch: "24 kilometres — light crossed the whole city while the drive sensed trapped electrons in one flash page. Your CPU could have executed a quarter-million instructions. This is the wall between 'in memory' and 'on disk' — the single most important line in systems design." },
  { name: "HDD random read", ns: 8e6, ch: C.storage,
    punch: "2,400 km — light crossed half the continent while a metal arm swung one centimetre and waited for a platter to spin. Now go to THE DISK toy and watch it happen." },
  { name: "Cross-region round trip", ns: 7e7, ch: C.net,
    punch: "21,000 km — light went HALFWAY AROUND THE PLANET, because that's literally what the round trip is. Nothing is 'slow' here; the request simply traveled the Earth. This is why multi-region sync consistency costs what it costs. Geography is the final boss." },
];
const LANDMARKS = [
  { m: 0.02, label: "chip die" }, { m: 0.3, label: "keyboard" }, { m: 2, label: "server rack" },
  { m: 100, label: "datacenter" }, { m: 10e3, label: "city" }, { m: 1e6, label: "1,000 km" },
  { m: 4.5e6, label: "US coast-to-coast" }, { m: 2e7, label: "half the planet" },
];
const LOG_MIN = Math.log10(0.005), LOG_MAX = Math.log10(4e7);
const xOf = (m) => ((Math.log10(Math.max(m, 0.005)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;

function RaceLight() {
  const [opIdx, setOpIdx] = useState(2);
  const [u, setU] = useState(0); // 0..1 progress in log-time
  const [running, setRunning] = useState(false);
  const op = LIGHT_OPS[opIdx];
  const DUR = 4.5;

  useRaf((dt) => {
    setU((prev) => {
      const next = prev + dt / DUR;
      if (next >= 1) { setRunning(false); return 1; }
      return next;
    });
  }, running);

  // elapsed time moves linearly in LOG space so every decade is visible
  const logStartNs = -1.5; // 0.03 ns
  const logEndNs = Math.log10(op.ns);
  const elapsedNs = Math.pow(10, logStartNs + u * (logEndNs - logStartNs));
  const dist = 0.2998 * elapsedNs; // metres (vacuum)
  const cycles = elapsedNs / 0.3;
  const done = u >= 1;

  const start = (i) => { setOpIdx(i); setU(0); setRunning(true); };

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Light is the fastest thing that can ever exist — 30 cm per nanosecond. Pick an operation and race it.
        Where light ends up when the operation finishes IS the intuition for that number.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
        {LIGHT_OPS.map((o, i) => (
          <button key={o.name} onClick={() => start(i)}
            style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600,
              background: i === opIdx ? o.ch : C.panel, color: i === opIdx ? C.bg : C.dim, border: `1px solid ${i === opIdx ? o.ch : C.line}` }}>
            {o.name}
          </button>
        ))}
      </div>

      {/* dashboard */}
      <div className="gr-mono" style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, margin: "16px 0 10px" }}>
        <span style={{ color: C.dim }}>elapsed <b style={{ color: C.text, fontSize: 16 }}>{fmtTimeNs(elapsedNs * (done ? op.ns / elapsedNs : 1))}</b>{done ? "" : ` / ${fmtTimeNs(op.ns)}`}</span>
        <span style={{ color: C.dim }}>light traveled <b style={{ color: op.ch, fontSize: 16 }}>{fmtDist(done ? 0.2998 * op.ns : dist)}</b></span>
        <span style={{ color: C.dim }}>CPU cycles burned <b style={{ color: C.compute, fontSize: 16 }}>{fmtBig(done ? op.ns / 0.3 : cycles)}</b></span>
      </div>

      {/* the log-scale racetrack */}
      <div style={{ position: "relative", height: 120, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
        {LANDMARKS.map((l) => (
          <div key={l.label} style={{ position: "absolute", left: `${xOf(l.m)}%`, top: 0, bottom: 0 }}>
            <div style={{ width: 1, height: "100%", background: C.line }} />
            <span className="gr-mono" style={{ position: "absolute", top: 8, left: 4, fontSize: 10, color: C.faint, whiteSpace: "nowrap" }}>{l.label}</span>
            <span className="gr-mono" style={{ position: "absolute", bottom: 6, left: 4, fontSize: 9, color: C.faint }}>{fmtDist(l.m)}</span>
          </div>
        ))}
        {/* light trail */}
        <div style={{ position: "absolute", left: 0, top: "52%", height: 3, width: `${xOf(done ? 0.2998 * op.ns : dist)}%`, background: `linear-gradient(90deg, transparent, ${op.ch})`, boxShadow: `0 0 12px ${op.ch}` }} />
        {/* photon */}
        <div style={{ position: "absolute", left: `calc(${xOf(done ? 0.2998 * op.ns : dist)}% - 6px)`, top: "calc(52% - 5px)", width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: `0 0 16px 4px ${op.ch}` }} />
        <span className="gr-mono" style={{ position: "absolute", right: 10, top: 8, fontSize: 10, color: C.faint }}>log scale — every gridline gap ≈ ×100</span>
      </div>

      {done && <Punchline color={op.ch}>{op.punch}</Punchline>}
      {!running && !done && (
        <div style={{ color: C.faint, fontSize: 13, marginTop: 12 }}>Click an operation to start the race.</div>
      )}
    </div>
  );
}

/* ============================================================
   TOY 2 — THE DISK
   Two identical 7200 RPM drives race for the same data.
   One reads randomly, one sequentially. Slowed 120x.
   ============================================================ */
function drawPlatter(ctx, cx, cy, R, angle, opts) {
  ctx.save();
  ctx.translate(cx, cy);
  // platter
  const grad = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R);
  grad.addColorStop(0, "#22345A"); grad.addColorStop(1, "#101C36");
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = C.line; ctx.stroke();
  // rotation marker lines
  ctx.rotate(angle);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(R * 0.2, 0); ctx.lineTo(R * 0.95, 0);
    ctx.strokeStyle = "#283A5C66"; ctx.stroke();
  }
  ctx.restore();

  // sequential consumed arc
  if (opts.seqArc > 0) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, opts.trackR, angle, angle + opts.seqArc);
    ctx.strokeStyle = C.mem; ctx.lineWidth = 7; ctx.stroke();
    ctx.restore();
  }
  // random target sector
  if (opts.target) {
    ctx.save(); ctx.translate(cx, cy);
    const a = angle + opts.target.angle;
    ctx.beginPath();
    ctx.arc(0, 0, opts.target.r, a - 0.12, a + 0.12);
    ctx.strokeStyle = opts.target.hot ? "#fff" : C.storage; ctx.lineWidth = 7; ctx.stroke();
    ctx.restore();
  }
  // spindle
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.14, 0, Math.PI * 2); ctx.fillStyle = "#0B1426"; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
  // actuator arm: pivot right of platter, head reaches to headR at angle 0 (3 o'clock side)
  const pivotX = cx + R + 26, pivotY = cy + R * 0.85;
  const headX = cx + opts.headR, headY = cy;
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(headX, headY);
  ctx.strokeStyle = "#B9C6DE"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
  ctx.beginPath(); ctx.arc(pivotX, pivotY, 7, 0, Math.PI * 2); ctx.fillStyle = "#B9C6DE"; ctx.fill();
  ctx.beginPath(); ctx.arc(headX, headY, 4.5, 0, Math.PI * 2); ctx.fillStyle = opts.reading ? "#fff" : C.net; ctx.fill();
}

function TheDisk() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ diskMs: 0, randReads: 0, seqMB: 0, phase: "idle", phaseT: 0 });
  const S = useRef(null);

  const reset = () => {
    S.current = {
      angle: 0, diskMs: 0,
      // random drive state machine
      phase: "seek", phaseLeft: 4, // ms of disk time
      headR: 60, targetR: 40 + Math.random() * 60, targetAngle: Math.random() * Math.PI * 2,
      randReads: 0, rotWait: 0,
      // sequential drive
      seqArc: 0, seqMB: 0, seqTrackR: 78,
    };
    setStats({ diskMs: 0, randReads: 0, seqMB: 0, phase: "seek", phaseT: 0 });
  };
  useEffect(reset, []);

  useRaf((dt) => {
    const s = S.current; if (!s) return;
    const SLOW = 120;
    const diskDt = (dt * 1000) / SLOW; // ms of disk time this frame
    s.diskMs += diskDt;
    const w = 2 * Math.PI * 120; // rad per disk-second (7200rpm)
    s.angle = (s.angle + w * (diskDt / 1000)) % (Math.PI * 2);

    // --- random drive state machine ---
    if (s.phase === "seek") {
      s.phaseLeft -= diskDt;
      const p = Math.max(0, s.phaseLeft / 4);
      s.headR = s.headR + (s.targetR - s.headR) * (1 - p) * 0.3 + 0; // ease toward target
      if (s.phaseLeft <= 0) { s.headR = s.targetR; s.phase = "rotwait"; }
    } else if (s.phase === "rotwait") {
      // head sits at angle 0; sector is at angle+targetAngle; read when it passes 0
      const sectorA = (s.angle + s.targetAngle) % (Math.PI * 2);
      if (sectorA < 0.15 || sectorA > Math.PI * 2 - 0.02) { s.phase = "read"; s.phaseLeft = 0.35; }
    } else if (s.phase === "read") {
      s.phaseLeft -= diskDt;
      if (s.phaseLeft <= 0) {
        s.randReads += 1;
        s.targetR = 40 + Math.random() * 60;
        s.targetAngle = Math.random() * Math.PI * 2;
        s.phase = "seek"; s.phaseLeft = 4;
      }
    }
    // --- sequential drive: just keeps reading under the head ---
    s.seqArc = Math.min(Math.PI * 1.9, s.seqArc + w * (diskDt / 1000));
    s.seqMB += 200 * (diskDt / 1000); // 200 MB/s of disk time

    // draw
    const cv = canvasRef.current;
    if (cv) {
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.font = "11px 'IBM Plex Mono', monospace";
      // left: random
      drawPlatter(ctx, 150, 130, 100, s.angle, {
        headR: s.headR, reading: s.phase === "read",
        target: { r: s.targetR, angle: s.targetAngle, hot: s.phase === "read" }, seqArc: 0, trackR: 0,
      });
      ctx.fillStyle = C.storage; ctx.fillText("RANDOM READS", 96, 262);
      ctx.fillStyle = C.faint;
      ctx.fillText(s.phase === "seek" ? "seeking (arm moving)…" : s.phase === "rotwait" ? "waiting for rotation…" : "reading!", 92, 278);
      // right: sequential
      drawPlatter(ctx, 470, 130, 100, s.angle, { headR: s.seqTrackR, reading: true, target: null, seqArc: s.seqArc, trackR: s.seqTrackR });
      ctx.fillStyle = C.mem; ctx.fillText("SEQUENTIAL STREAM", 400, 262);
      ctx.fillStyle = C.faint; ctx.fillText("head never moves — data flows", 392, 278);
    }
    setStats({ diskMs: s.diskMs, randReads: s.randReads, seqMB: s.seqMB, phase: s.phase });
  }, running);

  const randKB = stats.randReads * 4;
  const ratio = randKB > 0 ? (stats.seqMB * 1024) / randKB : 0;

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Two identical 7200 RPM drives, slowed 120× so you can watch. The left one does what a database without
        an index (or a badly designed one) asks: jump to a random sector — swing the arm (~4 ms), then <i>wait
        for the platter to bring the data around</i> (~4 ms average). The right one refuses to move the head and
        just streams. Same hardware. Watch the score.
      </p>
      <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
        <button onClick={() => setRunning(!running)}
          style={{ padding: "10px 22px", borderRadius: 8, background: running ? C.panelUp : C.net, color: running ? C.text : C.bg, border: `1px solid ${running ? C.line : C.net}`, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {running ? "Pause" : stats.diskMs > 0 ? "Resume" : "Start the race"}
        </button>
        <button onClick={() => { setRunning(false); reset(); }}
          style={{ padding: "10px 16px", borderRadius: 8, background: C.panel, color: C.dim, border: `1px solid ${C.line}`, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Reset
        </button>
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 8, overflowX: "auto" }}>
        <canvas ref={canvasRef} width={620} height={290} style={{ width: "100%", maxWidth: 620, display: "block", margin: "0 auto" }} />
      </div>
      <div className="gr-mono" style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, marginTop: 12 }}>
        <span style={{ color: C.dim }}>disk time <b style={{ color: C.text }}>{stats.diskMs.toFixed(0)} ms</b></span>
        <span style={{ color: C.dim }}>random: <b style={{ color: C.storage }}>{stats.randReads} reads</b> ({randKB} KB)</span>
        <span style={{ color: C.dim }}>sequential: <b style={{ color: C.mem }}>{stats.seqMB.toFixed(1)} MB</b></span>
        {ratio > 1 && <span style={{ color: C.compute }}>sequential is winning <b>{Math.round(ratio).toLocaleString()}×</b></span>}
      </div>
      <Punchline color={C.storage}>
        The random drive maxes out near <b>120 reads/second</b> — that number is rotation physics (7200 RPM = 8.3 ms/rev,
        you wait half a spin on average) and cannot be engineered away. The entire modern data stack is built to dodge this:
        B-trees minimize the jumps, LSM-trees & write-ahead logs convert writes into pure appends, and Kafka is fast
        <i> precisely because</i> it's just the right-hand platter with an API. Even on SSDs (no moving parts) the
        sequential-beats-random asymmetry survives — smaller, but it drives the same designs.
      </Punchline>
    </div>
  );
}

/* ============================================================
   TOY 3 — LEAKY BITS
   RAM is billions of leaking buckets, refreshed forever.
   ============================================================ */
const GRID = 96; // 12 x 8
function LeakyBits() {
  const [refreshOn, setRefreshOn] = useState(true);
  const [running, setRunning] = useState(true);
  const [, force] = useState(0);
  const cells = useRef(null);
  const sweepRow = useRef(0);
  const sweepT = useRef(0);
  const readFlash = useRef({});

  const initCells = () =>
    Array.from({ length: GRID }, () => ({
      bit: Math.random() > 0.45 ? 1 : 0,
      level: 0.7 + Math.random() * 0.3,
      rate: 0.03 + Math.random() * 0.05, // charge lost per second (scaled ~1e10 slower than reality)
      corrupt: false,
    }));
  if (!cells.current) cells.current = initCells();

  useRaf((dt) => {
    const cs = cells.current;
    for (const c of cs) {
      if (c.bit === 1 && !c.corrupt) {
        c.level = Math.max(0, c.level - c.rate * dt);
        if (c.level < 0.35) { c.corrupt = true; } // sense amp will now read it wrong
      }
    }
    if (refreshOn) {
      sweepT.current += dt;
      if (sweepT.current > 0.18) { // one row per 180ms -> full sweep ~1.4s ("64 ms", slowed)
        sweepT.current = 0;
        const row = sweepRow.current;
        for (let i = row * 12; i < row * 12 + 12; i++) {
          const c = cs[i];
          if (!c.corrupt && c.bit === 1) c.level = 1; // rewrite charge
          if (c.corrupt) c.level = 0; // refresh faithfully rewrites the WRONG value
        }
        sweepRow.current = (row + 1) % 8;
      }
    }
    force((x) => x + 1);
  }, running);

  const readCell = (i) => {
    const c = cells.current[i];
    // destructive read: dump charge, sense, rewrite
    readFlash.current[i] = performance.now();
    if (!c.corrupt && c.bit === 1) c.level = 1; // sensed correctly -> rewritten full
  };

  const corruptCount = cells.current.filter((c) => c.corrupt).length;

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        This is DRAM: each bit is <b>one transistor and one microscopic capacitor</b>. A charged capacitor is a 1.
        The problem: capacitors leak. Every green bar below is a bit of your data, bleeding away. The only reason
        your RAM holds anything is the <b>refresh sweep</b> — hardware re-reading and re-writing every row, every
        64 ms, forever. Turn it off. (Time slowed ~10 billion× so you can watch; the sweep bar is your memory
        controller doing its eternal chore.)
      </p>
      <div style={{ display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setRefreshOn(!refreshOn)}
          style={{ padding: "10px 18px", borderRadius: 8, background: refreshOn ? C.mem : C.alert, color: C.bg, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Refresh: {refreshOn ? "ON — data survives" : "OFF — watch it die"}
        </button>
        <button onClick={() => { cells.current = initCells(); sweepRow.current = 0; }}
          style={{ padding: "10px 16px", borderRadius: 8, background: C.panel, color: C.dim, border: `1px solid ${C.line}`, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Rewrite all data
        </button>
        <span className="gr-mono" style={{ fontSize: 13, color: corruptCount ? C.alert : C.dim }}>
          bits lost: <b>{corruptCount}</b> / {GRID}
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6 }}>
          {cells.current.map((c, i) => {
            const row = Math.floor(i / 12);
            const sweeping = refreshOn && row === sweepRow.current;
            const col = c.corrupt ? C.alert : c.bit === 0 ? C.faint : c.level > 0.5 ? C.mem : C.compute;
            const flash = readFlash.current[i] && performance.now() - readFlash.current[i] < 350;
            return (
              <div key={i} onClick={() => readCell(i)} title="click to read (read = drain + sense + rewrite)"
                style={{ height: 42, background: C.bg, borderRadius: 4, border: `1px solid ${sweeping ? C.net : flash ? "#fff" : C.line}`, position: "relative", overflow: "hidden", cursor: "pointer" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(c.bit === 0 && !c.corrupt ? 0.06 : c.level) * 100}%`, background: col, opacity: c.corrupt ? 0.8 : 0.9, transition: "height .12s linear" }} />
                {c.corrupt && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>✕</span>}
              </div>
            );
          })}
        </div>
        <div className="gr-mono" style={{ fontSize: 11, color: C.faint, marginTop: 10, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span>green = charged (1) · grey = empty (0) · amber = fading · ✕ = below the sense threshold: data gone</span>
          <span style={{ color: C.net }}>{refreshOn ? `refresh sweep on row ${sweepRow.current + 1}` : "no refresh"}</span>
        </div>
      </div>

      <Punchline color={C.mem}>
        Now the numbers explain themselves. <b>Why ~100 ns?</b> Reading means letting a whisper of charge bleed onto a long
        wire and waiting for a sense amplifier to decide 0-or-1 — then rewriting, because reading <i>destroyed</i> the bit
        (click a cell: that white flash is drain → sense → rewrite). <b>Why is RAM cheap and dense?</b> One transistor +
        one capacitor per bit, vs six transistors for cache SRAM. <b>Why does RAM lose everything at power-off?</b> You just
        watched why. And every database's crash-recovery story — WAL, fsync, replication — exists because the fast tier
        of every system is made of <i>this</i>.
      </Punchline>
    </div>
  );
}

/* ============================================================
   TOY 4 — THE QUEUE
   Why every scale trigger on the cheat sheet says 70-80%.
   ============================================================ */
function TheQueue() {
  const [util, setUtil] = useState(0.6);
  const [, force] = useState(0);
  const S = useRef({ queue: [], busyLeft: 0, waits: [], served: 0, t: 0 });

  const MU = 6; // service rate per second

  useRaf((dt) => {
    const s = S.current;
    s.t += dt;
    // Poisson-ish arrivals
    const lambda = util * MU;
    if (Math.random() < lambda * dt) s.queue.push(s.t);
    // server
    if (s.busyLeft > 0) s.busyLeft -= dt;
    if (s.busyLeft <= 0 && s.queue.length > 0) {
      const arrived = s.queue.shift();
      s.waits.push(s.t - arrived);
      if (s.waits.length > 40) s.waits.shift();
      s.busyLeft = (0.7 + Math.random() * 0.6) / MU; // variable service time — variance is the villain
      s.served++;
    }
    if (s.queue.length > 400) s.queue.length = 400;
    force((x) => x + 1);
  }, true);

  const s = S.current;
  const avgWaitMs = s.waits.length ? (s.waits.reduce((a, b) => a + b, 0) / s.waits.length) * 1000 : 0;
  const theoWait = (rho) => (rho >= 0.995 ? 200 : rho / (1 - rho)) * (1000 / MU); // ms, M/M/1 flavor

  // curve points
  const W = 560, H = 170, PAD = 34;
  const pts = [];
  for (let rho = 0.05; rho <= 0.99; rho += 0.01) {
    const x = PAD + ((rho - 0.05) / 0.94) * (W - PAD - 10);
    const y = H - 22 - Math.min(1, theoWait(rho) / 2500) * (H - 40);
    pts.push(`${x},${y}`);
  }
  const curX = PAD + ((util - 0.05) / 0.94) * (W - PAD - 10);
  const curY = H - 22 - Math.min(1, theoWait(util) / 2500) * (H - 40);

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        One server, requests arriving at random. Intuition says a server at 90% utilization is "fine — it has 10% spare."
        The queue disagrees. Because arrivals are <i>random</i>, they clump — and near full utilization there's no slack
        left to absorb a clump. Drag the slider and watch waiting time, not throughput.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <span className="gr-mono" style={{ fontSize: 13, color: C.dim }}>
            arrival rate: <b style={{ color: util >= 0.8 ? C.alert : C.net, fontSize: 17 }}>{Math.round(util * 100)}%</b> of capacity
          </span>
          <span className="gr-mono" style={{ fontSize: 13, color: C.dim }}>
            avg wait: <b style={{ color: avgWaitMs > 400 ? C.alert : avgWaitMs > 150 ? C.compute : C.ok, fontSize: 17 }}>{avgWaitMs.toFixed(0)} ms</b>
            <span style={{ color: C.faint }}> · in queue: {s.queue.length}</span>
          </span>
        </div>
        <input type="range" min={30} max={98} value={util * 100} onChange={(e) => setUtil(+e.target.value / 100)} style={{ marginTop: 12 }} />

        {/* live queue */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, minHeight: 34 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.busyLeft > 0 ? C.net : C.panelUp, border: `2px solid ${C.net}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: s.busyLeft > 0 ? C.bg : C.dim, fontFamily: "'IBM Plex Mono', monospace" }}>
            {s.busyLeft > 0 ? "BUSY" : "idle"}
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", flex: 1 }}>
            {s.queue.slice(0, 120).map((a, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < 10 ? C.compute : C.alert, opacity: 0.9 }} />
            ))}
            {s.queue.length > 120 && <span className="gr-mono" style={{ fontSize: 11, color: C.alert }}>+{s.queue.length - 120} more</span>}
          </div>
        </div>

        {/* the hockey stick */}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14 }}>
          <line x1={PAD} y1={H - 22} x2={W - 8} y2={H - 22} stroke={C.line} />
          <line x1={PAD} y1={12} x2={PAD} y2={H - 22} stroke={C.line} />
          <polyline points={pts.join(" ")} fill="none" stroke={C.net} strokeWidth={2} />
          {/* 80% marker */}
          <line x1={PAD + ((0.8 - 0.05) / 0.94) * (W - PAD - 10)} y1={12} x2={PAD + ((0.8 - 0.05) / 0.94) * (W - PAD - 10)} y2={H - 22} stroke={C.compute} strokeDasharray="4 4" />
          <text x={PAD + ((0.8 - 0.05) / 0.94) * (W - PAD - 10) + 5} y={24} fill={C.compute} fontSize={11} fontFamily="'IBM Plex Mono', monospace">80% — the knee</text>
          <circle cx={curX} cy={curY} r={6} fill={util >= 0.8 ? C.alert : C.ok} />
          <text x={PAD} y={H - 6} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">utilization →</text>
          <text x={PAD + 4} y={22} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">waiting time (theory: ~1/(1−ρ))</text>
        </svg>
      </div>

      <Punchline color={C.net}>
        Sit at 60% for a while, then drag to 92% and wait ten seconds. <b>Throughput barely changed; waiting exploded.</b>{" "}
        That's the whole secret: delay grows like 1/(1−utilization), a curve with a knee near 80%. Now re-read your cheat
        sheet — CPU &gt; 70%, memory &gt; 80%, throughput near 80% of max — every scale trigger is the same knee, on the
        same curve, for the same reason. And in an interview, "I'd provision to keep steady-state utilization near 60–70%"
        is a sentence that shows you know <i>why</i>, not just <i>what</i>.
      </Punchline>
    </div>
  );
}

/* ============================================================
   SHELL
   ============================================================ */
const TOYS = [
  { id: "light", n: "01", name: "RACE LIGHT", sub: "where latency comes from", comp: RaceLight, ch: C.net },
  { id: "disk", n: "02", name: "THE DISK", sub: "random vs sequential, 1000×", comp: TheDisk, ch: C.storage },
  { id: "dram", n: "03", name: "LEAKY BITS", sub: "what RAM actually is", comp: LeakyBits, ch: C.mem },
  { id: "queue", n: "04", name: "THE QUEUE", sub: "why 80% is the real 100%", comp: TheQueue, ch: C.compute },
];

export default function IntuitionLab() {
  const [toy, setToy] = useState("light");
  const T = TOYS.find((t) => t.id === toy);
  const Comp = T.comp;
  return (
    <div className="gr-root" style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <style>{FONT_CSS}</style>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "18px 20px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>INTUITION LAB</h1>
            <span className="gr-mono" style={{ fontSize: 11.5, color: C.faint }}>numbers don't stick — mechanisms do</span>
          </div>
          <nav style={{ display: "flex", gap: 2, marginTop: 14, flexWrap: "wrap" }}>
            {TOYS.map((t) => (
              <button key={t.id} onClick={() => setToy(t.id)}
                style={{ padding: "10px 14px 12px", background: "transparent", border: "none", borderBottom: `2px solid ${toy === t.id ? t.ch : "transparent"}`, color: toy === t.id ? C.text : C.dim, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, textAlign: "left" }}>
                <div style={{ fontWeight: 600 }}>{t.n} · {t.name}</div>
                <div style={{ fontSize: 10.5, color: toy === t.id ? t.ch : C.faint, marginTop: 2 }}>{t.sub}</div>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ padding: "22px 20px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Comp />
        </div>
      </main>
    </div>
  );
}
