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
import { GLOSSARY, REFERENCE_GROUPS, type GlossaryEntry } from '../../content/glossary'
import { RUNGS } from '../../content/ladder'
import { toyById } from '../../content/toys'
import { sayItCardsForSection } from '../../content/sayit'
import { useProgress } from '../../state/progress'
import { dueCount, useSayItProgress } from '../../state/sayitProgress'
import { fmtTimeNs, fmtHuman } from '../../ui/fmt'
import SayItDeck from './SayIt'

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

// The Ladder promoted to a full-width card (README-v3 Phase 2): title, pitch,
// a color-coded preview of every rung, and the climb → call to action.
function LadderCard({ onClick }: { onClick: () => void }) {
  return (
    <LiftCard
      accent={C.net}
      ariaLabel="THE LADDER"
      onClick={onClick}
      style={{ width: '100%', borderRadius: 14, padding: '18px 22px', marginTop: 40 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>
          THE LADDER
        </span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: C.net, whiteSpace: 'nowrap' }}>
          climb →
        </span>
      </div>
      <div style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.5, marginTop: 6, maxWidth: 620 }}>
        Every latency number, each derived from a physical limit — re-derive them, rung by rung.
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {RUNGS.map((r) => (
          <span
            key={r.name}
            className="mono"
            title={r.name}
            style={{
              fontSize: 10.5,
              color: CH_COLOR[r.ch],
              border: `1px solid ${CH_COLOR[r.ch]}44`,
              borderRadius: 6,
              padding: '3px 8px',
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

/* ---------------- REFERENCE: every glossary term, definitions in the open ----------------
   Six color-coded groups at the foot of the library. Every definition is
   visible on page load — no accordions, no hover-only tooltips — so the whole
   section reads by scrolling and searches with ctrl-F. Each row carries an
   anchor id; deep links (/manual/reference/<term>) scroll to the row and
   flash it. The row text IS the glossary def, so the tooltip drawer and the
   Reference row can never drift apart. */

const REF_GROUP_COLOR: Record<string, string> = {
  traffic: C.net,
  networking: C.net,
  cpu: C.compute,
  caching: C.mem,
  storage: C.storage,
  queues: C.gold,
  resilience: C.alert,
}

function ReferenceRow({ termKey, color, focused }: { termKey: string; color: string; focused: boolean }) {
  const entry = GLOSSARY[termKey]
  if (!entry) return null
  return (
    <div
      id={`ref-${termKey}`}
      className="ns-ref-row"
      style={{
        padding: '10px 8px',
        borderBottom: `1px solid #1B2C48`,
        borderRadius: 6,
        background: focused ? color + '14' : 'transparent',
        outline: focused ? `1px solid ${color}66` : 'none',
        transition: 'background .4s, outline-color .4s',
        scrollMarginTop: 80,
      }}
    >
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color, overflowWrap: 'break-word' }}>
        {entry.name}
      </span>
      <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
        {entry.def}
        {entry.say && <Speakable entry={entry} color={color} />}
      </span>
    </div>
  )
}

// Spec 065: the speakable half of an entry — how to say it out loud, when to
// reach for it, and the sentence that gets people in trouble. Authored for the
// Networking group today; rendered wherever it exists.
function Speakable({ entry, color }: { entry: GlossaryEntry; color: string }) {
  const aside = (label: string, body: string) => (
    <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>
      <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color: C.faint }}>
        {label}
      </span>{' '}
      {body}
    </span>
  )
  return (
    <span
      style={{
        display: 'block',
        marginTop: 10,
        paddingLeft: 10,
        borderLeft: `2px solid ${color}55`,
      }}
    >
      <span style={{ display: 'block', fontSize: 13, color: C.text, lineHeight: 1.55 }}>
        <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color }}>
          SAY IT
        </span>{' '}
        “{entry.say}”
      </span>
      {entry.reachFor && aside('REACH FOR', entry.reachFor)}
      {entry.trap && aside('TRAP', entry.trap)}
    </span>
  )
}

