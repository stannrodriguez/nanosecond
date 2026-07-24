import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { LiftCard } from '../../ui/kit'

// The Practice hub (README-v3 IA restructure). DRILLS / BUILDER / REVIEW /
// ON-CALL left the top nav; this page is their shared home. The four cards run
// top-to-bottom in order of difficulty — the reader is told to start at the top.
const CARDS = [
  {
    to: '/drills',
    n: '1',
    name: 'DRILLS',
    color: C.net,
    what: 'Estimate a number, get scored by order of magnitude.',
    when: 'Daily, 2 minutes. The warm-up — proves the Lab numbers stuck.',
    stat: 'drill 1 · nothing overdue',
  },
  {
    to: '/builder',
    n: '2',
    name: 'BUILDER',
    color: C.compute,
    what: 'Turn a story into numbers, then into a system on a workbench.',
    when: 'When a scenario interests you, ~20 minutes. The main event.',
    stat: '3 scenarios',
  },
  {
    to: '/review',
    n: '3',
    name: 'REVIEW',
    color: C.storage,
    what: "Someone else's design has one flaw. Find it against the clock.",
    when: 'After a few builds — critiquing is the interview skill.',
    stat: 'puzzle 1/12',
  },
  {
    to: '/on-call',
    n: '4',
    name: 'ON-CALL',
    color: C.alert,
    what: 'Run a system through launch day, traffic spikes, and 3am pages.',
    when: 'The boss level — everything above, under pressure.',
    stat: 'act 1/3',
  },
] as const

export default function Practice() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>PRACTICE</h1>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 620, textWrap: 'pretty' }}>
        The Lab builds intuition; this is where you prove it. Four ways to practice, roughly in order of difficulty — start at
        the top.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 36, maxWidth: 680 }}>
        {CARDS.map((c) => (
          <LiftCard
            key={c.to}
            accent={c.color}
            ariaLabel={c.name}
            onClick={() => navigate(c.to)}
            style={{
              borderRadius: 14,
              padding: '18px 22px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '4px 18px',
              alignItems: 'baseline',
            }}
          >
            <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: c.color }}>
              {c.n}
            </span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>
              {c.name}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: C.faint, whiteSpace: 'nowrap' }}>
              {c.stat}
            </span>
            <span />
            <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5, gridColumn: '2 / 4' }}>{c.what}</span>
            <span />
            <span style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, gridColumn: '2 / 4' }}>{c.when}</span>
          </LiftCard>
        ))}
      </div>

      <p className="mono" style={{ fontSize: 11, color: C.faint, margin: '24px 0 0', maxWidth: 640, lineHeight: 1.6 }}>
        every miss anywhere lands in the ◈ journal with its lesson.
      </p>
    </div>
  )
}
