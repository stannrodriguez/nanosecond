import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, CH_COLOR } from '../../theme'
import { Bar } from '../../ui/Bar'
import { fmtNum } from '../../ui/fmt'
import { Term } from '../../ui/Term'
import { Button, Chip, GhostButton } from '../../ui/kit'
import { useTickRunner } from '../../ui/useTickRunner'
import { type Frame } from '../../engine/capacity'
import {
  ACTS,
  ENCOUNTERS,
  EVENTS,
  NODE_META,
  PATTERNS,
  RUN,
  RUN_LAYERS,
  type EventChoice,
} from '../../content/oncall'
import { useScars } from '../../state/scars'
import { bestScore, useOnCallRun, type RunSummary } from '../../state/oncallRun'
import { encounterDamage, freshGame, oncallTick, PRICE, type GameState } from './engine'
import { ThisActuallyHappened } from '../../ui/ThisActuallyHappened'
import { Card, Choice, Step } from './atoms'
import { Recap } from './Recap'

/* ON-CALL — a roguelike run across three acts. HP = error budget, gold = cloud
   budget, relics = real patterns, bosses = real failure modes (law L7). */

const clampHp = (n: number) => Math.max(0, Math.min(100, n))

export { oncallTick, encounterDamage } from './engine'

export default function OnCall() {
  const navigate = useNavigate()
  const addScar = useScars((s) => s.addScar)
  const saveActive = useOnCallRun((s) => s.saveActive)
  const finishRun = useOnCallRun((s) => s.finishRun)
  const history = useOnCallRun((s) => s.history)

  const [g, setG] = useState<GameState>(() => useOnCallRun.getState().active ?? freshGame())
  const [result, setResult] = useState<{ dmg: number; lagNote: boolean; reward: number; boss: boolean } | null>(null)
  const [summary, setSummary] = useState<RunSummary | null>(null)

  // Persist the active run; record it once when it ends.
  useEffect(() => {
    if (g.over) {
      if (!summary) setSummary(finishRun(g))
    } else {
      saveActive(g)
    }
  }, [g, summary, finishRun, saveActive])

  const enc = g.node?.enc ? ENCOUNTERS[g.node.enc] : null
  const upd = (patch: Partial<GameState>) => setG((s) => ({ ...s, ...patch }))
  const isFinalLayer = g.layer === RUN_LAYERS.length - 1

  /* ---- encounter runner (shared tick loop) ---- */
  const runner = useTickRunner<Frame>({
    ticks: enc ? enc.ticks + 1 : 0,
    intervalMs: 150,
    step: (t, frames) => {
      const prevBacklog = frames.length ? frames[frames.length - 1].backlog : 0
      return oncallTick(g.cfg, enc!, t, g.pats, prevBacklog)
    },
    onDone: (frames) => {
      if (!enc) return
      const { dmg, strandedLag } = encounterDamage(frames, enc, g.pats)
      const total = Math.round(dmg) + strandedLag
      const hp = g.hp - total
      if (total >= 20 || hp <= 0)
        addScar({
          mode: 'oncall',
          theme: enc.name.replace('ELITE · ', '').replace('BOSS · ', ''),
          what: `${g.cfg.app} app · ${g.cfg.cache} cache · ${g.cfg.shards} shard(s) · ${g.cfg.replicas} repl${g.cfg.queue ? ` · queue+${g.cfg.workers}w` : ''}`,
          truth: `−${total} error budget${strandedLag ? ' (incl. stranded backlog)' : ''}`,
          lesson: enc.secret ?? 'The stack had no headroom for this traffic shape — buy capacity or buy time before taking it.',
        })
      if (hp <= 0) {
        upd({ hp: 0, over: { win: false, why: `${enc.name} burned through your remaining error budget. Users lost faith.` } })
      } else {
        const reward = enc.boss ? 0 : enc.elite ? RUN.eliteReward : RUN.fightReward
        setResult({ dmg: total, lagNote: strandedLag > 0, reward, boss: !!enc.boss })
        upd({ hp })
      }
    },
  })
  const { tick, frame, frames } = runner
  const encDmg = enc ? Math.round(encounterDamage(frames, enc, g.pats).dmg) : 0

  const startEnc = () => {
    setResult(null)
    runner.start()
  }

  /** Advance past the current node; increments actsCleared when the finished
   *  layer was the last of its act (i.e. a boss just fell). */
  const finishNode = (extra: Partial<GameState> = {}) => {
    const cur = RUN_LAYERS[g.layer]
    const next = RUN_LAYERS[g.layer + 1]
    const clearedAct = !next || next.act !== cur.act
    const actsCleared = clearedAct ? cur.act + 1 : g.actsCleared
    if (!next) {
      upd({ over: { win: true }, actsCleared, ...extra })
      return
    }
    upd({ phase: 'map', layer: g.layer + 1, node: null, actsCleared, ...extra })
    runner.reset()
    setResult(null)
  }

  const makeDraft = () => {
    const pool = Object.keys(PATTERNS).filter((k) => !g.pats.includes(k))
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, 2)
    return [...picks.map((k) => ({ kind: 'pat' as const, k })), { kind: 'gold' as const, amt: RUN.draftGold }]
  }

  type Buyable = 'app' | 'cache' | 'shards' | 'replicas' | 'workers' | 'queue'
  const buy = (k: Buyable, price: number) => {
    if (g.gold < price) return
    if (k === 'queue') upd({ gold: g.gold - price, cfg: { ...g.cfg, queue: true } })
    else upd({ gold: g.gold - price, cfg: { ...g.cfg, [k]: g.cfg[k] + 1 } })
  }
  const sell = (k: Buyable, price: number) => {
    const refund = Math.round(price * RUN.sellRefund)
    if (k === 'queue') upd({ gold: g.gold + refund, cfg: { ...g.cfg, queue: false } })
    else upd({ gold: g.gold + refund, cfg: { ...g.cfg, [k]: g.cfg[k] - 1 } })
  }

  const newRun = () => {
    setG(freshGame())
    runner.reset()
    setResult(null)
    setSummary(null)
  }

  /* ---------------- header ---------------- */
  const curAct = RUN_LAYERS[Math.min(g.layer, RUN_LAYERS.length - 1)].act
  const header = (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', padding: '4px 0 14px', borderBottom: `1px solid ${C.line}`, marginBottom: 16 }}>
      <GhostButton onClick={() => navigate('/practice')}>← practice</GhostButton>
      <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>ON-CALL</h1>
      <span className="mono" style={{ fontSize: 12, color: C.dim }}>
        act {curAct + 1}/{ACTS.length}
      </span>
      <span className="mono" style={{ fontSize: 12, color: C.faint }}>
        node {Math.min(g.layer + 1, RUN_LAYERS.length)}/{RUN_LAYERS.length}
      </span>
      <span className="mono" style={{ fontSize: 13 }}>
        <span style={{ color: C.faint }}>
          <Term k="errorbudget">error budget</Term>{' '}
        </span>
        <b style={{ color: g.hp > 50 ? C.ok : g.hp > 25 ? C.compute : C.alert }}>{g.hp}</b>
        <span style={{ color: C.faint }}>/100</span>
      </span>
      <div style={{ width: 110, height: 8, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${g.hp}%`, background: g.hp > 50 ? C.ok : g.hp > 25 ? C.compute : C.alert, transition: 'width .3s' }} />
      </div>
      <span className="mono" style={{ fontSize: 13, color: C.gold }}>
        ${g.gold}
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {g.pats.map((k) => (
          <span
            key={k}
            title={`${PATTERNS[k].name}: ${PATTERNS[k].fx}`}
            className="mono"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: C.panelUp,
              border: `1px solid ${C.net}55`,
              color: C.net,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              cursor: 'help',
            }}
          >
            {PATTERNS[k].icon}
          </span>
        ))}
      </div>
    </div>
  )

  /* ---------------- end of run ---------------- */
  if (g.over && summary) {
    const killer = g.node?.enc ? ENCOUNTERS[g.node.enc] : null
    return (
      <div>
        {header}
        <Recap g={g} summary={summary} happened={killer?.happened ?? []} best={bestScore(history)} onNew={newRun} />
      </div>
    )
  }

  /* ---------------- map ---------------- */
  if (g.phase === 'map') {
    const act = ACTS[curAct]
    const actStart = RUN_LAYERS.findIndex((e) => e.act === curAct)
    return (
      <div>
        {header}
        <div style={{ maxWidth: 640 }}>
          <div className="mono" style={{ fontSize: 12, letterSpacing: 2, color: C.storage }}>
            {act.name}
          </div>
          <p style={{ color: C.dim, fontSize: 13.5, margin: '6px 0 0' }}>{act.tagline}</p>
        </div>
        <div style={{ maxWidth: 560, margin: '18px auto' }}>
          {act.layers.map((layer, lj) => {
            const gLayer = actStart + lj
            const active = gLayer === g.layer
            return (
              <div key={lj} style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 10, opacity: gLayer < g.layer ? 0.35 : 1 }}>
                {layer.map((node, ni) => {
                  const meta = NODE_META[node.kind]
                  const metaCol = C[meta.colKey]
                  const e = node.enc ? ENCOUNTERS[node.enc] : null
                  return (
                    <button
                      key={ni}
                      disabled={!active}
                      onClick={() =>
                        upd({
                          phase: node.kind === 'fight' || node.kind === 'elite' || node.kind === 'boss' ? 'encounter' : node.kind,
                          node,
                        })
                      }
                      style={{
                        flex: 1,
                        maxWidth: 270,
                        textAlign: 'left',
                        background: active ? C.panelUp : C.panel,
                        border: `1.5px solid ${active ? metaCol : C.line}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        cursor: active ? 'pointer' : 'default',
                        color: C.text,
                        boxShadow: active ? `0 0 14px ${metaCol}33` : 'none',
                      }}
                    >
                      <span className="mono" style={{ color: metaCol, fontSize: 12, fontWeight: 600 }}>
                        {meta.icon} {meta.label}
                      </span>
                      <div style={{ fontSize: 13, marginTop: 3, color: active ? C.text : C.dim }}>
                        {e
                          ? e.name.replace('ELITE · ', '').replace('BOSS · ', '')
                          : node.kind === 'shop'
                            ? 'Buy patterns & capacity'
                            : node.kind === 'rest'
                              ? 'Recover trust or raise funds'
                              : 'Something needs a decision'}
                      </div>
                      {e && (
                        <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>
                          {fmtNum(e.rps)} req/s · {Math.round(e.readPct * 100)}% reads
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ---------------- rest ---------------- */
  if (g.phase === 'rest') {
    return (
      <div>
        {header}
        <Card title="SPRINT BREAK" col={C.mem}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>A quiet week. The pager is silent. You can invest it one way:</p>
          <Choice
            onClick={() => finishNode({ hp: clampHp(g.hp + RUN.restHp) })}
            title={`Reliability sprint · error budget +${RUN.restHp}`}
            sub="Fix the flaky retries, add the missing timeouts. Trust is rebuilt one boring fix at a time."
          />
          <Choice
            onClick={() => finishNode({ gold: g.gold + RUN.restGold })}
            title={`Pitch investors · +$${RUN.restGold}`}
            sub="A crisp demo, a bigger cheque. The reliability debt stays where it is."
          />
        </Card>
      </div>
    )
  }

  /* ---------------- event (data-driven) ---------------- */
  if (g.phase === 'event') {
    const ev = g.node?.event ? EVENTS[g.node.event] : null
    if (!ev) return null
    const apply = (c: EventChoice) =>
      finishNode({ hp: clampHp(g.hp + (c.hp ?? 0)), gold: Math.max(0, g.gold + (c.gold ?? 0)) })
    const line = (c: EventChoice) => {
      const bits: string[] = []
      if (c.hp) bits.push(`error budget ${c.hp > 0 ? '+' : '−'}${Math.abs(c.hp)}`)
      if (c.gold) bits.push(`${c.gold > 0 ? '+' : '−'}$${Math.abs(c.gold)}`)
      return `${c.title} · ${bits.join(' · ')}`
    }
    return (
      <div>
        {header}
        <Card title={ev.title} col={C[ev.col]}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{ev.flavor}</p>
          {ev.choices.map((c, i) => (
            <Choice key={i} disabled={!!c.gold && c.gold < 0 && g.gold < -c.gold} onClick={() => apply(c)} title={line(c)} sub={c.sub} />
          ))}
        </Card>
      </div>
    )
  }

  /* ---------------- shop ---------------- */
  if (g.phase === 'shop') {
    const forSale = Object.keys(PATTERNS).filter((k) => !g.pats.includes(k)).slice(0, 3)
    return (
      <div>
        {header}
        <Card title="VENDOR EXPO" col={C.gold}>
          <p style={{ fontSize: 14, color: C.dim }}>Patterns are permanent for the run. Capacity you can also buy right before any encounter.</p>
          {forSale.map((k) => {
            const p = PATTERNS[k]
            return (
              <Choice
                key={k}
                disabled={g.gold < p.price}
                onClick={() => upd({ pats: [...g.pats, k], gold: g.gold - p.price })}
                title={`${p.icon} ${p.name} · $${p.price}`}
                sub={p.fx}
              />
            )
          })}
          <Choice
            disabled={g.gold < RUN.shopHealCost || g.hp >= 100}
            onClick={() => upd({ hp: clampHp(g.hp + RUN.shopHealAmount), gold: g.gold - RUN.shopHealCost })}
            title={`Incident retro workshop · $${RUN.shopHealCost} · error budget +${RUN.shopHealAmount}`}
            sub="A blameless postmortem turns last week's outage into next week's safeguard."
          />
          <button
            onClick={() => finishNode()}
            style={{ marginTop: 14, padding: '10px 22px', background: C.panelUp, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Leave the expo →
          </button>
        </Card>
      </div>
    )
  }

  /* ---------------- encounter ---------------- */
  if (!enc) return null
  const running = tick >= 0
  const showSecret = !!enc.secret && g.pats.includes('drills')
  return (
    <div>
      {header}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: enc.boss ? C.alert : enc.elite ? C.storage : C.net }}>
          {enc.name}
        </span>
        <span className="mono" style={{ fontSize: 12, color: C.dim }}>
          forecast: {fmtNum(enc.rps)} req/s · {Math.round(enc.readPct * 100)}% reads · p99 ≤ {enc.target}ms
        </span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, margin: '8px 0' }}>{enc.flavor}</p>
      {enc.secret && (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: showSecret ? C.compute : C.faint,
            background: C.panel,
            border: `1px dashed ${showSecret ? C.compute : C.line}`,
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
          }}
        >
          {showSecret
            ? `◎ CHAOS DRILLS INTEL: ${enc.secret}`
            : '??? — monitoring is vague about what this will actually do. (Chaos Drills would tell you.)'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: 16, alignItems: 'start' }}>
        {/* workbench */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.dim, marginBottom: 4 }}>
            STACK · sell refunds {Math.round(RUN.sellRefund * 100)}%
          </div>
          <Step label="App servers" price={PRICE.app} val={g.cfg.app} col={C.compute} canDec={!running && g.cfg.app > 1} canInc={!running && g.gold >= PRICE.app} onDec={() => sell('app', PRICE.app)} onInc={() => buy('app', PRICE.app)} />
          <Step label="Cache nodes" price={PRICE.cache} val={g.cfg.cache} col={C.mem} canDec={!running && g.cfg.cache > 0} canInc={!running && g.gold >= PRICE.cache} onDec={() => sell('cache', PRICE.cache)} onInc={() => buy('cache', PRICE.cache)} />
          <Step label="DB shards" price={PRICE.shard} val={g.cfg.shards} col={C.storage} canDec={!running && g.cfg.shards > 1} canInc={!running && g.gold >= PRICE.shard} onDec={() => sell('shards', PRICE.shard)} onInc={() => buy('shards', PRICE.shard)} />
          <Step label="Read replicas" price={PRICE.replica} val={g.cfg.replicas} col={C.storage} canDec={!running && g.cfg.replicas > 0} canInc={!running && g.gold >= PRICE.replica} onDec={() => sell('replicas', PRICE.replica)} onInc={() => buy('replicas', PRICE.replica)} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: g.cfg.queue ? `1px solid ${C.line}` : 'none' }}>
            <span style={{ fontSize: 12.5 }}>
              Write queue{' '}
              <span className="mono" style={{ color: C.gold, fontSize: 11 }}>
                ${PRICE.queue}
              </span>
            </span>
            <Chip
              active={g.cfg.queue}
              disabled={running || (!g.cfg.queue && g.gold < PRICE.queue)}
              onClick={() => (g.cfg.queue ? sell('queue', PRICE.queue) : buy('queue', PRICE.queue))}
              style={{ padding: '3px 11px', borderRadius: 6, fontSize: 11.5 }}
            >
              {g.cfg.queue ? 'ON' : 'OFF'}
            </Chip>
          </div>
          {g.cfg.queue && (
            <Step label="Workers" price={PRICE.worker} val={g.cfg.workers} col={C.net} canDec={!running && g.cfg.workers > 1} canInc={!running && g.gold >= PRICE.worker} onDec={() => sell('workers', PRICE.worker)} onInc={() => buy('workers', PRICE.worker)} />
          )}
          {g.cfg.queue && g.cfg.workers >= RUN.workerSynergyCount && (
            <div className="mono" style={{ fontSize: 10.5, color: C.net, marginTop: 6 }}>
              ⚡ SYNERGY: {RUN.workerSynergyCount}+ workers → drain ×{RUN.workerSynergyMult}
            </div>
          )}
          {g.cfg.cache > 0 && g.pats.includes('cdn') && (
            <div className="mono" style={{ fontSize: 10.5, color: C.mem, marginTop: 4 }}>
              ⚡ SYNERGY: CDN + cache → hit rate +{Math.round(RUN.cdnHitBonus * 100)}%
            </div>
          )}
          <Button variant="danger" full disabled={running || !!result} onClick={startEnc} style={{ marginTop: 12 }}>
            {running ? `t=${tick}/${enc.ticks}` : result ? 'Survived' : enc.boss ? 'FACE THE BOSS' : 'Take the traffic'}
          </Button>
        </div>

        {/* live view */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, minHeight: 260 }}>
          {!frame && !result && (
            <div style={{ color: C.faint, fontSize: 13.5, lineHeight: 1.6 }}>
              Configure, then take the traffic. Damage to your error budget comes from dropped requests and (unless you degrade
              gracefully) blown p99s.
            </div>
          )}
          {frame && (
            <div>
              <div className="mono" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, marginBottom: 12 }}>
                <span style={{ color: C.dim }}>
                  in <b style={{ color: C.text }}>{fmtNum(frame.rps)}/s</b>
                </span>
                <span style={{ color: C.dim }}>
                  p99 <b style={{ color: frame.p99 > enc.target ? C.alert : C.ok }}>{frame.p99.toFixed(0)}ms</b>
                </span>
                <span style={{ color: C.dim }}>
                  errors <b style={{ color: frame.errRate > 0.005 ? C.alert : C.ok }}>{(frame.errRate * 100).toFixed(1)}%</b>
                </span>
                <span style={{ color: encDmg > 0 ? C.alert : C.dim }}>
                  budget damage <b>−{encDmg}</b>
                </span>
                {frame.backlog > 0 && <span style={{ color: C.compute }}>backlog {fmtNum(frame.backlog)}</span>}
              </div>
              {frame.comps.map((c) => (
                <Bar key={c.id} label={c.label} u={c.u} ch={CH_COLOR[c.ch]} note={c.note} pulsing />
              ))}
            </div>
          )}
          {result && (
            <div style={{ borderTop: frame ? `1px solid ${C.line}` : 'none', paddingTop: 12, marginTop: 6 }}>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: result.dmg > 25 ? C.alert : result.dmg > 0 ? C.compute : C.ok }}>
                {result.dmg === 0 ? 'FLAWLESS — no error budget spent' : `Survived · error budget −${result.dmg}`}
              </div>
              {result.lagNote && (
                <div style={{ fontSize: 12.5, color: C.compute, marginTop: 4 }}>
                  Backlog left stranded in the queue — late data cost you extra trust. Size the drain, not just the intake.
                </div>
              )}
              {!result.boss && (
                <div className="mono" style={{ fontSize: 13, color: C.gold, marginTop: 6 }}>
                  funding +${result.reward}
                </div>
              )}
              {result.boss ? (
                <div style={{ marginTop: 10 }}>
                  {enc.happened && <ThisActuallyHappened ids={enc.happened} />}
                  <button
                    onClick={() => (isFinalLayer ? finishNode() : finishNode({ gold: g.gold + RUN.bossReward }))}
                    style={{ marginTop: 12, padding: '10px 20px', background: C.ok, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                  >
                    {isFinalLayer ? 'Ring the bell 🔔' : `Bank $${RUN.bossReward} & press on →`}
                  </button>
                </div>
              ) : !g.draft ? (
                <button
                  onClick={() => upd({ gold: g.gold + result.reward, draft: makeDraft() })}
                  style={{ marginTop: 12, padding: '10px 20px', background: C.net, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Collect & draft reward
                </button>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 8 }}>
                    CHOOSE ONE
                  </div>
                  {g.draft.map((d, i) =>
                    d.kind === 'pat' ? (
                      <Choice
                        key={i}
                        onClick={() => {
                          upd({ pats: [...g.pats, d.k!], draft: null })
                          finishNode()
                        }}
                        title={`${PATTERNS[d.k!].icon} ${PATTERNS[d.k!].name}`}
                        sub={PATTERNS[d.k!].fx}
                      />
                    ) : (
                      <Choice
                        key={i}
                        onClick={() => {
                          upd({ gold: g.gold + d.amt!, draft: null })
                          finishNode()
                        }}
                        title={`+$${d.amt} funding`}
                        sub="Cash keeps options open. Patterns keep systems up."
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
