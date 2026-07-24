import { useState, type ComponentType } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ModeHeader } from '../../ui/ModeHeader'
import { Eyebrow, LiftCard } from '../../ui/kit'
import { C, CH_COLOR, CH_LABEL, FONT } from '../../theme'
import { TOYS, toyById, type ToyEntry } from '../../content/toys'
import { BRIEFINGS } from '../../content/briefings'
import { FORECASTS } from '../../content/forecasts'
import { STATIONS, stationForToy } from '../../content/journey'
import { floorForToy } from '../../content/stack'
import { COMPONENTS } from '../../content/components'
import { NUMBERS } from '../../content/numbers'
import { conceptForToy, drillsForConcept } from '../../content/concepts'
import { MANUAL } from '../../content/manual'
import { GLOSSARY } from '../../content/glossary'
import { FinePrint } from '../../ui/FinePrint'
import { Term as T } from '../../ui/Term'
import { useProgress } from '../../state/progress'
import { useScars } from '../../state/scars'
import { RaceLight } from './RaceLight'
import { TheDisk } from './TheDisk'
import { LeakyBits } from './LeakyBits'
import { TheQueue } from './TheQueue'
import { HotPartition } from './HotPartition'
import { ReplicationLag } from './ReplicationLag'
import { ThePipe } from './ThePipe'
import { ConsensusRTT } from './ConsensusRTT'
import { LsmVsBtree } from './LsmVsBtree'
import { ConnectionPool } from './ConnectionPool'
import { Backpressure } from './Backpressure'
import { TtlStampede } from './TtlStampede'
import { CacheCliff } from './CacheCliff'
import { InstructionLoop } from './InstructionLoop'
import { HeatWall } from './HeatWall'
import { BranchPredictor } from './BranchPredictor'
import { TlbToll } from './TlbToll'
import { FalseSharing } from './FalseSharing'

// The toy registry: metadata lives in content/toys.ts, sims live here.
const TOY_COMPONENTS: Record<string, ComponentType<{ onComplete: () => void }>> = {
  light: RaceLight,
  disk: TheDisk,
  dram: LeakyBits,
  queue: TheQueue,
  hotpartition: HotPartition,
  replag: ReplicationLag,
  pipe: ThePipe,
  consensus: ConsensusRTT,
  lsmbtree: LsmVsBtree,
  connpool: ConnectionPool,
  backpressure: Backpressure,
  stampede: TtlStampede,
  cachecliff: CacheCliff,
  'instruction-loop': InstructionLoop,
  'heat-wall': HeatWall,
  'branch-predictor': BranchPredictor,
  'tlb-toll': TlbToll,
  'false-sharing': FalseSharing,
}

// /lab → the journey spine · /lab/:toyId → one toy (ADR 0004)
export default function Lab() {
  const { toyId } = useParams()
  if (!toyId) return <LabIndex />
  const toy = toyById(toyId)
  if (!toy) return <Navigate to="/lab" replace />
  return <ToyDetail toy={toy} />
}

// The calm toy card: a lifting panel (no left-border accent). The toy number
// carries the channel color; a ✓ pushes right when done.
function ToyCard({ toy, done, onOpen }: { toy: ToyEntry; done: boolean; onOpen: () => void }) {
  const col = CH_COLOR[toy.ch]
  return (
    <LiftCard
      accent={col}
      onClick={onOpen}
      ariaLabel={`${toy.n} · ${toy.name}`}
      style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 5 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: col, whiteSpace: 'nowrap' }}>
          {toy.n}
        </span>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
          {toy.name}
        </span>
        {done && <span style={{ marginLeft: 'auto', color: C.ok, fontSize: 12, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.45 }}>{toy.sub}</div>
    </LiftCard>
  )
}

