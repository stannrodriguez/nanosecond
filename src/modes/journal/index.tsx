import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { C } from '../../theme'
import { GhostButton, useHover } from '../../ui/kit'
import { useScars, groupByTheme, buildBriefing, exportContextPack, SCAR_MODE_LABEL, type Scar } from '../../state/scars'
import { useDrillProgress } from '../../state/drillProgress'
import { fmtNum } from '../../ui/fmt'

// A friendly relative date for the scar header.
function relDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'today'
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'yesterday'
  return d.toLocaleDateString()
}

// One scar row with a fixed 72px label gutter: YOU SAID / THE TRUTH / LESSON.
function LabelRow({ label, color, body, bodyColor }: { label: string; color: string; body: string; bodyColor: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span
        className="mono"
        style={{ fontSize: 10, letterSpacing: 1, color, flexShrink: 0, width: 72, position: 'relative', top: 3 }}
      >
        {label}
      </span>
      <span style={{ color: bodyColor }}>{body}</span>
    </div>
  )
}

function ScarCard({ s }: { s: Scar }) {
  return (
    <div
      style={{ background: C.panel, border: `1px solid ${C.gold}33`, borderRadius: 14, padding: '20px 24px', marginBottom: 12, maxWidth: 640 }}
    >
      <div className="mono" style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.5, color: C.compute }}>
          {SCAR_MODE_LABEL[s.mode].toUpperCase()} · {s.theme.toUpperCase()}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: C.faint, whiteSpace: 'nowrap' }}>{relDate(s.ts)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, fontSize: 13.5, lineHeight: 1.55 }}>
        <LabelRow label="YOU SAID" color={C.alert} body={s.what} bodyColor={C.dim} />
        <LabelRow label="THE TRUTH" color={C.ok} body={s.truth} bodyColor={C.text} />
        <LabelRow label="LESSON" color={C.gold} body={s.lesson} bodyColor={C.text} />
      </div>
    </div>
  )
}

// A quiet mono link to the journal's secondary views.
function QuietLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [h, bind] = useHover()
  return (
    <button
      onClick={onClick}
      {...bind}
      className="mono"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: h ? C.gold : C.dim, transition: 'color .15s' }}
    >
      {children}
    </button>
  )
}

