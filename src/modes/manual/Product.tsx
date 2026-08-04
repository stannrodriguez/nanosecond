// The Named Technologies lens page (ADR 0007, spec 089): /manual/tech/:productId.
// A lens, not a briefing — the identity block is the only authored prose; the
// briefing links, glossary rows, numbers, and Lab rows are collected from
// content that already exists (src/content/products.tsx collectors).

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { Eyebrow, GhostButton, LiftCard } from '../../ui/kit'
import { FinePrint } from '../../ui/FinePrint'
import { sectionById } from '../../content/manual'
import { fmtNum } from '../../ui/fmt'
import { numbersFor, termsFor, toysFor, type Product } from '../../content/products'
import type { NumberEntry } from '../../content/numbers'
import type { GlossaryEntry } from '../../content/glossary'

// The lens accent: gold, deliberately none of the three shelf channels.
const ACCENT = C.gold

function SectionHead({ label, count }: { label: string; count?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
      <Eyebrow color={ACCENT}>{label}</Eyebrow>
      {count && (
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: C.dim, whiteSpace: 'nowrap' }}>
          {count}
        </span>
      )}
    </div>
  )
}

/* WHERE IT LIVES — the where-it-touches idiom, but the reasons are the
   product's claim on each briefing rather than an edge between briefings. */