// THE JOURNEY SPINE: one organizing story, top to bottom. Each STATION is a
// stop on a single request's journey (content/journey.tsx), rendered as a
// timeline node — a channel-colored circle threaded by a hairline — with the
// station's toys as cards beneath it. Replaces the old channel-grouped grid
// and the collapsible two-view map.
function LabIndex() {
  const navigate = useNavigate()
  const { toysCompleted } = useProgress()
  const doneCount = TOYS.filter((t) => toysCompleted[t.id]).length
  const allDone = doneCount === TOYS.length
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>INTUITION LAB</h1>
        <span
          className="mono"
          style={{ marginLeft: 'auto', fontSize: 11.5, color: allDone ? C.ok : C.dim, whiteSpace: 'nowrap' }}
        >
          {doneCount}/{TOYS.length} internalized
        </span>
      </div>

      {/* Segmented progress: one cell per toy, in toy-number order, lit to its
          channel color when done. */}
      <div style={{ display: 'flex', gap: 3, marginTop: 12 }} aria-label="progress">
        {TOYS.map((t) => (
          <div
            key={t.id}
            title={`${t.n} · ${t.name}`}
            style={{
              height: 5,
              flex: 1,
              borderRadius: 2,
              background: toysCompleted[t.id] ? CH_COLOR[t.ch] : C.line,
              transition: 'background .3s',
            }}
          />
        ))}
      </div>

      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '20px 0 0', maxWidth: 620 }}>
        One tap of "Post" travels from your thumb to disks around the world. Every stop on that journey is a mechanism you can
        operate — drag one variable until it clicks.
      </p>

      <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column' }}>
        {STATIONS.map((s, i) => {
          const col = CH_COLOR[s.ch]
          const last = i === STATIONS.length - 1
          return (
            <section
              key={s.id}
              aria-label={s.name}
              style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: '0 18px' }}
            >
              {/* timeline rail: node + hairline to the next station */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: C.bg,
                    border: `2px solid ${col}`,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                {!last && <div style={{ width: 1, flex: 1, background: C.line, margin: '6px 0 2px' }} />}
              </div>
              <div style={{ paddingBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span
                    className="mono"
                    style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.text, whiteSpace: 'nowrap' }}
                  >
                    {s.name}
                  </span>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: 1, color: col }}>
                    {CH_LABEL[s.ch]}
                  </span>
                </div>
                <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55, margin: '6px 0 0', maxWidth: 600 }}>
                  {s.tagline}
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  {s.toyIds.map((id) => {
                    const t = toyById(id)!
                    return <ToyCard key={id} toy={t} done={!!toysCompleted[id]} onOpen={() => navigate(`/lab/${id}`)} />
                  })}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function PrevNext({ toy }: { toy: ToyEntry }) {
  const navigate = useNavigate()
  const idx = TOYS.findIndex((t) => t.id === toy.id)
  const btn = (target: ToyEntry | undefined, label: string) =>
    target && (
      <button
        onClick={() => navigate(`/lab/${target.id}`)}
        title={target.name}
        style={{
          background: 'transparent',
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          color: C.dim,
          padding: '5px 10px',
          cursor: 'pointer',
          fontFamily: FONT.mono,
          fontSize: 11.5,
        }}
      >
        {label}
      </button>
    )
  return (
    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
      {btn(TOYS[idx - 1], `← ${TOYS[idx - 1]?.n}`)}
      {btn(TOYS[idx + 1], `${TOYS[idx + 1]?.n} →`)}
    </span>
  )
}

