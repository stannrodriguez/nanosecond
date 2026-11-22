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
        Nanosecond teaches the physical constraints behind systems design. Instead of asking you to memorize a table of
        latency numbers, it puts the mechanisms that produce them in your hands.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        Engineers carry a pocketful of rules of thumb: keep servers under 80%, treat random disk reads as 1000× slower,
        expect cross-region writes to cost round trips. None of that is folklore. Every one of those numbers falls straight
        out of physics: the speed of light, moving metal, leaking charge, and heat. Once you drag a variable yourself and
        watch the curve bend, the number stops acting like trivia. It becomes something you can re-derive at a whiteboard,
        stand behind when challenged, and recognize in a system you have never met before.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        Four physical walls show up behind everything here. Memory runs into wire length and leaking charge. Storage runs
        into sensing physics and moving metal. Networks run into the speed of light, and compute runs into heat. Every
        architecture, whether you build it in this game or ship it at work, is a trade negotiated between those four walls,
        and most "best practices" are simply an earlier team's settlement of the same trade. Knowing which wall a number
        comes from is the difference between reciting an answer and explaining it.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        The vocabulary follows the same discipline. Tap any dotted term to open a definition with three parts: what the
        thing is, the underlying property that makes it behave that way, and what that property forces a design to do.
        Explanations built from the bottom up hold together under follow-up questions because every claim traces back to a
        mechanism rather than a slogan from a blog post. That is what survives an interview, a design review, or a 3am page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 36, maxWidth: 640 }}>
        <LoopRow
          accent={C.net}
          label="LAB"
          to="/lab"
          body='18 interactive mechanisms arranged along the path a single tap of "Post" takes through a real system: the wire, the front door, the clock, the memory ladder, the database, the copies, and the world. Each toy hands you one variable to push around until the shape of the curve feels like second nature. Start here.'
        />
        <LoopRow
          accent={C.compute}
          label="LIBRARY"
          body="27 briefings covering concepts, technologies, and patterns, each anchored by a visualization you can poke, alongside a Reference where every dotted term sits open on the page. Drop in whenever an unfamiliar word appears, or read a whole shelf from start to finish."
        />
        <LoopRow
          accent={C.storage}
          label="PRACTICE"
          to="/practice"
          body="Put your intuition to the test: estimate numbers for a score, turn a story into a system on a workbench, spot the hidden flaw in someone else's design, and keep a service alive on-call. Every mode tests the same judgment an interviewer looks for: the number you commit to, the flaw you call out, and the trade you can defend."
        />
        <LoopRow
          accent={C.gold}
          label="◈ JOURNAL"
          last
          body="Every miss lands here with its lesson attached: what you called, what was true, and the rule separating the two. Your misses are the real curriculum. Review the journal before an interview, or export a briefing a mock interviewer can test you with."
        />
      </div>

      <p className="mono" style={{ fontSize: 11, color: C.faint, margin: '32px 0 0', lineHeight: 1.6 }}>
        built for engineers learning systems design · numbers fade, mechanisms stick
      </p>
    </div>
  )
}
