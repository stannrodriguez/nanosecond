import { useState, type ComponentType } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ModeHeader } from '../../ui/ModeHeader'
import { Eyebrow } from '../../ui/kit'
import { C, CH_COLOR, CH_LABEL, FONT, type Channel } from '../../theme'
import { TOYS, toyById, type ToyEntry } from '../../content/toys'
import { BRIEFINGS } from '../../content/briefings'
import { STATIONS, stationForToy } from '../../content/journey'
import { FLOORS, floorForToy } from '../../content/stack'
import { COMPONENTS } from '../../content/components'
import { NUMBERS } from '../../content/numbers'
import { conceptForToy, drillsForConcept } from '../../content/concepts'
import { MANUAL } from '../../content/manual'
import { GLOSSARY } from '../../content/glossary'
import { FinePrint } from '../../ui/FinePrint'
import { Term as T } from '../../ui/Term'
import { useProgress } from '../../state/progress'
import { DailyIncidentCard } from '../review/DailyIncidentCard'
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
}

// Index group order + each channel's physical wall (product-spec: every
// architecture is a negotiation between these four).
const CHANNEL_WALL: Record<Channel, string> = {
  net: 'bounded by the speed of light',
  compute: 'bounded by heat',
  storage: 'bounded by sensing physics & moving metal',
  mem: 'bounded by wire length & leaking charge',
}
const CHANNELS: Channel[] = ['net', 'compute', 'storage', 'mem']

// /lab → grouped index · /lab/:toyId → one toy (ADR 0004)
export default function Lab() {
  const { toyId } = useParams()
  if (!toyId) return <LabIndex />
  const toy = toyById(toyId)
  if (!toy) return <Navigate to="/lab" replace />
  return <ToyDetail toy={toy} />
}

function ToyCard({ toy, done, onOpen }: { toy: ToyEntry; done: boolean; onOpen: () => void }) {
  const col = CH_COLOR[toy.ch]
  return (
    <button
      onClick={onOpen}
      style={{
        textAlign: 'left',
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${col}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        color: C.text,
        fontFamily: 'inherit',
      }}
    >
      <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
        {done && <span style={{ color: C.ok }}>✓ </span>}
        {toy.n} · {toy.name}
      </div>
      <div style={{ fontSize: 12, color: C.dim, marginTop: 4, lineHeight: 1.4 }}>{toy.sub}</div>
      {toy.forgeUnlocks && (
        <div className="mono" style={{ fontSize: 10, color: done ? C.gold : C.faint, marginTop: 6 }}>
          ⚒ {done ? 'forged a Builder part' : 'forges a Builder part'}
        </div>
      )}
    </button>
  )
}

