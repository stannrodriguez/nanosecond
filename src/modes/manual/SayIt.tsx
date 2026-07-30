// Say-it deck (spec 067): speak-only articulation drills, local to one
// briefing. Front is a question in the interviewer's voice; the player answers
// OUT LOUD (no text input, by design — the checklist is the record), flips,
// and self-grades against a model sentence + three key points. No timers.
// Grades feed the same Leitner boxes as the numeric drills (sayitProgress).

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { Eyebrow, GhostButton } from '../../ui/kit'
import { Term as T } from '../../ui/Term'
import { GLOSSARY } from '../../content/glossary'
import type { ManualSection } from '../../content/manual'
import { sayItCardsForSection, type SayItCard } from '../../content/sayit'
import { orderDeck, useSayItProgress, type SayItGrade } from '../../state/sayitProgress'

const GRADE_META: { grade: SayItGrade; label: string; sub: string; key: string; col: string }[] = [
  { grade: 'blanked', label: 'blanked', sub: 'demote · 1', key: '1', col: C.alert },
  { grade: 'partial', label: 'partial', sub: 'hold · 2', key: '2', col: C.compute },
  { grade: 'nailed', label: 'nailed it', sub: 'promote · 3', key: '3', col: C.mem },
]

const GRADE_COL: Record<SayItGrade, string> = { blanked: C.alert, partial: C.compute, nailed: C.mem }

function ProgressDots({ total, at, grades }: { total: number; at: number; grades: (SayItGrade | null)[] }) {
  return (
    <div aria-hidden style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: 20,
            height: 5,
            borderRadius: 3,
            background: grades[i] ? GRADE_COL[grades[i]!] : i === at ? C.dim : C.line,
          }}
        />
      ))}
      <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: C.dim }}>
        {Math.min(at + 1, total)} / {total}
      </span>
    </div>
  )
}

function MetaRow({ tag, col, children }: { tag: string; col: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.5 }}>
      <span className="mono" style={{ flexShrink: 0, width: 60, fontSize: 10.5, letterSpacing: 1.2, color: col, paddingTop: 2 }}>
        {tag}
      </span>
      <span style={{ color: C.dim }}>{children}</span>
    </div>
  )
}