// Law L2 (brief before test) in the Lab: the background layer above each sim.
// Open by default on an unplayed toy; collapses to one line once it's done so
// replays stay sim-first. Content contract: content/briefings.tsx.
function FieldBriefing({ toy, done }: { toy: ToyEntry; done: boolean }) {
  const briefing = BRIEFINGS[toy.id]
  const concept = conceptForToy(toy.id)
  const station = stationForToy(toy.id)
  const stationIdx = station ? STATIONS.indexOf(station) : -1
  const floor = floorForToy(toy.id)
  const [open, setOpen] = useState(!done)
  if (!briefing) return null
  const col = CH_COLOR[toy.ch]
  return (
    <section
      aria-label="Field briefing"
      style={{
        background: C.panel,
        border: `1px solid ${col}44`,
        borderRadius: 10,
        padding: '10px 14px 12px',
        margin: '10px 0 4px',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mono"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: col, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5 }}>
          {open ? '▾' : '▸'} FIELD BRIEFING
        </span>
        <span style={{ color: C.faint, fontSize: 10.5 }}>
          {open ? 'the background before you touch it' : "what this is · where you'll meet it · words to know"}
        </span>
      </button>
      {open && (
        <>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text, marginTop: 8 }}>{briefing.setting}</div>
          <Eyebrow color={C.dim} style={{ marginTop: 12 }}>
            WHERE YOU'LL MEET IT
          </Eyebrow>
          <div style={{ marginTop: 2 }}>
            {briefing.meetIt.map((m) => (
              <div key={m.name} style={{ fontSize: 12.5, lineHeight: 1.55, color: C.dim, marginTop: 4 }}>
                <span className="mono" style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>
                  {m.name}
                </span>{' '}
                — {m.how}
              </div>
            ))}
          </div>
          {concept && concept.termKeys.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              <Eyebrow color={C.dim}>WORDS TO KNOW</Eyebrow>
              <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12.5 }}>
                {concept.termKeys.map((k) => (
                  <T key={k} k={k}>
                    {GLOSSARY[k].name}
                  </T>
                ))}
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: C.faint }}>
                tap any dotted word for a plain-language definition
              </span>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 12, paddingTop: 10 }}>
            {station && (
              <div className="mono" style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', fontSize: 10.5 }}>
                <Eyebrow color={col}>YOU ARE HERE</Eyebrow>
                <span style={{ color: C.faint }}>
                  station {stationIdx + 1} of {STATIONS.length} on the request's journey (the map, on the Lab index):{' '}
                  {stationIdx > 0 && <>… {STATIONS[stationIdx - 1].name} → </>}
                  <b style={{ color: col }}>{station.name}</b>
                  {stationIdx < STATIONS.length - 1 && <> → {STATIONS[stationIdx + 1].name} …</>}
                  {floor && (
                    <>
                      {' '}
                      · floor: <b style={{ color: col }}>{floor.name}</b> of the stack
                    </>
                  )}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <Eyebrow color={C.gold}>THE CLICK</Eyebrow>
              <span style={{ fontSize: 12.5, lineHeight: 1.55, color: C.text, flex: '1 1 260px' }}>{toy.click}</span>
            </div>
            {briefing.echo && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                <Eyebrow color={C.dim}>THE ECHO</Eyebrow>
                <span style={{ fontSize: 12, lineHeight: 1.55, color: C.dim, flex: '1 1 260px' }}>{briefing.echo}</span>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

// Spec 082 — THE RECEIPTS: every number the toy extrapolates already carries a
// 3-step derivation + bounding physics in numbers.ts; this surfaces it right
// where the hands are, so a number is never a fact to accept. Collapsed by
// default so the page stays sim-first (docs/content-pipeline.md §2, law L1).
function Receipts({ toy }: { toy: ToyEntry }) {
  const [open, setOpen] = useState(false)
  const col = CH_COLOR[toy.ch]
  // dedupe while preserving the toy's declared order
  const nums = [...new Set(toy.targetNumbers)].map((id) => NUMBERS.find((n) => n.id === id)).filter(Boolean) as typeof NUMBERS
  if (!nums.length) return null
  return (
    <section aria-label="The receipts" style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mono"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.dim, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5 }}
      >
        {open ? '▾' : '▸'} THE RECEIPTS — where these {nums.length === 1 ? 'numbers come' : `${nums.length} numbers come`} from
      </button>
      {open && (
        <div style={{ marginTop: 10, display: 'grid', gap: 12 }}>
          {nums.map((n) => (
            <div key={n.id} style={{ borderLeft: `2px solid ${col}`, borderRadius: 2, paddingLeft: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: col }}>
                  {fmtValue(n.value)} {n.unit}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: C.faint, letterSpacing: 0.5 }}>{n.id}</span>
              </div>
              <ol style={{ margin: '6px 0 0', paddingLeft: 18, display: 'grid', gap: 3 }}>
                {n.derivation.map((step, i) => (
                  <li key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text }}>
                    {step}
                  </li>
                ))}
              </ol>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: C.dim, marginTop: 5 }}>
                <span className="mono" style={{ color: C.faint, fontSize: 10.5, letterSpacing: 0.5 }}>BOUNDED BY </span>
                {n.boundingPhysics}
              </div>
              {n.confusions && (
                <div style={{ fontSize: 11.5, lineHeight: 1.5, color: C.dim, marginTop: 4 }}>
                  <span className="mono" style={{ color: C.faint, fontSize: 10.5, letterSpacing: 0.5 }}>DON'T CONFUSE </span>
                  {n.confusions}
                </div>
              )}
            </div>
          ))}
          <Link to="/manual/ladder" className="mono" style={{ color: C.dim, fontSize: 11 }}>
            the whole latency ladder, rung by rung →
          </Link>
        </div>
      )}
    </section>
  )
}

