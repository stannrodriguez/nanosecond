import { useState } from 'react'
import { C, CH_COLOR } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { Bar } from '../../ui/Bar'
import { Stepper } from '../../ui/Stepper'
import { Term as T } from '../../ui/Term'
import { Panel, Eyebrow, Button, Chip } from '../../ui/kit'
import { useTickRunner } from '../../ui/useTickRunner'
import { fmtNum } from '../../ui/fmt'
import { diagnoseTiers, simTick, stackCost, type Frame, type StackConfig } from '../../engine/capacity'
import { SCENARIOS, SCENARIO_TICKS } from '../../content/scenarios'
import { useScars } from '../../state/scars'
import { useProgress } from '../../state/progress'
import { LockedPart } from '../../ui/LockedPart'

interface Verdict {
  pass: boolean
  checks: { name: string; pass: boolean; detail: string }[]
  diagnosis: string[]
}

const DEFAULT_CFG: StackConfig = { app: 2, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 }

export default function Builder() {
  const addScar = useScars((s) => s.addScar)
  const forged = useProgress((s) => s.forged)
  const isForged = (c: string) => !!forged[c]
  const [scIdx, setScIdx] = useState(0)
  const [stage, setStage] = useState<'brief' | 'build'>('brief')
  const sc = SCENARIOS[scIdx]
  const [cfg, setCfg] = useState<StackConfig>(DEFAULT_CFG)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  // The Forge: a component you haven't forged isn't deployable — clamp it to its
  // baseline so neither the sim nor the cost can spend what's still locked.
  const lockCfg = (c: StackConfig): StackConfig => ({
    ...c,
    cache: isForged('cache') ? c.cache : 0,
    replicas: isForged('replicas') ? c.replicas : 0,
    shards: isForged('shards') ? c.shards : 1,
    queue: isForged('queue') ? c.queue : false,
    workers: isForged('workers') ? c.workers : 1,
  })
  const eff = lockCfg(cfg)
  const cost = stackCost(eff)

  const runner = useTickRunner<Frame>({
    ticks: SCENARIO_TICKS + 1, // frames for t = 0..SCENARIO_TICKS
    intervalMs: 160,
    step: (t, frames) => {
      const mult = sc.profile(t)
      const prevBacklog = frames.length ? frames[frames.length - 1].backlog : 0
      return simTick(eff, sc.rps * mult * sc.readPct, sc.rps * mult * (1 - sc.readPct), prevBacklog)
    },
    onDone: (frames) => {
      const worstP99 = Math.max(...frames.map((f) => f.p99))
      const worstErr = Math.max(...frames.map((f) => f.errRate))
      const endLag = frames[frames.length - 1].backlog
      const checks = [
        { name: `p99 ≤ ${sc.p99Target} ms`, pass: worstP99 <= sc.p99Target, detail: `worst p99: ${worstP99.toFixed(0)} ms` },
        { name: 'error rate ≤ 0.5%', pass: worstErr <= 0.005, detail: `worst: ${(worstErr * 100).toFixed(1)}%` },
        { name: `cost ≤ $${sc.budget}/mo`, pass: cost <= sc.budget, detail: `$${cost}/mo` },
        ...(eff.queue
          ? [
              {
                name: 'backlog drained by end',
                pass: endLag < 1000,
                detail: endLag >= 1000 ? `${fmtNum(endLag)} msgs stranded — drain < intake` : 'clean',
              },
            ]
          : []),
      ]
      const pass = checks.every((c) => c.pass)
      const diagnosis = diagnoseTiers(frames)
      if (pass && cost < sc.budget * 0.75)
        diagnosis.push(
          `Passed with $${sc.budget - cost}/mo to spare. Interview move: name your headroom on purpose — "I'm at ~65% utilization to absorb 1.5× bursts."`,
        )
      setVerdict({ pass, checks, diagnosis })
      if (!pass)
        addScar({
          mode: 'builder',
          theme: sc.name,
          what: `${eff.app} app · ${eff.cache} cache · ${eff.shards} shard(s) · ${eff.replicas} repl${eff.queue ? ` · queue+${eff.workers}w` : ''} ($${cost})`,
          truth: checks
            .filter((c) => !c.pass)
            .map((c) => `${c.name} — ${c.detail}`)
            .join('; '),
          lesson: diagnosis[0] ?? 'The architecture did not fit the story — re-read the translate table.',
        })
    },
  })
  const { running, tick, frame } = runner

  const set = (k: keyof StackConfig) => (v: number | boolean) => {
    setCfg((c) => ({ ...c, [k]: v }))
    setVerdict(null)
    runner.reset()
  }
  const pick = (i: number) => {
    setScIdx(i)
    setStage('brief')
    setVerdict(null)
    runner.reset()
  }
  const start = () => {
    setVerdict(null)
    runner.start()
  }

  return (
    <div>
      <ModeHeader title="THE BUILDER" thesis="learn it, then survive it · briefing → build → break" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SCENARIOS.map((s, i) => (
          <Chip key={s.name} active={i === scIdx} onClick={() => pick(i)} mono={false} style={{ padding: '8px 14px', fontSize: 13 }}>
            {s.name}
          </Chip>
        ))}
      </div>

      {/* ---- BRIEFING (law L2: brief before test) ---- */}
      <Panel pad={0} style={{ padding: '16px 18px', marginBottom: 16 }}>
        <Eyebrow color={C.net} style={{ marginBottom: 8 }}>
          BRIEFING — READ THE STORY, THEN WATCH IT BECOME NUMBERS
        </Eyebrow>
        <div style={{ fontSize: 14.5, lineHeight: 1.65 }}>{sc.story}</div>

        <div style={{ marginTop: 14 }}>
          <Eyebrow color={C.compute} style={{ marginBottom: 6 }}>
            TRANSLATE THE STORY INTO NUMBERS (the core interview skill)
          </Eyebrow>
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
              <Eyebrow color={C.mem} style={{ marginBottom: 6 }}>
                THINK BEFORE YOU BUILD
              </Eyebrow>
              {sc.think.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13.5, lineHeight: 1.55 }}>
                  <span className="mono" style={{ color: C.mem }}>
                    {i + 1}.
                  </span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
            <Button size="lg" style={{ marginTop: 10 }} onClick={() => setStage('build')}>
              I've thought about it — open the workbench
            </Button>
          </>
        ) : (
          <div className="mono" style={{ fontSize: 12, color: C.dim, marginTop: 12 }}>
            target: peak {fmtNum(sc.rps)} req/s · {Math.round(sc.readPct * 100)}% reads · <T k="p99">p99</T> ≤ {sc.p99Target} ms ·
            budget ${sc.budget}/mo
          </div>
        )}
      </Panel>

      {/* ---- WORKBENCH ---- */}
      {stage === 'build' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 16, alignItems: 'start' }}>
          <Panel>
            <Eyebrow style={{ marginBottom: 6 }}>YOUR ARCHITECTURE</Eyebrow>
            <Stepper label={<><T k="appserver">App servers</T> · $150 · 10k rps</>} val={cfg.app} set={(v) => set('app')(v)} min={1} max={12} col={C.compute} />
            {isForged('cache') ? (
              <Stepper label={<><T k="cache">Cache nodes</T> · $200 · 100k ops</>} val={cfg.cache} set={(v) => set('cache')(v)} min={0} max={6} col={C.mem} />
            ) : (
              <LockedPart component="cache" price={200} />
            )}
            {isForged('cache') && cfg.cache > 0 && (
              <div style={{ padding: '8px 0', borderBottom: `1px solid ${C.line}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: C.dim }}>
                    <T k="hitrate">hit rate</T> (depends on the story!)
                  </span>
                  <span className="mono" style={{ color: C.mem }}>
                    {Math.round(cfg.hitRate * 100)}%
                  </span>
                </div>
                <input type="range" min={50} max={95} value={cfg.hitRate * 100} onChange={(e) => set('hitRate')(+e.target.value / 100)} aria-label="cache hit rate" />
              </div>
            )}
            {isForged('shards') ? (
              <Stepper label={<><T k="shard">DB shards</T> · $600 · 10k w/s</>} val={cfg.shards} set={(v) => set('shards')(v)} min={1} max={4} col={C.storage} />
            ) : (
              <LockedPart component="shards" price={600} />
            )}
            {isForged('replicas') ? (
              <Stepper label={<><T k="replica">Read replicas</T> · $400 · 20k r/s</>} val={cfg.replicas} set={(v) => set('replicas')(v)} min={0} max={6} col={C.storage} />
            ) : (
              <LockedPart component="replicas" price={400} />
            )}
            {isForged('queue') ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: cfg.queue ? `1px solid ${C.line}` : 'none' }}>
                <span style={{ fontSize: 13 }}>
                  <T k="queue">Write queue</T> · $300
                </span>
                <Chip active={cfg.queue} onClick={() => set('queue')(!cfg.queue)} style={{ padding: '4px 12px', borderRadius: 6 }}>
                  {cfg.queue ? 'ON' : 'OFF'}
                </Chip>
              </div>
            ) : (
              <LockedPart component="queue" price={300} />
            )}
            {isForged('queue') && cfg.queue &&
              (isForged('workers') ? (
                <Stepper label={<><T k="worker">Workers</T> · $100 · 5k w/s</>} val={cfg.workers} set={(v) => set('workers')(v)} min={1} max={8} col={C.net} />
              ) : (
                <LockedPart component="workers" price={100} />
              ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'baseline' }}>
              <Eyebrow style={{ fontSize: 11 }}>MONTHLY COST</Eyebrow>
              <span className="mono" style={{ fontSize: 18, fontWeight: 600, color: cost > sc.budget ? C.alert : C.ok }}>
                ${cost}
              </span>
            </div>
            <Button size="lg" full disabled={running} onClick={start} style={{ marginTop: 12 }}>
              {running ? `Running… t=${tick}/${SCENARIO_TICKS}` : 'Run scenario'}
            </Button>
          </Panel>

          <Panel style={{ minHeight: 280 }}>
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
                    <Eyebrow color={C.compute} style={{ marginBottom: 6 }}>
                      POST-MORTEM
                    </Eyebrow>
                    {verdict.diagnosis.map((d, i) => (
                      <div key={i} style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 6 }}>
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
