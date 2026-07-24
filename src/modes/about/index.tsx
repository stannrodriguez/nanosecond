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
        Learn the physical constraints behind systems design. Operate the mechanisms — don't memorize the numbers.
      </p>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 640, textWrap: 'pretty' }}>
        Every rule of thumb you carry is downstream of physics: speed of light, moving metal, leaking charge, heat. Drag the
        variable yourself and the number stops being trivia.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 36, maxWidth: 640 }}>
        <LoopRow
          accent={C.net}
          label="LAB"
          to="/lab"
          body='18 interactive mechanisms, arranged along the journey one tap of "Post" takes through a real system. Start here.'
        />
        <LoopRow
          accent={C.compute}
          label="LIBRARY"
          body="The vocabulary — 27 short briefings on concepts, technologies, and patterns. Reference it whenever a dotted word shows up."
        />
        <LoopRow
          accent={C.storage}
          label="PRACTICE"
          to="/practice"
          body="Prove it: estimate under scoring, build systems from stories, find flaws in designs, survive on-call."
        />
        <LoopRow
          accent={C.gold}
          label="◈ JOURNAL"
          last
          body="Your misses land here with their lessons. Review the journal before an interview."
        />
      </div>

      <p className="mono" style={{ fontSize: 11, color: C.faint, margin: '32px 0 0', lineHeight: 1.6 }}>
        built for engineers learning systems design · numbers don't stick — mechanisms do
      </p>
    </div>
  )
}
