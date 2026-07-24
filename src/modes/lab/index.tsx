import { useEffect, useState, type ComponentType } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { GhostButton, LiftCard } from '../../ui/kit'
import { C, CH_COLOR, CH_LABEL } from '../../theme'
import { TOYS, toyById, type ToyEntry } from '../../content/toys'
import { STATIONS } from '../../content/journey'
import { Term as T } from '../../ui/Term'
import { useProgress } from '../../state/progress'
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
        One tap of "Post" launches a single <T k="request">request</T>; ~200 ms later your comment is durable on disks in
        three cities. The stations below trace that journey in order — across fiber, through a <T k="queue">queue</T>, onto a
        CPU, past a <T k="cache">cache</T>, down to a disk, out to the <T k="replica">replicas</T> — and each toy isolates one
        mechanism on the path as a live simulation. Drag its one variable until the behavior clicks.
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

// Ghost prev/next, by toy-number order (title = the toy's name).
function PrevNext({ toy }: { toy: ToyEntry }) {
  const navigate = useNavigate()
  const idx = TOYS.findIndex((t) => t.id === toy.id)
  const prev = TOYS[idx - 1]
  const next = TOYS[idx + 1]
  return (
    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
      {prev && (
        <GhostButton onClick={() => navigate(`/lab/${prev.id}`)} title={prev.name}>
          ← {prev.n}
        </GhostButton>
      )}
      {next && (
        <GhostButton onClick={() => navigate(`/lab/${next.id}`)} title={next.name}>
          {next.n} →
        </GhostButton>
      )}
    </span>
  )
}

// One toy, sim-first (ADR 0004). The calm redesign strips the page to its
// spine: navigate → title → one-liner → the sim → the single takeaway (THE
// CLICK) → fine print. The old field briefing, CALL IT forecast/predict-gate,
// receipts, KEEP-THE-LOOP footer and FORGED badge are gone.
function ToyDetail({ toy }: { toy: ToyEntry }) {
  const { toysCompleted, completeToy } = useProgress()
  const navigate = useNavigate()
  const Comp = TOY_COMPONENTS[toy.id]
  const done = !!toysCompleted[toy.id]
  const col = CH_COLOR[toy.ch]
  // "on first completion": show the INTERNALIZED chip only if the toy was not
  // already done when this page opened, and gets completed while we're here.
  const [wasDone] = useState(done)
  const [justDone, setJustDone] = useState(false)

  // window.scrollTo(0,0) on toy open (ADR 0004: each toy is its own page)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [toy.id])

  const handleComplete = () => {
    const firstTime = !useProgress.getState().toysCompleted[toy.id]
    completeToy(toy.id)
    if (firstTime && !wasDone) setJustDone(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <GhostButton onClick={() => navigate('/lab')}>← the journey</GhostButton>
        <PrevNext toy={toy} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: col, whiteSpace: 'nowrap' }}>
          {toy.n}
        </span>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>
          {done && <span style={{ color: C.ok }}>✓ </span>}
          {toy.name}
        </h1>
        <span className="mono" style={{ fontSize: 11, color: C.faint }}>
          {toy.sub}
        </span>
      </div>

      <p style={{ color: C.text, fontSize: 16.5, lineHeight: 1.55, margin: '14px 0 0', fontWeight: 500, maxWidth: 680 }}>
        {toy.oneLiner}
      </p>

      <div style={{ marginTop: 24 }}>
        <Comp onComplete={handleComplete} />
      </div>

      {justDone && (
        <div
          className="mono"
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            color: C.ok,
            border: `1px solid ${C.ok}66`,
            borderRadius: 6,
            padding: '4px 10px',
            marginTop: 14,
          }}
        >
          ✓ INTERNALIZED — {toy.sub}
        </div>
      )}

      {/* THE CLICK — the single takeaway, stated directly (no "It's clicked when" prefix) */}
      <div style={{ borderLeft: `2px solid ${col}`, borderRadius: 2, padding: '2px 0 2px 16px', marginTop: 28, maxWidth: 660 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: col }}>
          THE CLICK
        </span>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, margin: '6px 0 0' }}>{stripClickPrefix(toy.click)}</p>
      </div>

      <p className="mono" style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.6, margin: '20px 0 0', maxWidth: 660 }}>
        FINE PRINT · {toy.simplifies}
      </p>
    </div>
  )
}

// The toy `click` copy is authored as "It's clicked when …"; THE CLICK states
// it directly, so trim that lead-in and re-capitalize.
function stripClickPrefix(click: string): string {
  const m = click.match(/^It's clicked when\s+(.*)$/s)
  if (!m) return click
  const rest = m[1]
  return rest.charAt(0).toUpperCase() + rest.slice(1)
}
