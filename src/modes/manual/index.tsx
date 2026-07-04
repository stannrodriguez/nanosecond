import { useState } from 'react'
import { C, CH_COLOR, CH_LABEL } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { Term as T } from '../../ui/Term'
import { FinePrint } from '../../ui/FinePrint'
import { MANUAL } from '../../content/manual'
import { COMPONENTS } from '../../content/components'
import { RUNGS } from '../../content/ladder'
import { fmtTimeNs, fmtHuman } from '../../ui/fmt'

const lightDistance = (ns: number) => {
  const m = ns * 0.2998
  if (m < 1) return `${(m * 100).toFixed(0)} cm`
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${(m / 1000).toFixed(0)} km`
}

function PartsBin() {
  return (
    <>
      {COMPONENTS.map((p) => (
        <div key={p.id} style={{ padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 150px) 1fr', gap: 12 }}>
            <div style={{ color: CH_COLOR[p.ch], fontWeight: 600, fontSize: 13.5 }}>
              <T k={p.termKey}>{p.name}</T>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: C.text }}>{p.when}</span> <span style={{ color: C.dim }}>{p.risk}</span>
              <FinePrint text={p.simplifies} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function FieldManual() {
  const [open, setOpen] = useState('request')
  return (
    <div style={{ maxWidth: 780 }}>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55 }}>
        Five short briefings — everything the scenarios assume you know. Dotted words are clickable here and everywhere else in
        the game. Read top to bottom once; after that, the scenarios will read like stories instead of jargon.
      </p>
      {MANUAL.map((m) => (
        <div key={m.id} style={{ background: C.panel, border: `1px solid ${open === m.id ? C.net + '66' : C.line}`, borderRadius: 10, marginBottom: 10 }}>
          <button
            onClick={() => setOpen(open === m.id ? '' : m.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: C.text,
              padding: '14px 16px',
              fontSize: 15.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {m.title} <span style={{ color: C.faint }}>{open === m.id ? '−' : '+'}</span>
          </button>
          {open === m.id && <div style={{ padding: '0 16px 16px', fontSize: 14, lineHeight: 1.6 }}>{m.id === 'parts' ? <PartsBin /> : m.body}</div>}
        </div>
      ))}
    </div>
  )
}

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
  const [tab, setTab] = useState('manual')
  return (
    <div>
      <ModeHeader title="FIELD MANUAL" thesis="learn it before you're tested on it · dotted words are clickable">
        <TabNav
          tabs={[
            { id: 'manual', label: '01 · BRIEFINGS', sub: 'learn the vocabulary' },
            { id: 'ladder', label: '02 · THE LADDER', sub: 'derive the numbers' },
          ]}
          active={tab}
          onPick={setTab}
        />
      </ModeHeader>
      {tab === 'manual' ? <FieldManual /> : <Ladder />}
    </div>
  )
}