function ReferenceSection({ focusTerm }: { focusTerm?: string }) {
  // A deep-linked term scrolls into view and flashes; the flash decays so the
  // page settles back to the plain list.
  const [flash, setFlash] = useState<string | null>(focusTerm ?? null)
  useEffect(() => {
    if (!focusTerm) return
    setFlash(focusTerm)
    const el = document.getElementById(`ref-${focusTerm}`)
    if (el) el.scrollIntoView({ block: 'center' })
    const t = setTimeout(() => setFlash(null), 2400)
    return () => clearTimeout(t)
  }, [focusTerm])
  const termCount = REFERENCE_GROUPS.reduce((n, g) => n + g.keys.length, 0)
  return (
    <section aria-label="Reference" style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>REFERENCE</h2>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: C.dim, whiteSpace: 'nowrap' }}>
          {termCount} terms
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '12px 0 0', maxWidth: 620 }}>
        Every dotted term in one place, defined. Scroll it, or ctrl-F it.
      </p>
      {REFERENCE_GROUPS.map((g) => {
        const col = REF_GROUP_COLOR[g.id] ?? C.net
        return (
          <div key={g.id} style={{ marginTop: 28 }}>
            <div className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: col }}>
              {g.label.toUpperCase()}
            </div>
            <div style={{ marginTop: 8 }}>
              {g.keys.map((k) => (
                <ReferenceRow key={k} termKey={k} color={col} focused={flash === k} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

/* Spec 068: the briefing's own terms, on the page — a player studying a
   section shouldn't have to leave for Reference. Collapsed rows read as a
   phrasebook (term + its SAY IT sentence); expanding one reveals the def and
   the rest of the speakable contract. */
function TermsPanelRow({ termKey, color, open, onToggle }: { termKey: string; color: string; open: boolean; onToggle: () => void }) {
  const entry = GLOSSARY[termKey]
  if (!entry) return null
  const aside = (label: string, body: string) => (
    <div style={{ marginTop: 6, fontSize: 12.5, color: C.dim, lineHeight: 1.55 }}>
      <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color: C.faint }}>
        {label}
      </span>{' '}
      {body}
    </div>
  )
  return (
    <div style={{ borderBottom: `1px solid #1B2C48` }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px 10px',
          flexWrap: 'wrap',
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: '9px 4px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color, whiteSpace: 'nowrap' }}>
          {entry.name}
        </span>
        {/* minWidth lets the sentence drop below a long term name at 380px
            instead of squeezing into a sliver column */}
        <span style={{ flex: '1 1 200px', minWidth: 200, fontSize: 13, color: open ? C.text : C.dim, lineHeight: 1.5 }}>
          {entry.say ? `“${entry.say}”` : entry.def.split('. ')[0] + '.'}
        </span>
        <span className="mono" aria-hidden style={{ fontSize: 11, color: C.faint }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 4px 12px', borderLeft: `2px solid ${color}55`, marginLeft: 2, paddingLeft: 12 }}>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{entry.def}</div>
          {entry.reachFor && aside('REACH FOR', entry.reachFor)}
          {entry.trap && aside('TRAP', entry.trap)}
        </div>
      )}
    </div>
  )
}

function TermsPanel({ s }: { s: ManualSection }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const group = REFERENCE_GROUPS.find((g) => g.id === s.termShelf)
  if (!group) return null
  const col = SHELF_COLOR[s.shelf]
  return (
    <section aria-label="The terms" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <Eyebrow color={col}>THE TERMS</Eyebrow>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: C.dim, whiteSpace: 'nowrap' }}>
          {group.keys.length} terms · say each out loud
        </span>
      </div>
      <div style={{ marginTop: 6 }}>
        {group.keys.map((k) => (
          <TermsPanelRow
            key={k}
            termKey={k}
            color={col}
            open={openKey === k}
            onToggle={() => setOpenKey(openKey === k ? null : k)}
          />
        ))}
      </div>
    </section>
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

/* Spec 067: the briefing's practice deck entry — a card at the foot of the
   page. Visiting the briefing satisfies law L2 (brief before test), so from
   here the deck is always open; the lock only guards cold deep links. */
function SayItCard({ s }: { s: ManualSection }) {
  const navigate = useNavigate()
  const cards = useSayItProgress((st) => st.cards)
  const deck = sayItCardsForSection(s.id)
  if (deck.length === 0) return null
  const due = dueCount(deck.map((c) => c.id), cards, Date.now())
  return (
    <LiftCard
      accent={C.net}
      ariaLabel={`SAY IT — ${deck.length} questions an interviewer would ask`}
      onClick={() => navigate(`/manual/briefings/${s.id}/say-it`)}
      style={{ width: '100%', borderRadius: 10, padding: '14px 16px', marginTop: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.2, color: C.net }}>
          🗣 SAY IT
        </span>
        <span style={{ fontSize: 13, color: C.dim }}>
          {deck.length} questions an interviewer would ask
        </span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: due > 0 ? C.net : C.faint, whiteSpace: 'nowrap' }}>
          {due > 0 ? `${due} due · practice →` : 'all scheduled · again →'}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>
        Answer out loud, flip, grade yourself. Blanked cards come back daily.
      </div>
    </LiftCard>
  )
}

/* Spec 069: a deep briefing renders as numbered, viz-led blocks (content-
   pipeline §7 "three registers"); the legacy body/viz/simplifies fields are
   ignored when blocks exist — block 1 points at the same content. */
function SectionBlocks({ s }: { s: ManualSection }) {
  const col = SHELF_COLOR[s.shelf]
  return (
    <>
      {s.blocks!.map((b, i) => (
        <section key={b.heading} aria-label={b.heading} style={{ marginTop: i === 0 ? 0 : 36 }}>
          <h3
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.4,
              margin: '0 0 10px',
              paddingTop: i === 0 ? 0 : 14,
              borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
            }}
          >
            <span className="mono" style={{ fontSize: 11.5, color: col, letterSpacing: 1 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="mono" style={{ fontSize: 12.5, letterSpacing: 1.2 }}>
              {b.heading}
            </span>
          </h3>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{b.body}</div>
          {b.viz}
          {b.simplifies && <FinePrint text={b.simplifies} />}
        </section>
      ))}
    </>
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
      {s.blocks ? (
        <SectionBlocks s={s} />
      ) : (
        <>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{s.body}</div>
          {s.viz}
          <FinePrint text={s.simplifies} />
        </>
      )}
      {s.termShelf && <TermsPanel s={s} />}
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
      <SayItCard s={s} />
    </article>
  )
}

/* Spec 067: the deck page at /manual/briefings/:sectionId/say-it. Law L2
   gates it — a cold deep link (briefing never opened) shows the way in, not
   the cards. */
function SayItPage({ s }: { s: ManualSection }) {
  const navigate = useNavigate()
  const read = useProgress((st) => st.sectionsRead[s.id])
  if (!read) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 24 }}>
          <GhostButton onClick={() => navigate(`/manual/briefings/${s.id}`)}>← the briefing</GhostButton>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '22px 24px' }}>
          <Eyebrow color={C.net}>SAY IT · LOCKED</Eyebrow>
          <p style={{ fontSize: 15, lineHeight: 1.6, margin: '10px 0 0' }}>
            Read the briefing first — these cards test what it teaches, and the deck grades you against its sentences.
          </p>
          <Link
            to={`/manual/briefings/${s.id}`}
            className="mono"
            style={{ display: 'inline-block', marginTop: 12, color: C.net, fontSize: 12.5, fontWeight: 600 }}
          >
            open {s.title.toLowerCase()} →
          </Link>
        </div>
      </div>
    )
  }
  return <SayItDeck s={s} />
}

