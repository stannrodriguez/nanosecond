import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { Button, Eyebrow, Panel } from '../../ui/kit'
import { Term } from '../../ui/Term'
import { INTERROGATIONS } from '../../content/interrogations'
import { useScars } from '../../state/scars'

// URL-driven per ADR 0004: the current interrogation is /review/interrogate/:id.
// The parent remounts on id change (key), so in-run state resets cleanly. The
// 6-minute budget is display copy (Law L8), never a wall-clock timer.
export function Interrogate({ id, onScore }: { id?: string; onScore: (n: number) => void }) {
  const navigate = useNavigate()
  const { addScar, addSoundbite } = useScars()
  const idx = Math.max(0, INTERROGATIONS.findIndex((q) => q.id === id))
  const iv = INTERROGATIONS[idx]
  const crucialIx = iv.questions.findIndex((q) => q.crucial)

  const [asked, setAsked] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const spent = asked.reduce((s, i) => s + iv.questions[i].cost, 0)
  const left = Math.round((iv.budget - spent) * 10) / 10
  const askedCrucial = asked.includes(crucialIx)
  const trapFired = done && !askedCrucial

  // Requirements crystallize as you buy the questions that reveal them.
  const known = useMemo(
    () => iv.requirementsMatrix.filter((r) => asked.includes(r.fromQ)),
    [asked, iv.requirementsMatrix],
  )

  const ask = (i: number) => {
    if (done || asked.includes(i) || iv.questions[i].cost > left) return
    setAsked((a) => [...a, i])
  }

  const lock = () => {
    setDone(true)
    onScore(score(iv, asked))
    addSoundbite(iv.trapForUnasked.lesson)
    if (!askedCrucial)
      addScar({
        mode: 'interrogation',
        theme: `interrogation: ${iv.title}`,
        what: 'locked requirements without asking the load-bearing question',
        truth: iv.questions[crucialIx].text,
        lesson: iv.trapForUnasked.lesson,
      })
  }

  const next = () => navigate(`/review/interrogate/${INTERROGATIONS[(idx + 1) % INTERROGATIONS.length].id}`)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>“{iv.title}”</span>
        <span className="mono" style={{ fontSize: 11, color: C.dim }}>
          interrogation {idx + 1}/{INTERROGATIONS.length}
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55, margin: '6px 0 12px' }}>
        The stakeholder hands you a vague pitch. <Term k="request">Requirements</Term> are{' '}
        <b style={{ color: C.text }}>extracted, not given</b> — spend a fixed question budget to drag them into the light.
        You can’t afford every question, and one of them is load-bearing.
      </p>

      {/* The vague pitch */}
      <Panel accent={C.gold} style={{ marginBottom: 12 }}>
        <Eyebrow color={C.gold} style={{ marginBottom: 6 }}>
          THE PITCH
        </Eyebrow>
        <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: C.text }}>{iv.stakeholderPitch}</div>
      </Panel>

      {/* Budget meter */}
      <BudgetMeter budget={iv.budget} spent={spent} left={left} done={done} />

      {/* Question list */}
      <div style={{ marginTop: 12 }}>
        {iv.questions.map((q, i) => {
          const isAsked = asked.includes(i)
          const tooDear = !isAsked && !done && q.cost > left
          const showCrucial = done && q.crucial
          return (
            <button
              key={i}
              onClick={() => ask(i)}
              disabled={done || isAsked || tooDear}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: isAsked ? C.panelUp : C.panel,
                border: `1px solid ${showCrucial ? C.alert : isAsked ? C.net + '88' : C.line}`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 8,
                cursor: done || isAsked || tooDear ? 'default' : 'pointer',
                opacity: tooDear ? 0.45 : 1,
                color: C.text,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 13.5, fontWeight: isAsked ? 600 : 400, lineHeight: 1.45 }}>{q.text}</span>
                <span className="mono" style={{ fontSize: 11, color: isAsked ? C.net : C.faint, whiteSpace: 'nowrap' }}>
                  {q.cost.toFixed(1)} min
                </span>
              </div>
              {isAsked && (
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: C.dim, borderLeft: `2px solid ${C.net}`, paddingLeft: 10 }}>
                  <span className="mono" style={{ color: C.net, fontSize: 10, letterSpacing: 1.2 }}>
                    THEY SAY ·{' '}
                  </span>
                  {q.reveals}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Crystallizing requirements */}
      {known.length > 0 && (
        <Panel accent={C.net} style={{ marginTop: 4 }}>
          <Eyebrow color={C.net} style={{ marginBottom: 8 }}>
            REQUIREMENTS SO FAR · {known.length}/{iv.requirementsMatrix.length}
          </Eyebrow>
          {known.map((r, k) => (
            <div key={k} style={{ fontSize: 13, lineHeight: 1.5, color: C.text, marginBottom: 4 }}>
              <span style={{ color: C.ok }}>✓</span> {r.req}
            </div>
          ))}
        </Panel>
      )}

      {!done ? (
        <Button variant="danger" onClick={lock} disabled={asked.length === 0} style={{ marginTop: 12, padding: '11px 24px' }}>
          Lock requirements &amp; start building →
        </Button>
      ) : (
        <>
          {trapFired && <TrapCard iv={iv} />}
          <Postmortem iv={iv} asked={asked} crucialIx={crucialIx} />
          <Button onClick={next} style={{ marginTop: 12 }}>
            Next interrogation →
          </Button>
        </>
      )}
    </div>
  )
}

