import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { C, CH_COLOR, CH_LABEL } from '../../theme'
import { Eyebrow, GhostButton, LiftCard, useHover } from '../../ui/kit'
import { Term as T } from '../../ui/Term'
import { FinePrint } from '../../ui/FinePrint'
import {
  MANUAL,
  SHELVES,
  sectionsForShelf,
  sectionById,
  resolveSectionId,
  type ManualSection,
} from '../../content/manual'
import type { Shelf } from '../../content/manual/types'
import { GLOSSARY, type GlossaryKey } from '../../content/glossary'
import { RUNGS, type Rung } from '../../content/ladder'
import { toyById } from '../../content/toys'
import { useProgress } from '../../state/progress'
import { fmtTimeNs, fmtHuman } from '../../ui/fmt'

// Each shelf owns a channel accent (spec: CORE CONCEPTS net, KEY TECHNOLOGIES
// compute, COMMON PATTERNS storage).
const SHELF_COLOR: Record<Shelf, string> = {
  concepts: C.net,
  technologies: C.compute,
  patterns: C.storage,
}

const lightDistance = (ns: number) => {
  const m = ns * 0.2998
  if (m < 1) return `${(m * 100).toFixed(0)} cm`
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${(m / 1000).toFixed(0)} km`
}

/* ---------------- Reference: every glossary term in six color-coded groups ---------------- */

const REF_GROUPS: { label: string; color: string; keys: GlossaryKey[] }[] = [
  {
    label: 'REQUESTS & TRAFFIC',
    color: C.net,
    keys: ['request', 'read', 'write', 'rps', 'burst', 'fanout', 'readpct', 'throughput', 'p99', 'sla', 'util', 'pagination'],
  },
  {
    label: 'CPU & MEMORY',
    color: C.mem,
    keys: ['core', 'pipeline', 'speculation', 'cacheline', 'locality', 'virtualmemory'],
  },
  {
    label: 'CACHING & DELIVERY',
    color: C.compute,
    keys: ['cache', 'hitrate', 'ttl', 'stampede', 'cdn', 'lb', 'appserver', 'connpool', 'autoscaling', 'dns', 'tls', 'apigateway', 'rest'],
  },
  {
    label: 'STORAGE & DATA',
    color: C.storage,
    keys: [
      'durable', 'wal', 'lsm', 'btree', 'index', 'gsi', 'normalization', 'denormalization', 'join', 'acid', 'nosql',
      'blob', 'presigned', 'invertedindex', 'shard', 'replica', 'hotpartition', 'replag', 'readyourwrites', 'geohash', 'quadtree', 'consistenthash',
    ],
  },
  {
    label: 'QUEUES & STREAMS',
    color: C.gold,
    keys: [
      'queue', 'worker', 'backlog', 'stream', 'eventsourcing', 'cdc', 'idempotent', 'exactlyonce', 'atleastonce',
      'visibility', 'dlq', 'saga', '2pc', 'optimistic',
    ],
  },
  {
    label: 'RESILIENCE',
    color: C.alert,
    keys: [
      'errorbudget', 'failover', 'consistency', 'consensus', 'cap', 'quorum', 'leader', 'breaker', 'bulkhead',
      'timeout', 'retry', 'backpressure', 'ratelimit', 'herd', 'bluegreen', 'canary', 'distlock', 'lease',
      'websocket', 'sse', 'polling', 'iot', 'phonehome',
    ],
  },
]

function RefRow({ k, color }: { k: GlossaryKey; color: string }) {
  const entry = GLOSSARY[k]
  if (!entry) return null
  const [open, setOpen] = useState(false)
  return (
    <div
      id={`ref-${k}`}
      onClick={() => setOpen(!open)}
      style={{
        borderBottom: `1px solid ${C.line}`,
        padding: '8px 0',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, position: 'relative', top: -2 }} />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{entry.name}</span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: C.faint }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, margin: '6px 0 2px 15px' }}>{entry.def}</p>
      )}
    </div>
  )
}

function Reference() {
  return (
    <section style={{ marginTop: 56 }}>
      <div className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.faint }}>REFERENCE</div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.5, margin: '8px 0 24px' }}>
        Every dotted term in the app. Tap to expand.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px 40px' }}>
        {REF_GROUPS.map((g) => (
          <div key={g.label}>
            <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: g.color, marginBottom: 8 }}>
              {g.label}
            </div>
            {g.keys.map((k) => (
              <RefRow key={k} k={k} color={g.color} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Concept Library: three shelves, viz-first sections ---------------- */

// One section link in the shelf columns: a full-width row with a shelf-colored
// dot; a ✓ marks it read.
function LibRow({ title, read, dotColor, onClick }: { title: string; read: boolean; dotColor: string; onClick: () => void }) {
  const [h, bind] = useHover()
  return (
    <button
      onClick={onClick}
      {...bind}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        borderBottom: `1px solid #1B2C48`,
        padding: '8px 2px',
        cursor: 'pointer',
        color: h ? C.text : '#B9C6DE',
        fontSize: 13.5,
        fontFamily: 'inherit',
        transition: 'color .15s',
      }}
    >
      <span
        style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0, position: 'relative', top: -2 }}
      />
      <span style={{ flex: 1 }}>{title}</span>
      {read && <span style={{ color: C.ok, fontSize: 11 }}>✓</span>}
    </button>
  )
}

