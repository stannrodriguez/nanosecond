import { useState, type ComponentType } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ModeHeader } from '../../ui/ModeHeader'
import { Eyebrow } from '../../ui/kit'
import { C, CH_COLOR, CH_LABEL, FONT, type Channel } from '../../theme'
import { TOYS, toyById, type ToyEntry } from '../../content/toys'
import { BRIEFINGS } from '../../content/briefings'
import { COMPONENTS } from '../../content/components'
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
        Twelve toy mechanisms, four physical walls. Each toy hands you one variable to drag until one number stops being trivia
        and starts being physics. New to one? Skim its <b style={{ color: C.text }}>field briefing</b> first — what the
        mechanism is, where you'll meet it in real systems, and the words to know. Dotted words like{' '}
        <T k="p99">p99</T> open the glossary, here and everywhere.
      </p>
      <DailyIncidentCard />
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
        </>
      )}
    </section>
  )
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