function CardFront({ card, onFlip }: { card: SayItCard; onFlip: () => void }) {
  return (
    <>
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: '22px 24px',
          minHeight: 230,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Eyebrow color={C.dim}>INTERVIEWER</Eyebrow>
        <p style={{ fontSize: 18.5, lineHeight: 1.5, margin: '10px 0 0' }}>{card.cue}</p>
        <p style={{ marginTop: 'auto', paddingTop: 20, color: C.dim, fontSize: 13.5, lineHeight: 1.5 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>Say your answer out loud.</span> Full sentences, like you're in
          the room. Then flip.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={onFlip}
          className="mono"
          style={{
            flex: 1,
            fontSize: 13,
            letterSpacing: 0.5,
            padding: '10px 18px',
            borderRadius: 8,
            border: `1px solid ${C.net}66`,
            background: C.panelUp,
            color: C.net,
            cursor: 'pointer',
          }}
        >
          flip → model answer
        </button>
      </div>
      <div className="mono" style={{ marginTop: 8, fontSize: 11, color: C.faint }}>
        space to flip · then 1 / 2 / 3 to grade
      </div>
    </>
  )
}

function CardBack({ card, onGrade }: { card: SayItCard; onGrade: (g: SayItGrade) => void }) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false])
  return (
    <>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '22px 24px' }}>
        <Eyebrow color={C.net}>A STRONG ANSWER SOUNDS LIKE</Eyebrow>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: '8px 0 18px' }}>{card.model}</p>
        <Eyebrow color={C.dim}>DID YOU SAY…</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, margin: '8px 0 16px' }}>
          {card.checks.map((text, i) => (
            <button
              key={i}
              onClick={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
              aria-pressed={checked[i]}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                background: 'none',
                border: 'none',
                padding: 0,
                color: checked[i] ? C.text : C.dim,
                fontFamily: 'inherit',
                fontSize: 13.5,
                textAlign: 'left',
                cursor: 'pointer',
                lineHeight: 1.5,
              }}
            >
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 15,
                  height: 15,
                  marginTop: 2,
                  border: `1px solid ${checked[i] ? C.mem : C.dim}`,
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  color: checked[i] ? C.mem : 'transparent',
                }}
              >
                ✓
              </span>
              <span>{text}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <MetaRow tag="TRAP" col={C.alert}>
            {card.trap}
          </MetaRow>
          <MetaRow tag="NUMBER" col={C.gold}>
            <span className="mono" style={{ color: C.text, fontSize: 12.5 }}>
              {card.number.val}
            </span>{' '}
            — {card.number.body}
          </MetaRow>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          {card.terms.map((k) => (
            <T key={k} k={k}>
              {GLOSSARY[k]?.name ?? k}
            </T>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        {GRADE_META.map((g) => (
          <button
            key={g.grade}
            onClick={() => onGrade(g.grade)}
            className="mono ns-sayit-grade"
            style={{
              flex: '1 1 100px',
              fontSize: 13,
              letterSpacing: 0.5,
              padding: '9px 14px',
              borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: C.panelUp,
              color: C.text,
              cursor: 'pointer',
              // the accent arrives on hover/focus via inline handlers below
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = g.col
              e.currentTarget.style.color = g.col
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.line
              e.currentTarget.style.color = C.text
            }}
          >
            {g.label}
            <span style={{ display: 'block', fontSize: 10, color: C.faint, letterSpacing: 1, marginTop: 2 }}>{g.sub}</span>
          </button>
        ))}
      </div>
      <div className="mono" style={{ marginTop: 8, fontSize: 11, color: C.faint }}>
        grade against the checklist, not the vibe
      </div>
    </>
  )
}

function EndScreen({ s, grades, onAgain }: { s: ManualSection; grades: (SayItGrade | null)[]; onAgain: () => void }) {
  const n = (g: SayItGrade) => grades.filter((x) => x === g).length
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '22px 24px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Deck done.</h2>
      <div className="mono" style={{ display: 'flex', gap: 18, fontSize: 13, marginBottom: 12 }}>
        <span style={{ color: C.mem }}>{n('nailed')} nailed</span>
        <span style={{ color: C.compute }}>{n('partial')} partial</span>
        <span style={{ color: C.alert }}>{n('blanked')} blanked</span>
      </div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
        Grades move each card through the same Leitner boxes as the numeric drills: nailed waits longer, blanked comes back
        daily. Shaky on one? <Link to={`/manual/briefings/${s.id}`} style={{ color: C.net }}>Re-read the briefing</Link> —
        its terms panel carries every say-it sentence.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <GhostButton onClick={onAgain}>run it again</GhostButton>
      </div>
    </div>
  )
}

export default function SayItDeck({ s }: { s: ManualSection }) {
  const navigate = useNavigate()
  const { cards: cardState, record } = useSayItProgress()
  // Session order locks in at mount (due-first); re-running rebuilds it.
  const [runId, setRunId] = useState(0)
  const deck = useMemo(
    () => orderDeck(sayItCardsForSection(s.id), useSayItProgress.getState().cards, Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.id, runId],
  )
  const [at, setAt] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [grades, setGrades] = useState<(SayItGrade | null)[]>(() => deck.map(() => null))
  void cardState // subscribe so due counts elsewhere stay live

  const done = at >= deck.length
  const grade = (g: SayItGrade) => {
    record(deck[at].id, g)
    setGrades((prev) => prev.map((v, i) => (i === at ? g : v)))
    setAt((i) => i + 1)
    setFlipped(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'BUTTON' && e.key === ' ') return
      if (done) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped && ['1', '2', '3'].includes(e.key)) {
        grade(GRADE_META[Number(e.key) - 1].grade)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <GhostButton onClick={() => navigate(`/manual/briefings/${s.id}`)}>← the briefing</GhostButton>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>SAY IT</h1>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim }}>{s.title.toLowerCase()}</span>
      </div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 16px', maxWidth: 560 }}>
        Questions an interviewer would actually ask. Answer out loud before you flip — there's nowhere to type, on purpose.
      </p>
      <ProgressDots total={deck.length} at={at} grades={grades} />
      {done ? (
        <EndScreen
          s={s}
          grades={grades}
          onAgain={() => {
            setAt(0)
            setFlipped(false)
            setGrades(deck.map(() => null))
            setRunId((r) => r + 1)
          }}
        />
      ) : flipped ? (
        <CardBack key={deck[at].id} card={deck[at]} onGrade={grade} />
      ) : (
        <CardFront card={deck[at]} onFlip={() => setFlipped(true)} />
      )}
    </div>
  )
}