function LadderCard({ onClick }: { onClick: () => void }) {
  return (
    <LiftCard
      accent={C.net}
      ariaLabel="The Ladder"
      onClick={onClick}
      style={{ borderRadius: 14, padding: '18px 22px', marginTop: 40 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>THE LADDER</span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: C.net, fontWeight: 600 }}>climb →</span>
      </div>
      <p style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.5, margin: '8px 0 12px' }}>
        Eight latency numbers, each derived from a physical limit. Don't memorize — re-derive.
      </p>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {RUNGS.map((r: Rung) => (
          <span
            key={r.name}
            className="mono"
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 6,
              background: CH_COLOR[r.ch] + '18',
              color: CH_COLOR[r.ch],
              whiteSpace: 'nowrap',
            }}
          >
            {fmtTimeNs(r.ns)}
          </span>
        ))}
      </div>
    </LiftCard>
  )
}

function RelatedRow({ s }: { s: ManualSection }) {
  const toys = (s.related.toys ?? []).map((id) => toyById(id)).filter(Boolean)
  const secs = (s.related.sections ?? []).map((id) => sectionById(id)).filter(Boolean) as ManualSection[]
  return (
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
        marginTop: 16,
        paddingTop: 12,
      }}
    >
      <Eyebrow color={C.net}>RELATED</Eyebrow>
      {toys.map((t) => (
        <Link key={t!.id} to={`/lab/${t!.id}`} style={{ color: C.dim }}>
          ▸ {t!.name.toLowerCase()}
        </Link>
      ))}
      {secs.map((sec) => (
        <Link key={sec.id} to={`/manual/briefings/${sec.id}`} style={{ color: C.dim }}>
          § {sec.title.toLowerCase()}
        </Link>
      ))}
      <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {s.related.terms.map((k) => (
          <T key={k} k={k}>
            {GLOSSARY[k]?.name ?? k}
          </T>
        ))}
      </span>
    </div>
  )
}

function SectionView({ s }: { s: ManualSection }) {
  const markSectionRead = useProgress((st) => st.markSectionRead)
  useEffect(() => {
    markSectionRead(s.id)
  }, [s.id, markSectionRead])
  return (
    <article>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{s.title}</h2>
      <p className="mono" style={{ fontSize: 12, color: C.net, margin: '0 0 12px' }}>
        {s.thesis}
      </p>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{s.body}</div>
      {s.viz}
      <FinePrint text={s.simplifies} />
      <RelatedRow s={s} />
      <div
        style={{
          marginTop: 16,
          background: C.bg,
          border: `1px solid ${C.gold}44`,
          borderRadius: 10,
          padding: '12px 14px',
        }}
      >
        <Eyebrow color={C.gold}>WHERE YOU'LL FEEL THIS</Eyebrow>
        <div style={{ fontSize: 13.5, color: C.text, marginTop: 6, lineHeight: 1.5 }}>{s.feltIn.note}</div>
        <Link
          to={s.feltIn.to}
          className="mono"
          style={{ display: 'inline-block', marginTop: 8, color: C.gold, fontSize: 12.5, fontWeight: 600 }}
        >
          {s.feltIn.cta} →
        </Link>
      </div>
    </article>
  )
}

