import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { useHover } from '../../ui/kit'

// The /about route (README-v3 IA restructure). Explains the premise and the
// physics thesis, then draws the LAB → LIBRARY → PRACTICE → JOURNAL learning
// loop as a dot-and-spine timeline. Copy is verbatim from the v3 prototype.

// One rung of the loop. The dot + spine live in the left rail; LAB and PRACTICE
// carry a link (they're the two calls to action), LIBRARY and JOURNAL are static.
function LoopRow({
  accent,
  label,
  body,
  to,
  last = false,
}: {
  accent: string
  label: string
  body: string
  to?: string
  last?: boolean
}) {
  const navigate = useNavigate()
  const [h, bind] = useHover()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: '0 18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.bg, border: `2px solid ${accent}`, marginTop: 4 }} />
        {!last && <div style={{ width: 1, flex: 1, background: C.line, margin: '6px 0 2px' }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 28 }}>
        {to ? (
          <button
            onClick={() => navigate(to)}
            {...bind}
            className="mono"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: h ? accent : C.text,
              transition: 'color .15s',
            }}
          >
            {label} →
          </button>
        ) : (
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: C.text }}>
            {label}
          </span>
        )}
        <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.55, margin: '6px 0 0', textWrap: 'pretty' }}>{body}</p>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>WHAT IS THIS?</h1>
      <p style={{ color: C.text, fontSize: 16.5, lineHeight: 1.65, margin: '20px 0 0', maxWidth: 640, fontWeight: 500, textWrap: 'pretty' }}>
        Nanosecond teaches the physical constraints behind systems design — not by memorizing latency numbers, but by operating
        the mechanisms that produce them.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        Every rule of thumb an engineer carries — "don't run servers past 80%", "random disk reads are 1000× slower",
        "cross-region writes cost round trips" — is downstream of physics: the speed of light, moving metal, leaking charge,
        heat. When you've dragged the variable yourself and watched the curve bend, the number stops being trivia. It becomes
        something you can re-derive on a whiteboard, defend when challenged, and recognize in a system you've never seen
        before.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        Four walls recur behind everything here: memory is bounded by wire length and leaking charge, storage by sensing
        physics and moving metal, networks by the speed of light, and compute by heat. Every architecture — in this game and
        at work — is a negotiation between those walls, and every "best practice" is somebody's earlier settlement of the
        same negotiation. Knowing which wall a number comes from is what separates reciting it from being able to explain it.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        The vocabulary is built the same way. Every dotted term opens a definition with a fixed shape: what the thing is, the
        property that makes it behave that way, and what that property forces a design to do. An explanation built like that
        survives follow-up questions — each claim traces back to a mechanism, not to a phrase remembered from a blog post —
        which is exactly what an interview, a design review, or a page at 3am demands.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 36, maxWidth: 640 }}>
        <LoopRow
          accent={C.net}
          label="LAB"
          to="/lab"
          body='18 interactive mechanisms, arranged along the journey one tap of "Post" takes through a real system — the wire, the front door, the clock, the memory ladder, the database, the copies, the world. Each toy is one variable to drag until the shape of the curve is yours. Start here.'
        />
        <LoopRow
          accent={C.compute}
          label="LIBRARY"
          body="The vocabulary — 27 briefings on concepts, technologies, and patterns, each led by a visualization you can poke, plus a Reference where every dotted term sits with its definition in the open. Reference it whenever a dotted word shows up, or read a shelf end to end."
        />
        <LoopRow
          accent={C.storage}
          label="PRACTICE"
          to="/practice"
          body="Prove it: estimate numbers under scoring, turn a story into a system on a workbench, find the flaw in someone else's design, survive on-call. Each mode grades the same judgment an interviewer grades — the number you commit to, the flaw you call, the trade you defend."
        />
        <LoopRow
          accent={C.gold}
          label="◈ JOURNAL"
          last
          body="Every miss, logged with its lesson: what you said, what was true, and the rule that separates them. Misses are the curriculum — the journal is what you review before an interview, and it exports a briefing your mock interviewer can run against you."
        />
      </div>

      <p className="mono" style={{ fontSize: 11, color: C.faint, margin: '32px 0 0', lineHeight: 1.6 }}>
        built for engineers learning systems design · numbers don't stick — mechanisms do
      </p>
    </div>
  )
}
