import { useEffect, useRef, useState, type ReactNode } from 'react'
import { C, CH_COLOR } from '../../theme'
import { Bar } from '../../ui/Bar'
import { fmtNum } from '../../ui/fmt'
import { Term } from '../../ui/Term'
import { BREAKER_CAP, CAP, simTick, tickDamage, type Frame, type StackConfig } from '../../engine/capacity'
import { ENCOUNTERS, LAYERS, NODE_META, PATTERNS, RUN, type Encounter, type MapNode } from '../../content/oncall'
import { useScars } from '../../state/scars'

/* ON-CALL — a roguelike run. HP = error budget, gold = cloud budget,
   relics = real patterns, bosses = real failure modes (law L7). */

const PRICE = {
  app: CAP.app.cost,
  cache: CAP.cache.cost,
  shard: CAP.db.cost,
  replica: CAP.replica.cost,
  queue: CAP.queue.cost,
  worker: CAP.worker.cost,
}

interface DraftOption {
  kind: 'pat' | 'gold'
  k?: string
  amt?: number
}

interface GameState {
  phase: 'map' | 'encounter' | 'shop' | 'rest' | 'event'
  layer: number
  node: MapNode | null
  hp: number
  gold: number
  cfg: StackConfig
  pats: string[]
  draft: DraftOption[] | null
  over: { win: boolean; why?: string } | null
}

const freshGame = (): GameState => ({
  phase: 'map',
  layer: 0,
  node: null,
  hp: RUN.startHp,
  gold: RUN.startGold,
  cfg: { app: 2, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 },
  pats: [],
  draft: null,
  over: null,
})

/** One encounter tick through the shared engine, with pattern effects applied. */
export function oncallTick(cfg: StackConfig, enc: Encounter, t: number, pats: string[], backlog: number): Frame {
  const m = enc.mod ? enc.mod(t) ?? {} : {}
  const ramp = Math.min(1, t / 6)
  const rps0 = enc.rps * ramp * (m.rpsMult ?? 1)
  let reads = rps0 * enc.readPct
  const writes = rps0 * (1 - enc.readPct) * (m.writeMult ?? 1)
  if (pats.includes('cdn')) reads *= RUN.cdnReadMult

  const effCfg: StackConfig =
    pats.includes('cdn') && cfg.cache > 0 ? { ...cfg, hitRate: Math.min(0.95, cfg.hitRate + RUN.cdnHitBonus) } : cfg

  return simTick(effCfg, reads, writes, backlog, {
    hitRateOverride: m.hitZero ? 0 : undefined,
    hitRateCap: m.hitCap,
    appCount: pats.includes('autoscale') && rps0 > RUN.autoscaleTrigger * enc.rps ? cfg.app + RUN.autoscaleBonus : undefined,
    drainMult: cfg.workers >= RUN.workerSynergyCount ? RUN.workerSynergyMult : 1,
  })
}