// The library index: one organizing view — three shelf columns of pokeable
// briefings. No sidebar, no intro paragraph, no summary cards.
function ConceptLibrary() {
  const navigate = useNavigate()
  const { sectionsRead } = useProgress()
  const readCount = MANUAL.filter((m) => sectionsRead[m.id]).length
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>CONCEPT LIBRARY</h1>
        <span
          className="mono"
          style={{ marginLeft: 'auto', fontSize: 11.5, color: readCount === MANUAL.length ? C.ok : C.dim, whiteSpace: 'nowrap' }}
        >
          {readCount}/{MANUAL.length} read
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 620 }}>
        Short briefings, each led by a visualization you can poke. Dotted words are clickable everywhere.
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, marginTop: 40 }}
      >
        {SHELVES.map((sh) => {
          const col = SHELF_COLOR[sh.id]
          return (
            <section key={sh.id} aria-label={sh.label}>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: col }}>
                {sh.label.toUpperCase()}
              </div>
              <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>
                {sh.blurb}
              </div>
              <div style={{ marginTop: 12 }}>
                {sectionsForShelf(sh.id).map((s) => (
                  <LibRow
                    key={s.id}
                    title={s.title}
                    read={!!sectionsRead[s.id]}
                    dotColor={col + '55'}
                    onClick={() => navigate(`/manual/briefings/${s.id}`)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <LadderCard onClick={() => navigate('/manual/ladder')} />
      <Reference />
    </div>
  )
}

/* ---------------- The Ladder (unchanged from spec 020) ---------------- */

function Ladder() {
  const [open, setOpen] = useState(0)
  const minLog = Math.log10(0.3)
  const maxLog = Math.log10(70000000)
  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <span className="mono" style={{ color: C.dim, fontSize: 12 }}>
          human scale: 1 ns = 1 second
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14, marginTop: 4, marginBottom: 20, lineHeight: 1.5 }}>
        Eight numbers, each derived from a physical limit. Don't memorize them — re-derive them.
      </p>
      {RUNGS.map((r, i) => {
        const frac = (Math.log10(r.ns) - minLog) / (maxLog - minLog)
        const col = CH_COLOR[r.ch]
        const isOpen = open === i
        return (
          <div
            key={r.name}
            onClick={() => setOpen(isOpen ? -1 : i)}
            style={{
              background: isOpen ? C.panelUp : C.panel,
              border: `1px solid ${isOpen ? col + '66' : C.line}`,
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'border-color .2s, background .2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="mono" style={{ color: col, fontSize: 10, letterSpacing: 1.5, minWidth: 66 }}>
                {CH_LABEL[r.ch]}
              </span>
              <span style={{ fontWeight: 600, fontSize: 15, flex: '1 1 auto' }}>{r.name}</span>
              <span className="mono" style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
                {fmtTimeNs(r.ns)}
              </span>
              <span className="mono" style={{ color: C.dim, fontSize: 12, minWidth: 160, textAlign: 'right' }}>
                {fmtHuman(r.ns)}
              </span>
            </div>
            <div style={{ position: 'relative', height: 8, background: C.bg, borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${Math.max(frac * 100, 1.5)}%`,
                  background: `linear-gradient(90deg, ${col}33, ${col})`,
                  borderRadius: 4,
                }}
              />
            </div>
            <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.faint, marginTop: 4 }}>
              <span>{r.tag}</span>
              <span>light travels {lightDistance(r.ns)}</span>
            </div>
            {isOpen && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                {r.physics.map((p, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span className="mono" style={{ color: col, fontSize: 12, marginTop: 2 }}>
                      ▸
                    </span>
                    <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.55 }}>{p}</span>
                  </div>
                ))}
                <div style={{ background: C.bg, border: `1px solid ${col}44`, borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
                  <span className="mono" style={{ color: col, fontSize: 10, letterSpacing: 1.5 }}>
                    WHY IT MATTERS IN AN INTERVIEW
                  </span>
                  <div style={{ fontSize: 13.5, marginTop: 5, lineHeight: 1.5 }}>{r.matters}</div>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <div style={{ color: C.faint, fontSize: 12.5, marginTop: 14, lineHeight: 1.6 }}>
        The pattern to internalize: <span style={{ color: C.mem }}>memory</span> is bounded by wire length and leaking charge,{' '}
        <span style={{ color: C.storage }}>storage</span> by sensing physics and moving metal,{' '}
        <span style={{ color: C.net }}>networks</span> by the speed of light, and <span style={{ color: C.compute }}>compute</span>{' '}
        by heat. Every architecture is a negotiation between these four walls.
      </div>
    </div>
  )
}

export default function Manual() {
  const { tab, sectionId } = useParams()
  const navigate = useNavigate()
  if (tab !== 'briefings' && tab !== 'ladder') return <Navigate to="/manual/briefings" replace />
  // Legacy section ids (spec 020) redirect to their re-shelved home (ADR 0004).
  if (sectionId && tab === 'briefings') {
    const resolved = resolveSectionId(sectionId)
    if (!resolved) return <Navigate to="/manual/briefings" replace />
    if (resolved !== sectionId) return <Navigate to={`/manual/briefings/${resolved}`} replace />
  }
  if (sectionId && tab === 'ladder') return <Navigate to="/manual/ladder" replace />

  // The Ladder, reachable from the quiet link at the foot of the library.
  if (tab === 'ladder') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <GhostButton onClick={() => navigate('/manual/briefings')}>← the library</GhostButton>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>THE LADDER</h1>
        </div>
        <Ladder />
      </div>
    )
  }

  // A single opened briefing (deep-linkable), with a back link to the shelves.
  const open = sectionId ? sectionById(sectionId) : undefined
  if (open) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <GhostButton onClick={() => navigate('/manual/briefings')}>← the library</GhostButton>
        </div>
        <SectionView s={open} />
      </div>
    )
  }

  return <ConceptLibrary />
}