// Numbers span 0.3 ns → 70,000,000 ns; render them the way an engineer reads them.
function fmtValue(v: number): string {
  if (v < 1) return String(v)
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  if (v >= 1_000) return v.toLocaleString()
  return String(v)
}

// Spec 084 — CALL IT (law L3: predict before run). The bet sits above the sim,
// and the sim stays behind it until a call is locked in — predict-before-peek,
// so an auto-playing sim can't leak its own answer. A wrong call, once the sim
// settles it, lands in the Scar Journal. Content: content/forecasts.ts.
function ForecastPanel({
  toy,
  forecast,
  chosenIx,
  done,
  onCall,
}: {
  toy: ToyEntry
  forecast: (typeof FORECASTS)[string]
  chosenIx: number | undefined
  done: boolean
  onCall: (ix: number) => void
}) {
  const col = CH_COLOR[toy.ch]
  const called = chosenIx !== undefined
  const correct = called && chosenIx === forecast.correctIx
  return (
    <section
      aria-label="Forecast"
      style={{ background: C.panel, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: '10px 14px 12px', margin: '10px 0 4px' }}
    >
      <Eyebrow color={C.gold}>CALL IT — predict before you run</Eyebrow>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: C.text, margin: '6px 0 10px' }}>{forecast.question}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {forecast.options.map((o, i) => {
          const isPick = chosenIx === i
          const isAnswer = i === forecast.correctIx
          let bg: string = C.panelUp
          let brd: string = C.line
          let fg: string = C.dim
          if (called && done && isAnswer) {
            bg = C.ok
            brd = C.ok
            fg = C.bg
          } else if (called && done && isPick) {
            bg = C.alert
            brd = C.alert
            fg = '#fff'
          } else if (called && isPick) {
            bg = col
            brd = col
            fg = C.bg
          }
          return (
            <button
              key={i}
              onClick={() => !called && onCall(i)}
              disabled={called}
              className="mono"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: called ? 'default' : 'pointer',
                background: bg,
                color: fg,
                border: `1px solid ${brd}`,
              }}
            >
              {o}
              {done && isAnswer && ' ✓'}
              {done && isPick && !isAnswer && ' ✗'}
            </button>
          )
        })}
      </div>
      {called && !done && (
        <div className="mono" style={{ fontSize: 11, color: C.faint, marginTop: 9 }}>
          locked in — now run the sim below and watch what actually happens.
        </div>
      )}
      {done && (
        <div style={{ marginTop: 10 }}>
          <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: correct ? C.ok : called ? C.alert : C.dim }}>
            {correct ? '✓ YOU CALLED IT' : called ? '✗ THE SIM DISAGREED' : 'THE VERDICT'}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.55, color: C.text }}> — {forecast.reveal}</span>
        </div>
      )}
    </section>
  )
}

