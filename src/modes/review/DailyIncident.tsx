import { useState } from 'react'
import { C } from '../../theme'
import { Diagram } from '../../ui/Diagram'
import { Panel, Button, Eyebrow } from '../../ui/kit'
import { FramePlayer } from '../../ui/FramePlayer'
import { SOUND } from '../../content/puzzles'
import { useScars } from '../../state/scars'
import { useJudgment } from '../../state/judgment'
import { useDaily, todayStr, dailyPuzzle, incidentNumber, shareString } from '../../state/daily'
import { Postmortem } from './Postmortem'
import { TeachBackCard } from './TeachBackCard'

// Daily Incident (product-spec §3.5): one date-seeded flaw puzzle per day,
// one shot, a solve streak, and a spoiler-free share string. The app's front
// door into the judgment gym.
export function DailyIncident() {
  const { addScar, addSoundbite } = useScars()
  const record = useJudgment((s) => s.record)
  const { results, streak, bestStreak, record: recordDaily } = useDaily()
  const today = todayStr()
  const p = dailyPuzzle(today)
  const n = incidentNumber(today)
  const already = results[today]

  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'inspect' | 'reveal' | 'done'>('inspect')
  const [copied, setCopied] = useState(false)

  const correct = p.fine ? picked === SOUND : picked === p.flaw
  const solved = already ? already.solved : correct

  const commit = (choice: string) => {
    setPicked(choice)
    setPhase('reveal')
    const right = p.fine ? choice === SOUND : choice === p.flaw
    recordDaily(today, right, p.id)
    record('flaw', right ? 100 : 0, 100)
    addSoundbite(p.line)
    if (!right) {
      const what = choice === SOUND ? 'declared it sound' : p.nodes.find((nn) => nn.id === choice)?.label ?? 'nothing'
      const truth = p.fine ? 'the design was actually sound' : p.nodes.find((nn) => nn.id === p.flaw)?.label ?? ''
      addScar({ mode: 'flaw', theme: `Daily Incident #${n}`, what, truth, lesson: p.explain.split('. ')[0] + '.' })
    }
  }

  const share = async () => {
    const s = shareString(today, solved, streak)
    try {
      await navigator.clipboard.writeText(s)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — the string is still visible below to copy by hand
    }
  }

  const done = phase === 'done' || !!already

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <Eyebrow color={C.gold}>DAILY INCIDENT · #{n}</Eyebrow>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
            {already && phase === 'inspect' ? "Today's incident — already faced" : p.title}
          </div>
        </div>
        <StreakChip streak={streak} best={bestStreak} />
      </div>

      {/* Already played today: a spoiler-OK recap, no replay. */}
      {already && phase === 'inspect' ? (
        <div style={{ marginTop: 12 }}>
          <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: already.solved ? C.ok : C.alert }}>
            {already.solved ? '✓ You caught it.' : '✗ It got you.'} Come back tomorrow for Incident #{n + 1}.
          </div>
          <Postmortem p={p} />
          <ShareRow onShare={share} copied={copied} text={shareString(today, already.solved, streak)} />
        </div>
      ) : (
        <>
          <div className="mono" style={{ fontSize: 11.5, color: C.compute, margin: '10px 0 8px' }}>
            {p.reqs}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text, marginBottom: 12 }}>{p.brief}</p>

          <Diagram
            nodes={p.nodes}
            edges={p.edges}
            picked={picked === SOUND ? null : picked}
            onPick={setPicked}
            flaw={p.flaw}
            fine={p.fine}
            revealed={done}
            locked={phase !== 'inspect'}
          />

          {phase === 'inspect' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <Button variant="danger" disabled={!picked || picked === SOUND} onClick={() => commit(picked!)} style={{ padding: '11px 24px' }}>
                {picked && picked !== SOUND ? 'Lock it in — one shot' : 'Click a component to accuse it'}
              </Button>
              <Button variant="ghost" onClick={() => commit(SOUND)} style={{ padding: '11px 20px' }}>
                …or declare it sound — ship it ✓
              </Button>
            </div>
          )}

          {(phase === 'reveal' || phase === 'done') && (
            <FramePlayer frames={p.frames} running={phase === 'reveal'} onEnd={() => setPhase('done')} />
          )}

          {phase === 'done' && (
            <div style={{ marginTop: 14 }}>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: correct ? C.ok : C.alert }}>
                {correct ? '✓ Caught it — streak intact.' : '✗ It got you. Streak reset — try again tomorrow.'}
              </div>
              <Postmortem p={p} />
              <ShareRow onShare={share} copied={copied} text={shareString(today, solved, streak)} />
              <TeachBackCard mode="flaw" topic={`Daily Incident #${n}`} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StreakChip({ streak, best }: { streak: number; best: number }) {
  return (
    <div
      className="mono"
      style={{ fontSize: 12, color: streak > 0 ? C.gold : C.dim, border: `1px solid ${C.line}`, borderRadius: 8, padding: '6px 12px' }}
    >
      🔥 {streak}-day streak{best > 0 && <span style={{ color: C.faint }}> · best {best}</span>}
    </div>
  )
}

function ShareRow({ onShare, copied, text }: { onShare: () => void; copied: boolean; text: string }) {
  return (
    <Panel style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <pre className="mono" style={{ fontSize: 12, color: C.dim, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {text}
        </pre>
        <Button size="sm" onClick={onShare}>
          {copied ? '✓ Copied' : 'Share result (spoiler-free)'}
        </Button>
      </div>
    </Panel>
  )
}