// The library index: one organizing view — three shelf columns of pokeable
// briefings, the Ladder card, then the Reference section.
function ConceptLibrary({ focusTerm }: { focusTerm?: string }) {
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
      <ReferenceSection focusTerm={focusTerm} />
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
        Nine numbers, each derived from a physical limit. Don't memorize them — re-derive them. The bar shows how far light
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
  const { tab, sectionId, sub } = useParams()
  const navigate = useNavigate()
  if (tab !== 'briefings' && tab !== 'ladder' && tab !== 'reference') return <Navigate to="/manual/briefings" replace />
  // Legacy section ids (spec 020) redirect to their re-shelved home (ADR 0004).
  if (sectionId && tab === 'briefings') {
    const resolved = resolveSectionId(sectionId)
    if (!resolved) return <Navigate to="/manual/briefings" replace />
    if (resolved !== sectionId) return <Navigate to={`/manual/briefings/${resolved}${sub ? `/${sub}` : ''}`} replace />
  }

  // Spec 067: /manual/briefings/:sectionId/say-it — the briefing's practice
  // deck. Unknown sub-paths (or sections without a deck) degrade to the
  // briefing itself, never 404 (ADR 0004).
  if (sectionId && tab === 'briefings' && sub) {
    const s = sectionById(sectionId)
    if (!s || sub !== 'say-it' || sayItCardsForSection(s.id).length === 0)
      return <Navigate to={`/manual/briefings/${sectionId}`} replace />
    return <SayItPage s={s} />
  }
  if (sectionId && tab === 'ladder') return <Navigate to="/manual/ladder" replace />

  // The Reference section lives on the library index; /manual/reference/<term>
  // deep-links to one row (unknown term ids degrade to the index — ADR 0004).
  if (tab === 'reference') {
    if (sectionId && !GLOSSARY[sectionId]) return <Navigate to="/manual/reference" replace />
    return <ConceptLibrary focusTerm={sectionId} />
  }

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