function WhereItLives({ p }: { p: Product }) {
  const rows = p.liveIn.map((l) => ({ ...l, sec: sectionById(l.section) })).filter((l) => l.sec)
  return (
    <section aria-label="Where it lives">
      <SectionHead label="WHERE IT LIVES IN THE LIBRARY" count={`${rows.length} briefings`} />
      <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 10 }}>
        {rows.map((l, i) => (
          <li key={l.section}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/manual/briefings/${l.section}`} style={{ color: C.net, fontSize: 13.5, fontWeight: 600 }}>
                § {l.sec!.title}
              </Link>
              {i === 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: 0.8,
                    color: ACCENT,
                    border: `1px solid ${ACCENT}55`,
                    borderRadius: 4,
                    padding: '1px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  its briefing
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: C.dim, margin: '3px 0 0', lineHeight: 1.5 }}>{l.how}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* IN THE LAB — the MEET IT panels read backwards: every toy that names this
   product, with the clause it uses to introduce it. */
function InTheLab({ p }: { p: Product }) {
  const rows = toysFor(p)
  if (rows.length === 0) return null
  return (
    <section aria-label="In the Lab">
      <SectionHead label="IN THE LAB" count={`${rows.length} ${rows.length === 1 ? 'toy' : 'toys'}`} />
      <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 10 }}>
        {rows.map(({ toy, how }) => (
          <li key={toy.id}>
            <Link to={`/lab/${toy.id}`} className="mono" style={{ color: C.net, fontSize: 12.5, fontWeight: 600 }}>
              ▸ {toy.name.toLowerCase()}
            </Link>
            <span style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}> — {how}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* THE NUMBERS — every numbers.ts entry that names the product; open a row for
   its 3-step derivation (the displayed-number rule made visible). */
function NumberRow({ n, open, onToggle }: { n: NumberEntry; open: boolean; onToggle: () => void }) {
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
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
          {fmtNum(n.value)} {n.unit}
        </span>
        <span className="mono" style={{ flex: '1 1 160px', minWidth: 160, fontSize: 11.5, color: open ? C.text : C.dim }}>
          {n.id.replace(/-/g, ' ')}
        </span>
        <span className="mono" aria-hidden style={{ fontSize: 11, color: C.faint }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ margin: '0 4px 12px 2px', paddingLeft: 12, borderLeft: `2px solid ${ACCENT}55` }}>
          {n.derivation.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginTop: i === 0 ? 0 : 6 }}>
              <span className="mono" style={{ color: ACCENT, fontSize: 11, marginTop: 2 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{step}</span>
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: C.dim, marginTop: 8, lineHeight: 1.5 }}>
            <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, color: C.faint }}>
              BOUNDED BY
            </span>{' '}
            {n.boundingPhysics}
          </div>
        </div>
      )}
    </div>
  )
}

function TheNumbers({ p }: { p: Product }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const rows = numbersFor(p)
  if (rows.length === 0) return null
  return (
    <section aria-label="The numbers">
      <SectionHead label="THE NUMBERS" count={`${rows.length} derivable`} />
      <div style={{ marginTop: 6 }}>
        {rows.map((n) => (
          <NumberRow key={n.id} n={n} open={openId === n.id} onToggle={() => setOpenId(openId === n.id ? null : n.id)} />
        ))}
      </div>
    </section>
  )
}

/* IN THE REFERENCE — every glossary entry that names the product, in the
   TermsPanel idiom: collapsed rows read as a phrasebook, one opens at a time. */
function RefRow({
  termKey,
  entry,
  open,
  onToggle,
}: {
  termKey: string
  entry: GlossaryEntry
  open: boolean
  onToggle: () => void
}) {
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
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, whiteSpace: 'nowrap' }}>
          {entry.name}
        </span>
        <span style={{ flex: '1 1 200px', minWidth: 200, fontSize: 13, color: open ? C.text : C.dim, lineHeight: 1.5 }}>
          {entry.say ? `“${entry.say}”` : entry.def.split('. ')[0] + '.'}
        </span>
        <span className="mono" aria-hidden style={{ fontSize: 11, color: C.faint }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 4px 12px', borderLeft: `2px solid ${ACCENT}55`, marginLeft: 2, paddingLeft: 12 }}>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{entry.def}</div>
          {entry.reachFor && aside('REACH FOR', entry.reachFor)}
          {entry.trap && aside('TRAP', entry.trap)}
          <Link
            to={`/manual/reference/${termKey}`}
            className="mono"
            style={{ display: 'inline-block', marginTop: 8, color: C.net, fontSize: 11.5 }}
          >
            see in reference →
          </Link>
        </div>
      )}
    </div>
  )
}

function InTheReference({ p }: { p: Product }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const rows = termsFor(p)
  if (rows.length === 0) return null
  return (
    <section aria-label="In the reference">
      <SectionHead label="IN THE REFERENCE" count={`${rows.length} entries name it`} />
      <div style={{ marginTop: 6 }}>
        {rows.map(({ key, entry }) => (
          <RefRow
            key={key}
            termKey={key}
            entry={entry}
            open={openKey === key}
            onToggle={() => setOpenKey(openKey === key ? null : key)}
          />
        ))}
      </div>
    </section>
  )
}

export default function ProductPage({ p }: { p: Product }) {
  const navigate = useNavigate()
  const home = sectionById(p.home)
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <GhostButton onClick={() => navigate('/manual/briefings')}>← the library</GhostButton>
      </div>
      <article>
        <Eyebrow color={ACCENT}>NAMED TECHNOLOGY</Eyebrow>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: '6px 0 4px' }}>{p.name}</h2>
        <p className="mono" style={{ fontSize: 12, color: ACCENT, margin: '0 0 16px', lineHeight: 1.6 }}>
          “{p.say}”
        </p>
        <div style={{ fontSize: 14, lineHeight: 1.65, maxWidth: 680 }}>{p.what}</div>
        <FinePrint text={`A lens, not a briefing: this page collects what the library already teaches about ${p.name} — the briefings below do the teaching, and they update this page as they grow.`} />

        {home && (
          <LiftCard
            accent={ACCENT}
            ariaLabel={`Its briefing — ${home.title}`}
            onClick={() => navigate(`/manual/briefings/${home.id}`)}
            style={{ width: '100%', borderRadius: 10, padding: '14px 16px', marginTop: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.2, color: ACCENT }}>
                ITS BRIEFING
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{home.title}</span>
              <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: ACCENT, whiteSpace: 'nowrap' }}>
                read →
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: C.dim, marginTop: 5, lineHeight: 1.5 }}>{home.thesis}</div>
          </LiftCard>
        )}

        <WhereItLives p={p} />
        <InTheLab p={p} />
        <TheNumbers p={p} />
        <InTheReference p={p} />
      </article>
    </div>
  )
}