function ToyDetail({ toy }: { toy: ToyEntry }) {
  const { toysCompleted, completeToy, forecasts, recordForecast } = useProgress()
  const addScar = useScars((s) => s.addScar)
  const Comp = TOY_COMPONENTS[toy.id]
  const done = !!toysCompleted[toy.id]
  const col = CH_COLOR[toy.ch]
  // forge ids use the product-spec plural names; map to parts-bin components
  const FORGE_TO_COMPONENT: Record<string, string> = { shards: 'shard', replicas: 'replica', cache: 'cache', queue: 'queue' }
  const forgedComp = toy.forgeUnlocks ? COMPONENTS.find((c) => c.id === FORGE_TO_COMPONENT[toy.forgeUnlocks!]) : null
  const forgedName =
    forgedComp?.name ?? (toy.forgeUnlocks === 'workers' ? 'Workers' : toy.forgeUnlocks === 'cdn' ? 'CDN' : toy.forgeUnlocks)
  const concept = conceptForToy(toy.id)
  const briefing = concept?.manualId ? MANUAL.find((m) => m.id === concept.manualId) : undefined
  const drillCount = concept ? drillsForConcept(concept).length : 0
  const forecast = FORECASTS[toy.id]
  const chosenIx = forecasts[toy.id]
  const called = chosenIx !== undefined
  // predict-before-peek: hold the sim until the call is locked (or already done)
  const showSim = !forecast || called || done
  const handleComplete = () => {
    const st = useProgress.getState()
    const firstTime = !st.toysCompleted[toy.id]
    const pick = st.forecasts[toy.id]
    completeToy(toy.id)
    if (firstTime && forecast && pick !== undefined && pick !== forecast.correctIx) {
      addScar({
        mode: 'lab',
        theme: toy.name,
        what: `“${forecast.options[pick]}”`,
        truth: `“${forecast.options[forecast.correctIx]}”`,
        lesson: forecast.reveal,
      })
    }
  }
  return (
    <div>
      <ModeHeader title="INTUITION LAB" thesis="numbers don't stick — mechanisms do">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
          <Link className="mono" to="/lab" style={{ color: C.dim, fontSize: 11.5, textDecoration: 'none' }}>
            ← all toys
          </Link>
          <span className="mono" style={{ color: col, fontWeight: 600, fontSize: 13 }}>
            {done && <span style={{ color: C.ok }}>✓ </span>}
            {toy.n} · {toy.name}
          </span>
          <span className="mono" style={{ fontSize: 11, color: C.faint }}>
            {toy.sub}
          </span>
          <PrevNext toy={toy} />
        </div>
      </ModeHeader>
      <p style={{ color: C.text, fontSize: 14.5, margin: '0 0 6px', fontWeight: 500 }}>{toy.oneLiner}</p>
      <FieldBriefing key={toy.id} toy={toy} done={done} />
      {forecast && (
        <ForecastPanel toy={toy} forecast={forecast} chosenIx={chosenIx} done={done} onCall={(ix) => recordForecast(toy.id, ix)} />
      )}
      {!showSim && (
        <p className="mono" style={{ color: C.faint, fontSize: 12, margin: '10px 2px' }}>
          ↑ lock in your call to run the sim
        </p>
      )}
      {showSim && (
        <>
          {done && toy.forgeUnlocks && (
            <span
              className="mono"
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                color: C.gold,
                border: `1px solid ${C.gold}66`,
                borderRadius: 6,
                padding: '3px 8px',
                margin: '4px 0',
              }}
            >
              ⚒ FORGED: {String(forgedName).toUpperCase()} — unlocked for the Builder
            </span>
          )}
          <Comp onComplete={handleComplete} />
          <FinePrint text={toy.simplifies} />
          <Receipts toy={toy} />
          {concept && (
            <div
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                flexWrap: 'wrap',
                fontSize: 11.5,
                color: C.dim,
                borderTop: `1px solid ${C.line}`,
                marginTop: 12,
                paddingTop: 10,
              }}
            >
              <Eyebrow color={col}>KEEP THE LOOP</Eyebrow>
              {briefing && (
                <Link to={`/manual/briefings/${briefing.id}`} style={{ color: C.dim }}>
                  read the briefing: {briefing.title}
                </Link>
              )}
              <Link to="/drills/session" style={{ color: C.dim }}>
                {drillCount} drills use these numbers
              </Link>
              {MANUAL.filter((m) => (m.related.toys ?? []).includes(toy.id) && m.id !== concept.manualId).map((sec) => (
                <Link key={sec.id} to={`/manual/briefings/${sec.id}`} style={{ color: C.dim }}>
                  § {sec.title.toLowerCase()}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
