import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { C, FONT } from './theme'
import { useHover } from './ui/kit'
import { GlossaryProvider } from './ui/Term'
import Lab from './modes/lab'
import Manual from './modes/manual'
import Practice from './modes/practice'
import About from './modes/about'
import Drills from './modes/drills'
import Builder from './modes/builder'
import Review from './modes/review'
import OnCall from './modes/oncall'
import Journal from './modes/journal'

// The top nav — four destinations (README-v3 Phase 2 IA restructure).
// Drills, Builder, Review, On-Call, and Journal all live under PRACTICE;
// its pill stays lit while you're inside any of them.
const NAV = [
  { to: '/lab', label: 'LAB', match: ['/lab'] },
  { to: '/manual', label: 'LIBRARY', match: ['/manual'] },
  { to: '/practice', label: 'PRACTICE', match: ['/practice', '/drills', '/builder', '/review', '/on-call', '/journal'] },
  { to: '/about', label: 'ABOUT', match: ['/about'] },
] as const

// A pill is lit when the current path is (or is nested under) one of its
// matches — this is what keeps PRACTICE lit across the four modes beneath it.
function pathMatches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default function App() {
  return (
    <GlossaryProvider>
      <AppShell />
    </GlossaryProvider>
  )
}

function NavPill({ to, label, active }: { to: string; label: string; active: boolean }) {
  const [h, bind] = useHover()
  return (
    <Link to={to} {...bind} aria-current={active ? 'page' : undefined}>
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
          background: active ? C.net + '14' : h ? C.panelUp : 'transparent',
          color: active ? C.net : h ? C.text : C.dim,
        }}
      >
        {label}
      </span>
    </Link>
  )
}

function AppShell() {
  const { pathname } = useLocation()
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
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 'auto' }} aria-label="Sections">
            {NAV.map((m) => (
              <NavPill key={m.to} to={m.to} label={m.label} active={pathMatches(pathname, m.match)} />
            ))}
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
            {/* The premise + the learning loop (README-v3 IA restructure). */}
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/lab" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
