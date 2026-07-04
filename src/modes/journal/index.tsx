import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { C } from '../../theme'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { useScars, groupByTheme, buildBriefing, exportContextPack, SCAR_MODE_LABEL, type Scar } from '../../state/scars'
import { useDrillProgress } from '../../state/drillProgress'
import { fmtNum } from '../../ui/fmt'

function ScarCard({ s }: { s: Scar }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontSize: 10.5, color: C.faint, marginBottom: 6 }}>
        <span style={{ color: C.storage, fontWeight: 700, letterSpacing: 1 }}>{SCAR_MODE_LABEL[s.mode].toUpperCase()}</span>
        <span>
          {s.theme} · {new Date(s.ts).toLocaleDateString()}
        </span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        <span style={{ color: C.alert }}>you: {s.what}</span>
        <span style={{ color: C.faint }}> · </span>
        <span style={{ color: C.ok }}>truth: {s.truth}</span>
      </div>
      <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginTop: 4, borderLeft: `2px solid ${C.line}`, paddingLeft: 8 }}>
        {s.lesson}
      </div>
    </div>
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

  return (
    <div style={{ maxWidth: 780 }}>
      <ModeHeader title="SCAR JOURNAL" thesis="every miss, logged with its lesson — misses are the curriculum">
        <TabNav
          tabs={[
            { id: 'log', label: '01 · CHRONOLOGICAL', sub: `${scars.length} scars` },
            { id: 'themes', label: '02 · BY THEME', sub: 'recurring blind spots' },
            { id: 'brief', label: '03 · PRE-INTERVIEW BRIEFING', sub: 'the night-before page' },
          ]}
          active={tab}
          onPick={(id) => navigate(`/journal/${id}`)}
        />
      </ModeHeader>

      {tab === 'log' &&
        (scars.length === 0 ? <Empty /> : [...scars].reverse().map((s, i) => <ScarCard key={scars.length - i} s={s} />))}

      {tab === 'themes' &&
        (scars.length === 0 ? (
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
        ))}

      {tab === 'brief' && (
        <div>
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
      )}
    </div>
  )
}
