import { useEffect, useRef, useState } from 'react'
import { C, CH_COLOR } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { Bar } from '../../ui/Bar'
import { Stepper } from '../../ui/Stepper'
import { Term as T } from '../../ui/Term'
import { fmtNum } from '../../ui/fmt'
import { simTick, stackCost, type Frame, type StackConfig } from '../../engine/capacity'
import { SCENARIOS, SCENARIO_TICKS } from '../../content/scenarios'
import { useScars } from '../../state/scars'

interface Verdict {
  pass: boolean
  checks: { name: string; pass: boolean; detail: string }[]
  diagnosis: string[]
}

const DEFAULT_CFG: StackConfig = { app: 2, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 }

export default function Builder() {
  const addScar = useScars((s) => s.addScar)
  const [scIdx, setScIdx] = useState(0)
  const [stage, setStage] = useState<'brief' | 'build'>('brief')
  const sc = SCENARIOS[scIdx]
  const [cfg, setCfg] = useState<StackConfig>(DEFAULT_CFG)
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const [frame, setFrame] = useState<Frame | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const histRef = useRef<Frame[]>([])
  const backlogRef = useRef(0)
  const cost = stackCost(cfg)

  const set = (k: keyof StackConfig) => (v: number | boolean) => {
    setCfg((c) => ({ ...c, [k]: v }))
    setVerdict(null)
    setFrame(null)
  }
  const pick = (i: number) => {
    setScIdx(i)
    setStage('brief')
    setVerdict(null)
    setFrame(null)
    backlogRef.current = 0
  }

  useEffect(() => {
    if (!running) return
    if (tick > SCENARIO_TICKS) {
      setRunning(false)
      const h = histRef.current
      const worstP99 = Math.max(...h.map((f) => f.p99))
      const worstErr = Math.max(...h.map((f) => f.errRate))
      const endLag = h[h.length - 1].backlog
      const checks = [
        { name: `p99 ≤ ${sc.p99Target} ms`, pass: worstP99 <= sc.p99Target, detail: `worst p99: ${worstP99.toFixed(0)} ms` },
        { name: 'error rate ≤ 0.5%', pass: worstErr <= 0.005, detail: `worst: ${(worstErr * 100).toFixed(1)}%` },
        { name: `cost ≤ $${sc.budget}/mo`, pass: cost <= sc.budget, detail: `$${cost}/mo` },
        ...(cfg.queue
          ? [
              {
                name: 'backlog drained by end',
                pass: endLag < 1000,
                detail: endLag >= 1000 ? `${fmtNum(endLag)} msgs stranded — drain < intake` : 'clean',
              },
            ]
          : []),
      ]
      const diagnosis: string[] = []
      const worst: Record<string, { label: string; u: number; note: string }> = {}
      h.forEach((f) =>
        f.comps.forEach((c) => {
          if (!worst[c.id] || c.u > worst[c.id].u) worst[c.id] = c
        }),
      )
      Object.values(worst).forEach((c) => {
        if (c.u >= 1) diagnosis.push(`${c.label} hit ${(c.u * 100).toFixed(0)}% — beyond capacity, requests queue then die. (${c.note})`)
        else if (c.u >= 0.8)
          diagnosis.push(
            `${c.label} peaked at ${(c.u * 100).toFixed(0)}% — past the ~80% knee, waiting time grows nonlinearly. It held, but one clump of traffic from failing.`,
          )
      })
      if (checks.every((c) => c.pass) && cost < sc.budget * 0.75)
        diagnosis.push(
          `Passed with $${sc.budget - cost}/mo to spare. Interview move: name your headroom on purpose — "I'm at ~65% utilization to absorb 1.5× bursts."`,
        )
      setVerdict({ pass: checks.every((c) => c.pass), checks, diagnosis })
      if (!checks.every((c) => c.pass))
        addScar({
          mode: 'builder',
          theme: sc.name,
          what: `${cfg.app} app · ${cfg.cache} cache · ${cfg.shards} shard(s) · ${cfg.replicas} repl${cfg.queue ? ` · queue+${cfg.workers}w` : ''} ($${cost})`,
          truth: checks.filter((c) => !c.pass).map((c) => `${c.name} — ${c.detail}`).join('; '),
          lesson: diagnosis[0] ?? 'The architecture did not fit the story — re-read the translate table.',
        })
      return
    }
    const id = setTimeout(() => {
      const mult = sc.profile(tick)
      const reads = sc.rps * mult * sc.readPct
      const writes = sc.rps * mult * (1 - sc.readPct)
      const f = simTick(cfg, reads, writes, backlogRef.current)
      backlogRef.current = f.backlog
      histRef.current.push(f)
      setFrame(f)
      setTick(tick + 1)
    }, 160)
    return () => clearTimeout(id)
  }, [running, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    histRef.current = []
    backlogRef.current = 0
    setVerdict(null)
    setTick(0)
    setFrame(null)
    setRunning(true)
  }

  return (
    <div>
      <ModeHeader title="THE BUILDER" thesis="learn it, then survive it · briefing → build → break" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SCENARIOS.map((s, i) => (
          <button
            key={s.name}
            onClick={() => pick(i)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: i === scIdx ? C.net : C.panel,
              color: i === scIdx ? C.bg : C.dim,
              border: `1px solid ${i === scIdx ? C.net : C.line}`,
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* ---- BRIEFING (law L2: brief before test) ---- */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 8 }}>
          BRIEFING — READ THE STORY, THEN WATCH IT BECOME NUMBERS
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{sc.story}</div>

        <div style={{ marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 6 }}>
            TRANSLATE THE STORY INTO NUMBERS (the core interview skill)
          </div>
          {sc.translate.map((r, i) => (
            <div key={i} className="mono" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12.5, padding: '6px 0', borderBottom: `1px solid ${C.line}` }}>
              <span style={{ color: C.dim, flex: '1 1 300px' }}>{r.math}</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{r.out}</span>
            </div>
          ))}
        </div>

        {stage === 'brief' ? (
          <>
            <div style={{ marginTop: 14 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.mem, marginBottom: 6 }}>
                THINK BEFORE YOU BUILD
              </div>
              {sc.think.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13.5, lineHeight: 1.55 }}>
                  <span className="mono" style={{ color: C.mem }}>
                    {i + 1}.
                  </span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStage('build')}
              style={{
                marginTop: 10,
                padding: '11px 22px',
                background: C.net,
                color: C.bg,
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              I've thought about it — open the workbench
            </button>
          </>
        ) : (
          <div className="mono" style={{ fontSize: 12, color: C.dim, marginTop: 12 }}>
            target: peak {fmtNum(sc.rps)} req/s · {Math.round(sc.readPct * 100)}% reads · <T k="p99">p99</T> ≤ {sc.p99Target} ms ·
            budget ${sc.budget}/mo
          </div>
        )}
      </div>

      {/* ---- WORKBENCH ---- */}
      {stage === 'build' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.dim, marginBottom: 6 }}>
              YOUR ARCHITECTURE
            </div>
            <Stepper
              label={<><T k="appserver">App servers</T> · $150 · 10k rps</>}
              val={cfg.app}
              set={(v) => set('app')(v)}
              min={1}
              max={12}
              col={C.compute}
            />
            <Stepper
              label={<><T k="cache">Cache nodes</T> · $200 · 100k ops</>}
              val={cfg.cache}
              set={(v) => set('cache')(v)}
              min={0}
              max={6}
              col={C.mem}
            />
            {cfg.cache > 0 && (
              <div style={{ padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.dim }}>
                    <T k="hitrate">hit rate</T> (depends on the story!)
                  </span>
                  <span className="mono" style={{ color: C.mem }}>
                    {Math.round(cfg.hitRate * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={cfg.hitRate * 100}
                  onChange={(e) => set('hitRate')(+e.target.value / 100)}
                  aria-label="cache hit rate"
                />
              </div>
            )}
            <Stepper
              label={<><T k="shard">DB shards</T> · $600 · 10k w/s</>}
              val={cfg.shards}
              set={(v) => set('shards')(v)}
              min={1}
              max={4}
              col={C.storage}
            />
            <Stepper
              label={<><T k="replica">Read replicas</T> · $400 · 20k r/s</>}
              val={cfg.replicas}
              set={(v) => set('replicas')(v)}
              min={0}
              max={6}
              col={C.storage}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: cfg.queue ? `1px solid ${C.line}` : 'none' }}>
              <span style={{ fontSize: 13 }}>
                <T k="queue">Write queue</T> · $300
              </span>
              <button
                onClick={() => set('queue')(!cfg.queue)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  background: cfg.queue ? C.net : C.bg,
                  color: cfg.queue ? C.bg : C.dim,
                  border: `1px solid ${cfg.queue ? C.net : C.line}`,
                }}
              >
                {cfg.queue ? 'ON' : 'OFF'}
              </button>
            </div>
            {cfg.queue && (
              <Stepper
                label={<><T k="worker">Workers</T> · $100 · 5k w/s</>}
                val={cfg.workers}
                set={(v) => set('workers')(v)}
                min={1}
                max={8}
                col={C.net}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'baseline' }}>
              <span className="mono" style={{ fontSize: 11, color: C.dim }}>
                MONTHLY COST
              </span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: cost > sc.budget ? C.alert : C.ok }}>
                ${cost}
              </span>
            </div>
            <button
              onClick={start}
              disabled={running}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '12px 0',
                background: running ? C.line : C.net,
                color: running ? C.dim : C.bg,
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                cursor: running ? 'default' : 'pointer',
              }}
            >
              {running ? `Running… t=${tick}/${SCENARIO_TICKS}` : 'Run scenario'}
            </button>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, minHeight: 280 }}>
            {!frame && !verdict && (
              <div style={{ color: C.faint, fontSize: 13.5, lineHeight: 1.6, padding: 8 }}>
                Traffic ramps to peak over the run. Bars go amber past 80% <T k="util">utilization</T> — where waiting stops being
                linear — and red at 100%, where requests die. Watch which component gets hot first: that's the story's real
                bottleneck telling on itself.
              </div>
            )}
            {frame && (
              <div>
                <div className="mono" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, marginBottom: 14 }}>
                  <span style={{ color: C.dim }}>
                    in <b style={{ color: C.text }}>{fmtNum(frame.rps)}/s</b>
                  </span>
                  <span style={{ color: C.dim }}>
                    p50 <b style={{ color: C.text }}>{frame.p50.toFixed(0)} ms</b>
                  </span>
                  <span style={{ color: C.dim }}>
                    p99 <b style={{ color: frame.p99 > sc.p99Target ? C.alert : C.ok }}>{frame.p99.toFixed(0)} ms</b>
                  </span>
                  <span style={{ color: C.dim }}>
                    errors <b style={{ color: frame.errRate > 0.005 ? C.alert : C.ok }}>{(frame.errRate * 100).toFixed(1)}%</b>
                  </span>
                  {frame.backlog > 0 && <span style={{ color: C.compute }}>backlog {fmtNum(frame.backlog)}</span>}
                </div>
                {frame.comps.map((c) => (
                  <Bar key={c.id} label={c.label} u={c.u} ch={CH_COLOR[c.ch]} note={c.note} pulsing />
                ))}
              </div>
            )}
            {verdict && (
              <div style={{ marginTop: frame ? 8 : 0, borderTop: frame ? `1px solid ${C.line}` : 'none', paddingTop: frame ? 14 : 0 }}>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: verdict.pass ? C.ok : C.alert, marginBottom: 10 }}>
                  {verdict.pass ? '✓ SYSTEM HELD' : '✗ SYSTEM FAILED'}
                </div>
                {verdict.checks.map((c) => (
                  <div key={c.name} className="mono" style={{ fontSize: 12.5, marginBottom: 5, color: c.pass ? C.dim : C.alert }}>
                    {c.pass ? '✓' : '✗'} {c.name} <span style={{ color: C.faint }}>— {c.detail}</span>
                  </div>
                ))}
                {verdict.diagnosis.length > 0 && (
                  <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 6 }}>
                      POST-MORTEM
                    </div>
                    {verdict.diagnosis.map((d, i) => (
                      <div key={i} style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 6 }}>
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
