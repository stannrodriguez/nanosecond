import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { LiftCard } from '../../ui/kit'
import { useScars } from '../../state/scars'

// The Practice hub (README-v3 IA restructure). DRILLS / BUILDER / REVIEW /
// ON-CALL left the top nav; this page is their shared home. The four cards run
// top-to-bottom in order of difficulty — the reader is told to start at the top.
const CARDS = [
  {
    to: '/drills',
    n: '1',
    name: 'DRILLS',
    color: C.net,
    what: 'Estimate real system numbers and get scored by order of magnitude.',
    when: '2 minutes a day. A quick warm-up to make sure the Lab numbers stuck.',
    stat: '60 drills',
  },
  {
    to: '/builder',
    n: '2',
    name: 'BUILDER',
    color: C.compute,
    what: 'Turn a product story into real numbers, then build the system on a workbench.',
    when: 'Pick a scenario that catches your eye, ~20 minutes. The main event.',
    stat: '3 scenarios',
  },
  {
    to: '/review',
    n: '3',
    name: 'REVIEW',
    color: C.storage,
    what: "Inspect someone else's architecture, spot the bottleneck, or call it sound.",
    when: 'Try this after a few builds. Critiquing a design is its own interview skill.',
    stat: '12 puzzles',
  },
  {
    to: '/on-call',
    n: '4',
    name: 'ON-CALL',
    color: C.alert,
    what: 'Keep a system upright through launch day, traffic spikes, and 3am pages.',
    when: 'Combine everything above under live traffic and budget pressure.',
    stat: '3 acts',
  },
] as const

// The Journal row — below the four modes, gold-bordered and apart: it is
// reflection over your record, not a fifth mode (README-v3 Phase 2).
function JournalRow() {
  const navigate = useNavigate()
  const scars = useScars((s) => s.scars)
  return (
    <LiftCard
      accent={C.gold}
      baseBorder={C.gold + '33'}
      ariaLabel="JOURNAL"
      onClick={() => navigate('/journal')}
      style={{
        borderRadius: 14,
        padding: '18px 22px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: '4px 18px',
        alignItems: 'baseline',
      }}
    >
      <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: C.gold }}>
        ◈
      </span>
      <span className="mono" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>
        JOURNAL
      </span>
      <span className="mono" style={{ fontSize: 10.5, color: C.faint, whiteSpace: 'nowrap' }}>
        {scars.length} scar{scars.length === 1 ? '' : 's'}
      </span>
      <span />
      <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5, gridColumn: '2 / 4' }}>
        Every miss lands here with its lesson attached.
      </span>
      <span />
      <span style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, gridColumn: '2 / 4' }}>
        Your misses are the real curriculum. Read through them before an interview.
      </span>
    </LiftCard>
  )
}

export default function Practice() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>PRACTICE</h1>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 620, textWrap: 'pretty' }}>
        The Lab builds your intuition. This is where you test it. Four modes, ordered roughly from warm-up to high
        pressure, so start at the top.
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

      <div style={{ marginTop: 24, maxWidth: 680 }}>
        <JournalRow />
      </div>
    </div>
  )
}
