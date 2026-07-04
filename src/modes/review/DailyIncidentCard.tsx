import { useNavigate } from 'react-router-dom'
import { C } from '../../theme'
import { useDaily, todayStr, incidentNumber } from '../../state/daily'

// The app's landing card (product-spec §3.5): today's date-seeded incident,
// streak, and a one-click way in. Shown on the Lab index — the app's front
// door. Spoiler-free: it never names the puzzle or its flaw.
export function DailyIncidentCard() {
  const navigate = useNavigate()
  const { results, streak } = useDaily()
  const today = todayStr()
  const n = incidentNumber(today)
  const played = results[today]

  return (
    <button
      onClick={() => navigate('/review/daily')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        background: `linear-gradient(90deg, ${C.gold}14, ${C.panel})`,
        border: `1px solid ${C.gold}55`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 22,
        cursor: 'pointer',
        color: C.text,
        fontFamily: 'inherit',
      }}
      aria-label="Daily Incident"
    >
      <div style={{ fontSize: 26, lineHeight: 1 }}>{played ? (played.solved ? '✅' : '🔧') : '🚨'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.gold }}>
          DAILY INCIDENT · #{n}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
          {played
            ? played.solved
              ? "Cleared today's incident — back tomorrow"
              : "Today's incident got you — back tomorrow"
            : 'A production design is failing. Find the flaw.'}
        </div>
        <div className="mono" style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>
          🔥 {streak}-day streak{!played && ' · one shot, date-seeded — same puzzle for everyone today'}
        </div>
      </div>
      <div
        className="mono"
        style={{ fontSize: 12, fontWeight: 700, color: C.bg, background: C.gold, borderRadius: 8, padding: '8px 14px', whiteSpace: 'nowrap' }}
      >
        {played ? 'Review →' : 'Face it →'}
      </div>
    </button>
  )
}
