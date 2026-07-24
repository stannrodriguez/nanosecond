import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { C, FONT } from './theme'
import { useHover } from './ui/kit'
import { GlossaryProvider } from './ui/Term'
import Lab from './modes/lab'
import Manual from './modes/manual'
import Practice from './modes/practice'
import Drills from './modes/drills'
import Builder from './modes/builder'
import Review from './modes/review'
import OnCall from './modes/oncall'
import Journal from './modes/journal'

// The six learning modes — the game's verbs. This set is stable; content
// grows INSIDE modes (ADR 0004), so new concepts never add tabs here.
export const MODES = [
  { path: '/lab', label: 'LAB', sub: 'mechanisms, not numbers' },
  { path: '/manual', label: 'LIBRARY', sub: 'concepts · tech · patterns' },
  { path: '/drills', label: 'DRILLS', sub: 'prove you own them' },
  { path: '/builder', label: 'BUILDER', sub: 'story → numbers → system' },
  { path: '/review', label: 'REVIEW', sub: 'the judgment gym' },
  { path: '/on-call', label: 'ON-CALL', sub: 'survive to IPO' },
] as const

export default function App() {
  return (
    <GlossaryProvider>
      <AppShell />
    </GlossaryProvider>
  )
}

// One organizing story per page starts at the top bar: a single sticky,
// blurred row — brand left, mode pills right. Each pill is one mono line
// (the two-line subtitles are gone); the active mode is tinted with its
// accent, Journal is gold.
function NavPill({ to, label, accent }: { to: string; label: string; accent: string }) {
  const [h, bind] = useHover()
  return (
    <NavLink to={to} {...bind}>
      {({ isActive }) => (
        <span
          className="mono"
          style={{
            display: 'inline-block',
            padding: '5px 11px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            transition: 'background .15s, color .15s',
            background: isActive ? accent + '14' : h ? C.panelUp : 'transparent',
            // inactive Journal keeps a dim-gold tint; other modes go C.dim
            color: isActive ? accent : h ? C.text : accent === C.gold ? C.gold + 'AA' : C.dim,
          }}
        >
          {label}
        </span>
      )}
    </NavLink>
  )
}

function AppShell() {
  return (
    <div style={{ minHeight: '100vh', color: C.text }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(15,25,48,.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <NavLink
            to="/lab"
            style={{
              color: C.text,
              textDecoration: 'none',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: -0.5,
              fontFamily: FONT.display,
            }}
          >
            NANOSECOND
          </NavLink>
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 'auto' }} aria-label="Modes">
            {MODES.map((m) => (
              <NavPill key={m.path} to={m.path} label={m.label} accent={C.net} />
            ))}
            {/* Journal is reflection over your record, not a learning mode —
                it sits apart from the six verbs, gold like the Forge. */}
            <NavPill to="/journal" label="◈ JOURNAL" accent={C.gold} />
          </nav>
        </div>
      </header>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 100px' }}>
        <div>
          <Routes>
            <Route path="/" element={<Navigate to="/lab" replace />} />
            {/* Sub-content URL scheme is fixed by ADR 0004; modes validate
                their own params and redirect unknown ids to their index. */}
            <Route path="/lab/:toyId?" element={<Lab />} />
            <Route path="/manual/:tab?/:sectionId?" element={<Manual />} />
            {/* The Practice hub — home of the four modes that left the top nav
                (README-v3 IA restructure). The mode routes below are unchanged. */}
            <Route path="/practice" element={<Practice />} />
            <Route path="/drills/:tab?" element={<Drills />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/review/:tab?/:sub?" element={<Review />} />
            <Route path="/on-call" element={<OnCall />} />
            <Route path="/journal/:tab?" element={<Journal />} />
            <Route path="*" element={<Navigate to="/lab" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
