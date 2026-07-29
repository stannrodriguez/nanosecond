// The forge mini-challenge (spec 070). Six toys forge a part; this is the gate
// between "I played the sim" and "I can build with it". It appears under the
// toy only once the toy is internalized — the challenge is a check on the
// click, not a substitute for it — and one right answer unlocks the part in
// the Builder and On-Call for good.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { C, CH_COLOR } from '../../theme'
import { Eyebrow, useHover } from '../../ui/kit'
import { Term as T } from '../../ui/Term'
import { GLOSSARY } from '../../content/glossary'
import type { ForgeChallenge } from '../../content/forge'
import { useProgress } from '../../state/progress'
import { useScars } from '../../state/scars'

function OptionButton({
  text,
  state,
  col,
  onClick,
}: {
  text: string
  state: 'idle' | 'right' | 'wrong' | 'muted'
  col: string
  onClick: () => void
}) {
  const [h, bind] = useHover()
  const border = state === 'right' ? C.ok : state === 'wrong' ? C.alert : h && state === 'idle' ? col + '88' : C.line
  return (
    <button
      onClick={onClick}
      disabled={state !== 'idle'}
      {...bind}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: state === 'right' ? C.ok + '11' : state === 'wrong' ? C.alert + '11' : C.bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: '11px 13px',
        marginTop: 8,
        fontSize: 13.5,
        lineHeight: 1.5,
        fontFamily: 'inherit',
        color: state === 'muted' ? C.faint : C.text,
        cursor: state === 'idle' ? 'pointer' : 'default',
        transition: 'border-color .15s, background .15s',
      }}
    >
      {text}
    </button>
  )
}

export function ForgePanel({ f, toyDone, toyName }: { f: ForgeChallenge; toyDone: boolean; toyName: string }) {
  const forged = useProgress((s) => s.forged)
  const forgeComponent = useProgress((s) => s.forgeComponent)
  const addScar = useScars((s) => s.addScar)
  const already = !!forged[f.id]
  const [picked, setPicked] = useState<number | null>(null)
  const col = CH_COLOR[f.ch]

  const answer = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (f.options[i].ok) forgeComponent(f.id)
    else
      addScar({
        mode: 'lab',
        theme: `${f.part} — ${f.label}`,
        what: f.options[i].text,
        truth: f.options.find((o) => o.ok)!.text,
        lesson: f.options[i].why,
      })
  }

  const chosen = picked === null ? null : f.options[picked]
  const won = already || !!chosen?.ok

  return (
    <section
      aria-label="Forge challenge"
      style={{
        marginTop: 30,
        background: C.panel,
        border: `1px solid ${won ? C.ok + '55' : C.gold + '44'}`,
        borderRadius: 12,
        padding: '16px 18px',
        maxWidth: 680,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <Eyebrow color={won ? C.ok : C.gold}>⚒ THE FORGE · {f.label.toUpperCase()}</Eyebrow>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: won ? C.ok : C.faint, whiteSpace: 'nowrap' }}>
          {won ? `${f.part} forged` : `${f.part} — locked`}
        </span>
      </div>

      {!toyDone ? (
        <p style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.6, margin: '10px 0 0' }}>
          {toyName} forges the <b style={{ color: col }}>{f.part}</b> for the Builder and On-Call. Run the sim above until it
          clicks — the challenge opens when it does.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.6, margin: '10px 0 0' }}>{f.setup}</p>
          <p style={{ fontSize: 14.5, color: C.text, lineHeight: 1.55, margin: '10px 0 2px', fontWeight: 600 }}>{f.question}</p>

          {already && picked === null ? (
            <div className="mono" style={{ fontSize: 12, color: C.ok, marginTop: 10 }}>
              ✓ Answered — <b>{f.part}</b> is yours in the Builder and On-Call.
            </div>
          ) : (
            f.options.map((o, i) => (
              <OptionButton
                key={i}
                text={o.text}
                col={col}
                state={picked === null ? 'idle' : picked === i ? (o.ok ? 'right' : 'wrong') : o.ok ? 'right' : 'muted'}
                onClick={() => answer(i)}
              />
            ))
          )}

          {chosen && (
            <div
              style={{
                background: C.bg,
                border: `1px solid ${chosen.ok ? C.ok : C.alert}44`,
                borderRadius: 8,
                padding: '11px 13px',
                marginTop: 12,
              }}
            >
              <Eyebrow color={chosen.ok ? C.ok : C.alert}>{chosen.ok ? 'FORGED' : 'NOT YET'}</Eyebrow>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '6px 0 0' }}>{chosen.why}</p>
              {!chosen.ok && (
                <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '10px 0 0', color: C.dim }}>
                  The answer that forges it is highlighted above — and it's in the scar journal now, so you'll meet this one
                  again. Re-run the sim, then reload this page to try it cold.
                </p>
              )}
              {chosen.ok && (
                <p className="mono" style={{ fontSize: 11.5, margin: '10px 0 0', color: C.dim }}>
                  <b style={{ color: col }}>{f.part}</b> unlocked ·{' '}
                  <Link to="/builder" style={{ color: C.gold }}>
                    build with it →
                  </Link>
                </p>
              )}
            </div>
          )}

          <div
            className="mono"
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              fontSize: 11.5,
              color: C.dim,
              borderTop: `1px solid ${C.line}`,
              marginTop: 14,
              paddingTop: 10,
            }}
          >
            {f.terms.map((k) => (
              <T key={k} k={k}>
                {GLOSSARY[k]?.name ?? k}
              </T>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
