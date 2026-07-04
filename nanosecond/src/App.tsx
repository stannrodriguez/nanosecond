import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { C, FONT } from './theme'
import Lab from './modes/lab'
import Manual from './modes/manual'
import Drills from './modes/drills'
import Builder from './modes/builder'
import Review from './modes/review'
import OnCall from './modes/oncall'

export const MODES = [
  { path: '/lab', label: 'LAB', sub: 'mechanisms, not numbers' },
  { path: '/manual', label: 'MANUAL', sub: 'learn the vocabulary' },
  { path: '/drills', label: 'DRILLS', sub: 'prove you own them' },
  { path: '/builder', label: 'BUILDER', sub: 'story → numbers → system' },
  { path: '/review', label: 'REVIEW', sub: 'the judgment gym' },
  { path: '/on-call', label: 'ON-CALL', sub: 'survive to IPO' },
] as const

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: '16px 20px 0' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>NANOSECOND</span>
            <span className="mono" style={{ fontSize: 11.5, color: C.faint }}>
              systems design, from the physics up
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 2, marginTop: 12, flexWrap: 'wrap' }} aria-label="Modes">
            {MODES.map((m) => (
              <NavLink
                key={m.path}
                to={m.path}
                style={({ isActive }) => ({
                  padding: '10px 13px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? C.net : 'transparent'}`,
                  color: isActive ? C.text : C.dim,
                  textDecoration: 'none',
                  fontFamily: FONT.mono,
                  fontSize: 12,
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{ fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 10.5, color: isActive ? C.net : C.faint, marginTop: 2 }}>{m.sub}</div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ padding: '22px 20px 60px' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/lab" replace />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/manual" element={<Manual />} />
            <Route path="/drills" element={<Drills />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/review" element={<Review />} />
            <Route path="/on-call" element={<OnCall />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
