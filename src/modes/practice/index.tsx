import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { LiftCard } from '../../ui/kit'

const CARDS = [
  {
    to: '/drills',
    n: '1',
    name: 'DRILLS',
    color: C.net,
    what: 'Estimate a number, get scored by order of magnitude.',
    when: 'Daily, 2 minutes. Proves the Lab numbers stuck.',
  },
  {
    to: '/builder',
    n: '2',
    name: 'BUILDER',
    color: C.compute,
    what: 'Turn a story into numbers, then into a system on a workbench.',
    when: 'When a scenario interests you, ~20 minutes. The main event.',
  },
  {
    to: '/review',
    n: '3',
    name: 'REVIEW',
    color: C.storage,
    what: "Someone else's design has one flaw. Find it against the clock.",
    when: 'After a few builds — critiquing is the interview skill.',
  },
  {
    to: '/on-call',
    n: '4',
    name: 'ON-CALL',
    color: C.alert,
    what: 'Run a system through launch day, traffic spikes, and 3 am pages.',
    when: 'The boss level — everything above, under pressure.',
  },
] as const

export default function Practice() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>PRACTICE</h1>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 620, textWrap: 'pretty' }}>
        The Lab builds intuition. Prove it here — four ways to practice, in order of difficulty. Start at the top.
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
              gridTemplateColumns: 'auto 1fr',
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
            <span />
            <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{c.what}</span>
            <span />
            <span style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>{c.when}</span>
          </LiftCard>
        ))}
      </div>

      {/* Journal: gold-bordered row, set apart from the four mode cards */}
      <LiftCard
        accent={C.gold}
        ariaLabel="Journal"
        onClick={() => navigate('/journal')}
        style={{
          borderRadius: 14,
          padding: '18px 22px',
          marginTop: 24,
          maxWidth: 680,
          border: `1px solid ${C.gold}44`,
          display: 'flex',
          gap: 18,
          alignItems: 'baseline',
        }}
      >
        <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: C.gold }}>
          ◈
        </span>
        <div>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>JOURNAL</span>
          <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5, margin: '4px 0 0' }}>
            Every miss, logged with its lesson. Review it before an interview.
          </p>
        </div>
      </LiftCard>
    </div>
  )
}
