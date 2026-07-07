import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { C, CH_COLOR, CH_LABEL } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { Eyebrow } from '../../ui/kit'
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
import { COMPONENTS } from '../../content/components'
import { forgeForComponent } from '../../content/forge'
import { GLOSSARY } from '../../content/glossary'
import { RUNGS } from '../../content/ladder'
import { toyById } from '../../content/toys'
import { useProgress } from '../../state/progress'
import { fmtTimeNs, fmtHuman } from '../../ui/fmt'

const lightDistance = (ns: number) => {
  const m = ns * 0.2998
  if (m < 1) return `${(m * 100).toFixed(0)} cm`
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${(m / 1000).toFixed(0)} km`
}

/* ---------------- Concept Library: three shelves, viz-first sections ---------------- */

function ShelfNav({ openId, onPick }: { openId: string; onPick: (id: string) => void }) {
  const { sectionsRead } = useProgress()
  return (
    <nav aria-label="Concept Library shelves" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {SHELVES.map((sh) => {
        const secs = sectionsForShelf(sh.id)
        return (
          <div key={sh.id}>
            <div style={{ marginBottom: 6 }}>
              <Eyebrow color={C.dim}>{sh.label.toUpperCase()}</Eyebrow>
              <div className="mono" style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
                {sh.blurb}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {secs.map((s) => {
                const on = s.id === openId
                const read = !!sectionsRead[s.id]
                return (
                  <button
                    key={s.id}
                    onClick={() => onPick(s.id)}
                    aria-current={on}
                    style={{
                      textAlign: 'left',
                      background: on ? C.panelUp : 'transparent',
                      border: 'none',
                      borderLeft: `3px solid ${on ? C.net : 'transparent'}`,
                      color: on ? C.text : C.dim,
                      padding: '7px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}
                  >
                    <span style={{ color: read ? C.ok : C.faint, fontSize: 11, width: 10 }}>{read ? '✓' : '·'}</span>
                    {s.title}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
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

// Parts-bin id → Forge component id (the parts bin uses singular ids; the
// unlock graph uses the product-spec plurals). Entries not listed are
// foundational (load balancer, app server) and never locked.
const PART_TO_FORGE: Record<string, string> = { cache: 'cache', replica: 'replicas', shard: 'shards', queue: 'queue' }

function PartsBin() {
  const [open, setOpen] = useState(false)
  const forged = useProgress((s) => s.forged)
  return (
    <div style={{ marginTop: 28, borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mono"
        style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 0, fontSize: 12.5, fontWeight: 600 }}
      >
        {open ? '▾' : '▸'} PARTS BIN — the technologies at a glance
      </button>
      {open &&
        COMPONENTS.map((p) => {
          const forge = PART_TO_FORGE[p.id] ? forgeForComponent(PART_TO_FORGE[p.id]) : undefined
          const locked = forge && !forged[forge.component]
          return (
            <div key={p.id} style={{ padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 150px) 1fr', gap: 12 }}>
                <div style={{ color: locked ? C.faint : CH_COLOR[p.ch], fontWeight: 600, fontSize: 13.5 }}>
                  {locked && <span aria-hidden>🔒 </span>}
                  <T k={p.termKey}>{p.name}</T>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ color: C.text }}>{p.when}</span> <span style={{ color: C.dim }}>{p.risk}</span>
                  {forge && (
                    <div className="mono" style={{ fontSize: 11, marginTop: 4 }}>
                      {locked ? (
                        <Link to={`/lab/${forge.toyId}`} style={{ color: C.gold, textDecoration: 'none' }}>
                          🔒 locked — ⚒ forge it in the Lab: {forge.toyName.toLowerCase()} →
                        </Link>
                      ) : (
                        <span style={{ color: C.ok }}>⚒ forged — unlocked in the Builder &amp; On-Call</span>
                      )}
                    </div>
                  )}
                  <FinePrint text={p.simplifies} />
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

function ConceptLibrary({ openId }: { openId: string }) {
  const navigate = useNavigate()
  const { sectionsRead } = useProgress()
  const readCount = MANUAL.filter((m) => sectionsRead[m.id]).length
  const open = openId ? sectionById(openId) : undefined
  const setOpen = (id: string) => navigate(`/manual/briefings/${id}`)
  return (
    <div>
      <div className="mono" style={{ fontSize: 12, color: readCount === MANUAL.length ? C.ok : C.dim, marginBottom: 14 }}>
        {readCount}/{MANUAL.length} sections read · every one teaches through a visualization you can poke
      </div>
      <div className="ns-lib-grid">
        <ShelfNav openId={openId} onPick={setOpen} />
        <div style={{ minWidth: 0 }}>
          {open ? (
            <SectionView s={open} />
          ) : (
            <div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: C.text, marginTop: 0 }}>
                The explanation layer — three shelves of short, pokeable briefings. Pick a section: each one leads with an
                interactive visualization and ends with where the idea bites in the other modes. Dotted words are clickable
                everywhere in the game.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                {SHELVES.map((sh) => (
                  <div key={sh.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px' }}>
                    <Eyebrow color={C.net}>{sh.label.toUpperCase()}</Eyebrow>
                    <div style={{ fontSize: 12.5, color: C.dim, marginTop: 4 }}>{sh.blurb}</div>
                    <div className="mono" style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>
                      {sectionsForShelf(sh.id).length} sections
                    </div>
                  </div>
                ))}
              </div>
              <PartsBin />
            </div>
          )}
        </div>
      </div>
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
        Eight numbers, each derived from a physical limit. Don't memorize them — re-derive them. The bar shows how far light
        travels in that time; the right column shows the wait if one nanosecond were one second.
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
  return (
    <div>
      <ModeHeader title="CONCEPT LIBRARY" thesis="explanations you can poke · dotted words are clickable">
        <TabNav
          tabs={[
            { id: 'briefings', label: '01 · LIBRARY', sub: 'concepts · technologies · patterns' },
            { id: 'ladder', label: '02 · THE LADDER', sub: 'derive the numbers' },
          ]}
          active={tab}
          onPick={(id) => navigate(`/manual/${id}`)}
        />
      </ModeHeader>
      {tab === 'briefings' ? <ConceptLibrary openId={sectionId ?? ''} /> : <Ladder />}
    </div>
  )
}
