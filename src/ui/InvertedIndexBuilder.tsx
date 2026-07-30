// InvertedIndexBuilder (spec 076, search-db block 2): the inverted index being
// built in front of you, with the analysis pipeline as three toggles. The whole
// teaching is that the pipeline runs over the DOCUMENTS and over the QUERY, so
// switching a stage off changes both sides at once — turn stemming off and the
// document that said "ran" stops answering a search for "Running".

import { useState } from 'react'
import { C } from '../theme'
import { VizFrame } from './viz'

const DOCS = [
  'The Running Cost of a Latency Budget',
  'Latency ran over budget again',
  'Cache misses and the cost of running them',
  'A quiet week for the cache',
]

const STOP = new Set(['the', 'of', 'a', 'and', 'for', 'over', 'them', 'again'])

// A deliberately tiny, explicit stemmer — deterministic, and honest about it in
// the block's fine print. Real stemmers are rule engines, not lookup tables.
const STEM: Record<string, string> = {
  running: 'run',
  ran: 'run',
  runs: 'run',
  budgets: 'budget',
  costs: 'cost',
  misses: 'miss',
  caches: 'cache',
}

interface Stages {
  fold: boolean
  stop: boolean
  stem: boolean
}

function analyze(text: string, s: Stages): string[] {
  const tokens = text.split(/[^A-Za-z]+/).filter(Boolean)
  const out: string[] = []
  for (const raw of tokens) {
    const folded = s.fold ? raw.toLowerCase() : raw
    if (s.stop && STOP.has(folded.toLowerCase())) continue
    out.push(s.stem ? (STEM[folded] ?? folded) : folded)
  }
  return out
}

export function InvertedIndexBuilder({ accent = C.storage }: { accent?: string }) {
  const [s, setS] = useState<Stages>({ fold: true, stop: true, stem: true })
  const query = 'Running'

  const postings = new Map<string, number[]>()
  DOCS.forEach((d, i) => {
    for (const term of analyze(d, s)) {
      const list = postings.get(term) ?? []
      if (!list.includes(i + 1)) list.push(i + 1)
      postings.set(term, list)
    }
  })
  const rows = [...postings.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 6)

  const qTerms = analyze(query, s)
  const hits = [...new Set(qTerms.flatMap((t) => postings.get(t) ?? []))].sort((a, b) => a - b)

  const toggle = (k: keyof Stages) => setS((prev) => ({ ...prev, [k]: !prev[k] }))
  const STAGE_COPY: { k: keyof Stages; label: string; off: string }[] = [
    { k: 'fold', label: 'normalize case', off: 'Case now matters: “Running” and “running” become two unrelated terms.' },
    { k: 'stop', label: 'drop stop words', off: '“the”, “of”, “a” are indexed too — high frequency, no discriminating power, pure weight.' },
    { k: 'stem', label: 'stem', off: '“ran” and “running” stay separate words, so a search for one no longer finds the other.' },
  ]

  return (
    <VizFrame accent={accent}>
      <div className="mono" style={{ fontSize: 11, color: C.dim, letterSpacing: 0.5, marginBottom: 10 }}>
        4 documents in · the pipeline runs on both sides · switch a stage off
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STAGE_COPY.map((st) => {
          const on = s[st.k]
          return (
            <button
              key={st.k}
              onClick={() => toggle(st.k)}
              aria-pressed={on}
              className="mono"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: on ? accent : C.panel,
                color: on ? C.bg : C.dim,
                border: `1px solid ${on ? accent : C.line}`,
              }}
            >
              {st.label}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: 1.1, color: C.faint }}>
          TERM → DOCUMENTS ({postings.size} distinct terms)
        </div>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map(([term, list]) => (
            <div key={term} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 110px) 1fr', gap: 10 }}>
              <span className="mono" style={{ fontSize: 12.5, color: C.text, overflowWrap: 'anywhere' }}>
                {term}
              </span>
              <span className="mono" style={{ fontSize: 12.5, color: C.dim }}>
                → {list.map((d) => `doc ${d}`).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
        <div className="mono" style={{ fontSize: 12.5, color: C.dim }}>
          search “{query}” → analyzed to{' '}
          <b style={{ color: accent }}>[{qTerms.join(', ') || '—'}]</b>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 6 }}>
          {hits.length === 0 ? 'no documents match' : `${hits.length} of 4 documents match`}
        </div>
        <div style={{ fontSize: 12.5, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>
          {hits.length > 0 && <>hits: {hits.map((d) => `doc ${d}`).join(' · ')} — </>}
          {s.stem
            ? 'stemming is what lets the document that said “ran” answer a search for “Running”.'
            : 'without stemming, the document that said “ran” is invisible to this search.'}
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
        {STAGE_COPY.filter((st) => !s[st.k])
          .map((st) => st.off)
          .join(' ') || 'All three stages on: this is the default pipeline almost every text field runs through.'}
      </div>
    </VizFrame>
  )
}