// THE MAP: the advance organizer the toy grid needs, in two views (ADR 0005).
// THE JOURNEY is horizontal — one concrete story (you tap "Post" on a comment)
// told as stations between machines. THE STACK is vertical — the floors of
// machines-built-on-machines every station runs on, thin floors stating what
// they owe. Deterministic (no auto-advance) so it's calm, reduced-motion-safe,
// and screenshot-stable.
function JourneyMap({ toysCompleted }: { toysCompleted: Record<string, boolean> }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [view, setView] = useState<'journey' | 'stack'>('journey')
  const [stationId, setStationId] = useState(STATIONS[0].id)
  const station = STATIONS.find((s) => s.id === stationId)!
  const col = CH_COLOR[station.ch]
  const primer = station.manualId ? MANUAL.find((m) => m.id === station.manualId) : undefined
  const toyChip = (id: string, color: string) => {
    const t = toyById(id)!
    return (
      <button
        key={id}
        onClick={() => navigate(`/lab/${id}`)}
        className="mono"
        style={{
          background: 'none',
          border: `1px solid ${color}55`,
          borderRadius: 7,
          color: C.text,
          padding: '4px 9px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {toysCompleted[id] && <span style={{ color: C.ok }}>✓ </span>}
        {t.n} {t.name}
      </button>
    )
  }
  return (
    <section
      aria-label="The map: the journey and the stack"
      style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 14px 12px', marginBottom: 18 }}
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
        <span style={{ color: C.text, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5 }}>{open ? '▾' : '▸'} THE MAP</span>
        <span style={{ color: C.faint, fontSize: 10.5 }}>
          one tap of "Post" — its journey across machines, and the stack of machines it runs on
        </span>
      </button>
      {open && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {(
              [
                ['journey', 'THE JOURNEY'],
                ['stack', 'THE STACK'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className="mono"
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  background: view === v ? C.text : 'transparent',
                  color: view === v ? C.bg : C.dim,
                  border: `1px solid ${view === v ? C.text : C.line}`,
                }}
              >
                {label}
              </button>
            ))}
            <span className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              {view === 'journey'
                ? 'where data moves — one request, station by station'
                : 'what it moves through — machines built out of machines, top floor to bedrock'}
            </span>
          </div>
          {view === 'journey' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                {STATIONS.map((s, i) => {
                  const active = s.id === stationId
                  const sCol = CH_COLOR[s.ch]
                  return (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {i > 0 && <span style={{ color: C.faint, fontSize: 10 }}>→</span>}
                      <button
                        onClick={() => setStationId(s.id)}
                        aria-pressed={active}
                        className="mono"
                        style={{
                          padding: '5px 9px',
                          borderRadius: 7,
                          fontSize: 10.5,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                          cursor: 'pointer',
                          background: active ? sCol : 'transparent',
                          color: active ? C.bg : C.dim,
                          border: `1px solid ${active ? sCol : C.line}`,
                        }}
                      >
                        {s.name}
                      </button>
                    </span>
                  )
                })}
              </div>
              <div style={{ borderLeft: `3px solid ${col}`, borderRadius: 2, paddingLeft: 12, marginTop: 12 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text }}>{station.tagline}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  <Eyebrow color={col}>PROVED IN THE LAB BY</Eyebrow>
                  {station.toyIds.map((id) => toyChip(id, col))}
                  {primer && (
                    <Link to={`/manual/briefings/${primer.id}`} className="mono" style={{ color: C.dim, fontSize: 11 }}>
                      need the vocabulary first? § {primer.title.toLowerCase()}
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
          {view === 'stack' && (
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: C.faint, margin: '10px 0 0' }}>
                two verbs at every floor — transform data, move data — and moving is the expensive one
              </div>
              {FLOORS.map((f, i) => (
                <div key={f.id} style={{ borderTop: i > 0 ? `1px solid ${C.line}` : 'none', padding: '9px 0 8px', marginTop: i === 0 ? 6 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.text }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: 12, color: C.dim }}>{f.gist}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {f.toyIds.map((id) => toyChip(id, CH_COLOR[toyById(id)!.ch]))}
                    {f.promised && (
                      <span className="mono" style={{ fontSize: 10.5, color: C.faint }}>
                        {f.promised}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function LabIndex() {
  const navigate = useNavigate()
  const { toysCompleted } = useProgress()
  const doneCount = TOYS.filter((t) => toysCompleted[t.id]).length
  return (
    <div>
      <ModeHeader title="INTUITION LAB" thesis="numbers don't stick — mechanisms do">
        <div className="mono" style={{ fontSize: 12, color: doneCount === TOYS.length ? C.ok : C.dim, margin: '6px 0 2px' }}>
          {doneCount}/{TOYS.length} mechanisms internalized
        </div>
      </ModeHeader>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6, margin: '2px 0 16px', maxWidth: 760 }}>
        Each toy is a mechanism you operate — one variable to drag until a number stops being trivia and becomes physics —
        sorted under the four physical walls every system negotiates with. New to one? Skim its{' '}
        <b style={{ color: C.text }}>field briefing</b> first — what the mechanism is, where you'll meet it in real systems, and
        the words to know. Dotted words like <T k="p99">p99</T> open the glossary, here and everywhere.
      </p>
      <DailyIncidentCard />
      <JourneyMap toysCompleted={toysCompleted} />
      {CHANNELS.map((ch) => (
        <section key={ch} style={{ marginBottom: 24 }} aria-label={CH_LABEL[ch]}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <Eyebrow color={CH_COLOR[ch]}>{CH_LABEL[ch]}</Eyebrow>
            <span className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              {CHANNEL_WALL[ch]}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {TOYS.filter((t) => t.ch === ch).map((t) => (
              <ToyCard key={t.id} toy={t} done={!!toysCompleted[t.id]} onOpen={() => navigate(`/lab/${t.id}`)} />
            ))}
          </div>
        </section>
      ))}
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

function ToyDetail({ toy }: { toy: ToyEntry }) {
  const { toysCompleted, completeToy } = useProgress()
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
            marginBottom: 4,
          }}
        >
          ⚒ FORGED: {String(forgedName).toUpperCase()} — unlocked for the Builder
        </span>
      )}
      <Comp onComplete={() => completeToy(toy.id)} />
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
    </div>
  )
}