export default function OnCall() {
  const addScar = useScars((s) => s.addScar)
  const [g, setG] = useState<GameState>(freshGame)
  const [tick, setTick] = useState(-1)
  const [frame, setFrame] = useState<Frame | null>(null)
  const [encDmg, setEncDmg] = useState(0)
  const [result, setResult] = useState<{ dmg: number; lagNote: boolean; reward: number; boss: boolean } | null>(null)
  const backlogRef = useRef(0)
  const dmgRef = useRef(0)
  const histRef = useRef<Frame[]>([])

  const enc = g.node?.enc ? ENCOUNTERS[g.node.enc] : null
  const upd = (patch: Partial<GameState>) => setG((s) => ({ ...s, ...patch }))

  /* ---- encounter runner ---- */
  useEffect(() => {
    if (tick < 0 || !enc) return
    if (tick > enc.ticks) {
      const capped = g.pats.includes('breaker') ? Math.min(BREAKER_CAP, dmgRef.current) : dmgRef.current
      const dmg = Math.round(capped)
      const strandedLag = histRef.current.length ? histRef.current[histRef.current.length - 1].backlog : 0
      const extraLag = strandedLag > RUN.strandedLagThreshold ? RUN.strandedLagDamage : 0
      const total = dmg + extraLag
      const hp = g.hp - total
      if (total >= 20 || hp <= 0)
        addScar({
          mode: 'oncall',
          theme: enc.name.replace('ELITE · ', '').replace('BOSS · ', ''),
          what: `${g.cfg.app} app · ${g.cfg.cache} cache · ${g.cfg.shards} shard(s) · ${g.cfg.replicas} repl${g.cfg.queue ? ` · queue+${g.cfg.workers}w` : ''}`,
          truth: `−${total} error budget${extraLag ? ' (incl. stranded backlog)' : ''}`,
          lesson: enc.secret ?? 'The stack had no headroom for this traffic shape — buy capacity or buy time before taking it.',
        })
      if (hp <= 0) {
        upd({ hp: 0, over: { win: false, why: `${enc.name} burned through your remaining error budget. Users lost faith.` } })
      } else {
        const reward = enc.boss ? 0 : enc.elite ? RUN.eliteReward : RUN.fightReward
        setResult({ dmg: total, lagNote: extraLag > 0, reward, boss: !!enc.boss })
        upd({ hp })
      }
      setTick(-1)
      return
    }
    const id = setTimeout(() => {
      const f = oncallTick(g.cfg, enc, tick, g.pats, backlogRef.current)
      backlogRef.current = f.backlog
      dmgRef.current += tickDamage(f, enc.target, { idem: g.pats.includes('idem'), degrade: g.pats.includes('degrade') })
      histRef.current.push(f)
      setFrame(f)
      setEncDmg(Math.round(g.pats.includes('breaker') ? Math.min(BREAKER_CAP, dmgRef.current) : dmgRef.current))
      setTick(tick + 1)
    }, 150)
    return () => clearTimeout(id)
  }, [tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const startEnc = () => {
    backlogRef.current = 0
    dmgRef.current = 0
    histRef.current = []
    setEncDmg(0)
    setResult(null)
    setFrame(null)
    setTick(0)
  }

  const finishNode = (extra: Partial<GameState> = {}) => {
    const nextLayer = g.layer + 1
    if (nextLayer >= LAYERS.length) {
      upd({ over: { win: true }, ...extra })
      return
    }
    upd({ phase: 'map', layer: nextLayer, node: null, ...extra })
    setFrame(null)
    setResult(null)
  }

  const makeDraft = (): DraftOption[] => {
    const pool = Object.keys(PATTERNS).filter((k) => !g.pats.includes(k))
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, 2)
    return [...picks.map((k) => ({ kind: 'pat' as const, k })), { kind: 'gold' as const, amt: RUN.draftGold }]
  }

  const buy = (k: 'app' | 'cache' | 'shards' | 'replicas' | 'workers' | 'queue', price: number) => {
    if (g.gold < price) return
    if (k === 'queue') upd({ gold: g.gold - price, cfg: { ...g.cfg, queue: true } })
    else upd({ gold: g.gold - price, cfg: { ...g.cfg, [k]: g.cfg[k] + 1 } })
  }
  const sell = (k: 'app' | 'cache' | 'shards' | 'replicas' | 'workers' | 'queue', price: number) => {
    const refund = Math.round(price * RUN.sellRefund)
    if (k === 'queue') upd({ gold: g.gold + refund, cfg: { ...g.cfg, queue: false } })
    else upd({ gold: g.gold + refund, cfg: { ...g.cfg, [k]: g.cfg[k] - 1 } })
  }

  /* ---------------- screens ---------------- */
  const header = (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', padding: '4px 0 14px', borderBottom: `1px solid ${C.line}`, marginBottom: 16 }}>
      <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>ON-CALL</h1>
      <span className="mono" style={{ fontSize: 12, color: C.dim }}>
        node {Math.min(g.layer + 1, LAYERS.length)}/{LAYERS.length}
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
      <div style={{ display: 'flex', gap: 6 }}>
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

  if (g.over) {
    const w = g.over.win
    return (
      <div>
        {header}
        <div style={{ maxWidth: 620, margin: '40px auto', textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: w ? C.ok : C.alert }}>
            {w ? 'YOU SURVIVED TO IPO' : 'PAGED OUT'}
          </div>
          <p style={{ color: C.dim, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            {w
              ? `The Thundering Herd came, resent everything, and your system held. Final error budget: ${g.hp}/100 with $${g.gold} unspent.`
              : g.over.why}
          </p>
          {g.pats.length > 0 && (
            <div style={{ textAlign: 'left', background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 20 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 10 }}>
                PATTERNS YOU NOW KNOW — THESE ARE REAL
              </div>
              {g.pats.map((k) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <span style={{ color: C.net, fontWeight: 600, fontSize: 13.5 }}>
                    {PATTERNS[k].icon} {PATTERNS[k].name}
                  </span>
                  <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{PATTERNS[k].irl}</div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setG(freshGame())
              setFrame(null)
              setResult(null)
            }}
            style={{ marginTop: 22, padding: '12px 28px', background: C.net, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            New run
          </button>
        </div>
      </div>
    )
  }

  if (g.phase === 'map') {
    return (
      <div>
        {header}
        <p style={{ color: C.dim, fontSize: 13.5, maxWidth: 640 }}>
          Your route to IPO. Choose your path when it forks — elites hit harder but pay better. Your error budget does not
          regenerate on its own: spend it wisely, defend it fiercely.
        </p>
        <div style={{ maxWidth: 560, margin: '18px auto' }}>
          {LAYERS.map((layer, li) => (
            <div key={li} style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 10, opacity: li < g.layer ? 0.35 : 1 }}>
              {layer.map((node, ni) => {
                const meta = NODE_META[node.kind]
                const metaCol = C[meta.colKey]
                const active = li === g.layer
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
          ))}
        </div>
      </div>
    )
  }

  if (g.phase === 'rest') {
    return (
      <div>
        {header}
        <Card title="SPRINT BREAK" col={C.mem}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>A quiet week. The pager is silent. You can invest it one way:</p>
          <Choice
            onClick={() => finishNode({ hp: Math.min(100, g.hp + RUN.restHp) })}
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

  if (g.phase === 'event') {
    return (
      <div>
        {header}
        <Card title="PAGE AT 3AM" col={C.compute}>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            A schema migration must run before the next launch, and it takes a table lock. The safe way costs money; the fast way
            costs trust. (This exact tradeoff has ruined a thousand real Tuesdays.)
          </p>
          <Choice
            onClick={() => finishNode({ hp: Math.max(1, g.hp - RUN.eventHpCost) })}
            title={`Run it live tonight · error budget −${RUN.eventHpCost}`}
            sub="The lock stalls writes for 40 seconds. Some users see errors. It's over quickly."
          />
          <Choice
            disabled={g.gold < RUN.eventGoldCost}
            onClick={() => finishNode({ gold: g.gold - RUN.eventGoldCost })}
            title={`Blue-green migration · −$${RUN.eventGoldCost}`}
            sub="Stand up a copy, migrate it, switch traffic over. Zero user impact — paid for in cloud bills."
          />
        </Card>
      </div>
    )
  }

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
            onClick={() => upd({ hp: Math.min(100, g.hp + RUN.shopHealAmount), gold: g.gold - RUN.shopHealCost })}
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

  /* encounter */
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
            <button
              disabled={running || (!g.cfg.queue && g.gold < PRICE.queue)}
              onClick={() => (g.cfg.queue ? sell('queue', PRICE.queue) : buy('queue', PRICE.queue))}
              style={{
                padding: '3px 11px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 600,
                background: g.cfg.queue ? C.net : C.bg,
                color: g.cfg.queue ? C.bg : C.dim,
                border: `1px solid ${g.cfg.queue ? C.net : C.line}`,
              }}
            >
              {g.cfg.queue ? 'ON' : 'OFF'}
            </button>
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
          <button
            onClick={startEnc}
            disabled={running || !!result}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '11px 0',
              background: running ? C.line : C.alert,
              color: running ? C.dim : '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: running ? 'default' : 'pointer',
            }}
          >
            {running ? `t=${tick}/${enc.ticks}` : result ? 'Survived' : enc.boss ? 'FACE THE HERD' : 'Take the traffic'}
          </button>
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
              {!result.boss ? (
                !g.draft ? (
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
                )
              ) : (
                <button
                  onClick={() => upd({ over: { win: true } })}
                  style={{ marginTop: 12, padding: '10px 20px', background: C.ok, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Ring the bell 🔔
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- local atoms ---------------- */
function Card({ title, col, children }: { title: string; col: string; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 620, margin: '20px auto', background: C.panel, border: `1px solid ${col}55`, borderRadius: 12, padding: 20 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, color: col, marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Choice({ title, sub, onClick, disabled }: { title: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: C.panelUp,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        padding: '11px 14px',
        marginTop: 10,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? C.faint : C.text,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: C.dim, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
    </button>
  )
}

function Step({
  label,
  val,
  canDec,
  canInc,
  onDec,
  onInc,
  col,
  price,
}: {
  label: string
  val: number
  canDec: boolean
  canInc: boolean
  onDec: () => void
  onInc: () => void
  col: string
  price: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 12.5 }}>
        {label}{' '}
        <span className="mono" style={{ color: C.gold, fontSize: 11 }}>
          ${price}
        </span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          disabled={!canDec}
          onClick={onDec}
          aria-label={`sell ${label}`}
          style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, color: canDec ? C.text : C.faint, border: `1px solid ${C.line}`, cursor: canDec ? 'pointer' : 'default', fontSize: 14 }}
        >
          −
        </button>
        <span className="mono" style={{ minWidth: 20, textAlign: 'center', color: col, fontWeight: 600, fontSize: 13 }}>
          {val}
        </span>
        <button
          disabled={!canInc}
          onClick={onInc}
          aria-label={`buy ${label}`}
          style={{ width: 24, height: 24, borderRadius: 6, background: C.bg, color: canInc ? C.text : C.faint, border: `1px solid ${C.line}`, cursor: canInc ? 'pointer' : 'default', fontSize: 14 }}
        >
          +
        </button>
      </div>
    </div>
  )
}