function BudgetMeter({ budget, spent, left, done }: { budget: number; spent: number; left: number; done: boolean }) {
  const pct = Math.min(100, (spent / budget) * 100)
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <Eyebrow>QUESTION BUDGET</Eyebrow>
        <span className="mono" style={{ fontSize: 12, color: left <= 0 ? C.alert : C.dim }}>
          {spent.toFixed(1)} / {budget.toFixed(1)} min spent · {left.toFixed(1)} left
        </span>
      </div>
      <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: done ? C.dim : left <= 0.5 ? C.alert : C.net, transition: 'width .2s' }} />
      </div>
    </div>
  )
}

function TrapCard({ iv }: { iv: (typeof INTERROGATIONS)[number] }) {
  return (
    <Panel accent={C.alert} style={{ marginTop: 12, background: C.alert + '11' }}>
      <Eyebrow color={C.alert} style={{ marginBottom: 6 }}>
        THE QUESTION YOU DIDN’T ASK · IT FOUND YOU
      </Eyebrow>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, marginBottom: 6 }}>{iv.trapForUnasked.headline}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: C.dim }}>{iv.trapForUnasked.body}</div>
      <div style={{ marginTop: 10, borderLeft: `3px solid ${C.alert}`, paddingLeft: 12, fontSize: 13.5, lineHeight: 1.6, fontStyle: 'italic' }}>
        <span className="mono" style={{ color: C.alert, fontSize: 10.5, letterSpacing: 1.5, fontStyle: 'normal' }}>
          THE LESSON ·{' '}
        </span>
        {iv.trapForUnasked.lesson}
      </div>
    </Panel>
  )
}

function Postmortem({
  iv,
  asked,
  crucialIx,
}: {
  iv: (typeof INTERROGATIONS)[number]
  asked: number[]
  crucialIx: number
}) {
  const uncovered = iv.requirementsMatrix.filter((r) => asked.includes(r.fromQ)).length
  const total = iv.requirementsMatrix.length
  // Every question, ranked by the information value of its answer.
  const ranked = iv.questions.map((q, i) => ({ q, i })).sort((a, b) => b.q.value - a.q.value)
  return (
    <Panel style={{ marginTop: 12 }}>
      <Eyebrow style={{ marginBottom: 8 }}>DEBRIEF · YOU LOCKED {uncovered}/{total} REQUIREMENTS</Eyebrow>
      <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, marginBottom: 12 }}>
        {asked.includes(crucialIx)
          ? 'You bought the load-bearing question — the build survives contact with reality. Now spend nothing on the questions that changed nothing.'
          : 'You missed the one question that decided the architecture. Every other answer was real, but none of them would have saved you.'}
      </div>
      <Eyebrow color={C.net} style={{ marginBottom: 8 }}>
        EVERY QUESTION, RANKED BY INFORMATION VALUE
      </Eyebrow>
      {ranked.map(({ q, i }) => {
        const wasAsked = asked.includes(i)
        return (
          <div
            key={i}
            style={{
              borderLeft: `3px solid ${q.crucial ? C.alert : wasAsked ? C.ok : C.line}`,
              paddingLeft: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{q.text}</span>
              <span className="mono" style={{ fontSize: 10.5, whiteSpace: 'nowrap', color: C.faint }}>
                <span style={{ color: C.gold }}>{'★'.repeat(q.value)}</span>
                {'☆'.repeat(5 - q.value)} · {q.cost.toFixed(1)}m ·{' '}
                {q.crucial ? (
                  <span style={{ color: C.alert }}>{wasAsked ? 'ASKED (crucial)' : 'MISSED · CRUCIAL'}</span>
                ) : wasAsked ? (
                  <span style={{ color: C.ok }}>asked</span>
                ) : (
                  <span style={{ color: C.faint }}>skipped</span>
                )}
              </span>
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.dim, marginTop: 4 }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: 1, color: C.compute }}>
                WOULD HAVE CHANGED ·{' '}
              </span>
              {q.changes}
            </div>
          </div>
        )
      })}
    </Panel>
  )
}

/** Score = requirements uncovered (weighted by info value) with the crucial one
 *  worth the most, normalized to /100. Efficiency isn't punished directly, but a
 *  budget spent on 1-value questions simply earns little. */
function score(iv: (typeof INTERROGATIONS)[number], asked: number[]): number {
  const max = iv.questions.reduce((s, q) => s + q.value, 0)
  const got = asked.reduce((s, i) => s + iv.questions[i].value, 0)
  return Math.round((got / max) * 100)
}