function Empty() {
  return (
    <div style={{ background: C.panel, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 24, color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      No scars yet. Go miss something — drills you fumble, flaws you mis-accuse, builds that fall over all land here with
      their lesson attached. Misses are the curriculum.
    </div>
  )
}

export default function Journal() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const { scars, soundbites, teachBacks } = useScars()
  const { history } = useDrillProgress()
  const [copied, setCopied] = useState(false)

  if (tab !== 'log' && tab !== 'themes' && tab !== 'brief') return <Navigate to="/journal/log" replace />

  const briefing = buildBriefing(scars, history, soundbites)
  const exportPack = async () => {
    const md = exportContextPack(scars, history, soundbites)
    try {
      await navigator.clipboard.writeText(md)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard denied — offer a download instead
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'nanosecond-context-pack.md'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ---- secondary views: by-theme + pre-interview briefing (behind links) ----
  if (tab === 'themes') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <GhostButton onClick={() => navigate('/journal/log')}>← the journal</GhostButton>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>BLIND SPOTS BY THEME</h1>
        </div>
        {scars.length === 0 ? (
          <Empty />
        ) : (
          groupByTheme(scars).map((g) => (
            <div key={g.theme} style={{ marginBottom: 18 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: 1.5, color: C.compute, marginBottom: 8 }}>
                {g.theme.toUpperCase()} — MISSED {g.scars.length}×
              </div>
              {[...g.scars].reverse().map((s, i) => (
                <ScarCard key={i} s={s} />
              ))}
            </div>
          ))
        )}
      </div>
    )
  }

  if (tab === 'brief') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <GhostButton onClick={() => navigate('/journal/log')}>← the journal</GhostButton>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>PRE-INTERVIEW BRIEFING</h1>
        </div>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.net, marginBottom: 10 }}>
              5 SHAKIEST NUMBERS — re-derive these tonight
            </div>
            {briefing.shakiest.length === 0 && <div style={{ color: C.dim, fontSize: 13.5 }}>Answer some drills first.</div>}
            {briefing.shakiest.map((s) => (
              <div key={s.drillId} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '7px 0', borderBottom: `1px solid ${C.line}`, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, flex: '1 1 320px', lineHeight: 1.45 }}>{s.q}</span>
                <span className="mono" style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                  {fmtNum(s.ans)} {s.unit}
                </span>
                <span className="mono" style={{ fontSize: 11, color: C.alert }}>
                  off by {s.avgErr.toFixed(1)} orders
                </span>
              </div>
            ))}
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.compute, marginBottom: 10 }}>
              3 RECURRING BLIND SPOTS
            </div>
            {briefing.blindSpots.length === 0 && <div style={{ color: C.dim, fontSize: 13.5 }}>No repeated miss themes yet.</div>}
            {briefing.blindSpots.map((t) => (
              <div key={t.theme} style={{ fontSize: 13.5, padding: '5px 0' }}>
                <span style={{ color: C.text }}>{t.theme}</span>
                <span className="mono" style={{ color: C.alert, marginLeft: 10, fontSize: 12 }}>
                  ×{t.count}
                </span>
              </div>
            ))}
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.mem, marginBottom: 10 }}>
              SOUNDBITES YOU'VE EARNED — say these out loud
            </div>
            {soundbites.length === 0 && <div style={{ color: C.dim, fontSize: 13.5 }}>Solve flaw puzzles to collect interview-ready lines.</div>}
            {soundbites.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: C.dim, fontStyle: 'italic', borderLeft: `3px solid ${C.net}`, paddingLeft: 10, marginBottom: 8, lineHeight: 1.5 }}>
                {s}
              </div>
            ))}
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.gold, marginBottom: 10 }}>
              TEACH-BACKS — you explained it out loud, the real test
            </div>
            {teachBacks.length === 0 && (
              <div style={{ color: C.dim, fontSize: 13.5 }}>
                None yet. After a Design Review solve, take the 60-second teach-back — narrating the fix is what makes it stick.
              </div>
            )}
            {teachBacks.length > 0 && (
              <>
                <div style={{ fontSize: 13.5, color: C.text, marginBottom: 8 }}>
                  {teachBacks.length} logged · avg{' '}
                  <b style={{ color: C.mem }}>
                    {(teachBacks.reduce((a, t) => a + t.score, 0) / teachBacks.length).toFixed(1)}/3
                  </b>{' '}
                  on the mechanism / tradeoff / number rubric
                </div>
                {[...teachBacks]
                  .slice(-5)
                  .reverse()
                  .map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '4px 0', flexWrap: 'wrap' }}>
                      <span style={{ color: C.dim }}>{t.topic}</span>
                      <span className="mono" style={{ color: t.score === 3 ? C.ok : t.score >= 2 ? C.compute : C.alert }}>
                        {t.score}/3
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>

          <button
            onClick={exportPack}
            style={{ padding: '12px 24px', background: C.net, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            {copied ? '✓ Copied + downloaded' : 'Export context pack (.md for LLM mock interviews)'}
          </button>
      </div>
    )
  }

  // ---- the log: chronological scars, newest first ----
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>SCAR JOURNAL</h1>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 11.5, color: C.gold, whiteSpace: 'nowrap' }}>
          {scars.length} scar{scars.length === 1 ? '' : 's'}
        </span>
      </div>
      <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 620 }}>
        Every miss, logged with its lesson. Misses are the curriculum.
      </p>

      <div style={{ marginTop: 32 }}>
        {scars.length === 0 ? (
          <Empty />
        ) : (
          <>
            {[...scars].reverse().map((s, i) => (
              <ScarCard key={scars.length - i} s={s} />
            ))}
            <p className="mono" style={{ fontSize: 11, color: C.faint, margin: '20px 0 0', maxWidth: 640, lineHeight: 1.6 }}>
              misses land here automatically — drills you fumble, flaws you mis-accuse, builds that fall over.
            </p>
          </>
        )}
      </div>

      <div className="mono" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'baseline', marginTop: 28 }}>
        <span style={{ fontSize: 10, letterSpacing: 1.5, color: C.faint }}>ALSO</span>
        <QuietLink onClick={() => navigate('/journal/themes')}>blind spots by theme</QuietLink>
        <QuietLink onClick={() => navigate('/journal/brief')}>pre-interview briefing</QuietLink>
      </div>
    </div>
  )
}
