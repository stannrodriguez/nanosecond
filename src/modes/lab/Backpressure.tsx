import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Bar } from '../../ui/Bar'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'
import { fmtNum } from '../../ui/fmt'

/* TOY 11 — BACKPRESSURE: fast producer, slow consumer, a buffer must choose. */

const CONSUME = 8000 // msgs/s
const BUFFER_CAP = 20_000 // msgs, when bounded
const MSG_BYTES = 2_048
const OOM_MB = 512

type Policy = 'drop' | 'block' | 'unbounded'

export function Backpressure({ onComplete }: { onComplete: () => void }) {
  const [produce, setProduce] = useState(12000)
  const [policy, setPolicy] = useState<Policy>('drop')
  const [, force] = useState(0)
  const S = useRef({ buf: 0, dropped: 0, oomed: 0, sawIt: false })

  useRaf((dt) => {
    const s = S.current
    const inRate = policy === 'block' ? Math.min(produce, CONSUME + Math.max(0, (BUFFER_CAP - s.buf) / dt) * 0.001) : produce
    s.buf += (policy === 'block' ? Math.min(inRate, produce) : produce) * dt - CONSUME * dt
    s.buf = Math.max(0, s.buf)
    if (policy === 'drop' && s.buf > BUFFER_CAP) {
      s.dropped += s.buf - BUFFER_CAP
      s.buf = BUFFER_CAP
    }
    if (policy === 'block' && s.buf > BUFFER_CAP) s.buf = BUFFER_CAP
    if (policy === 'unbounded' && (s.buf * MSG_BYTES) / 1e6 > OOM_MB) {
      s.oomed += 1
      s.buf = 0 // the process died; everything in memory died with it
    }
    if (!s.sawIt && (s.dropped > 0 || s.oomed > 0 || (policy === 'block' && produce > CONSUME && s.buf >= BUFFER_CAP * 0.99))) {
      s.sawIt = true
      onComplete()
    }
    force((x) => x + 1)
  }, true)

  const s = S.current
  const memMB = (s.buf * MSG_BYTES) / 1e6
  const blockedRate = policy === 'block' && s.buf >= BUFFER_CAP * 0.99 ? produce - CONSUME : 0

  const policyBtn = (p: Policy, label: string, sub: string) => (
    <button
      key={p}
      onClick={() => { setPolicy(p); S.current.buf = Math.min(S.current.buf, BUFFER_CAP) }}
      style={{
        flex: '1 1 150px',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        background: policy === p ? C.panelUp : C.panel,
        border: `1.5px solid ${policy === p ? C.net : C.line}`,
        color: C.text,
      }}
    >
      <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: policy === p ? C.net : C.dim }}>{label}</div>
      <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{sub}</div>
    </button>
  )

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        A producer emits messages; a consumer handles {fmtNum(CONSUME)}/s, full stop. Between them: a buffer. The moment the
        producer runs hotter than the consumer, the buffer fills and the system MUST answer one question — who absorbs the
        overload? There are only three answers, and "pretend it's fine" is secretly the third.
      </p>
      <div style={{ margin: '14px 0' }}>
        <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
          producer: <b style={{ color: produce > CONSUME ? C.compute : C.text }}>{fmtNum(produce)}/s</b>
          <span style={{ color: C.faint }}> vs consumer {fmtNum(CONSUME)}/s</span>
        </div>
        <input type="range" min={2000} max={20000} step={500} value={produce} onChange={(e) => setProduce(+e.target.value)} aria-label="producer rate" />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {policyBtn('drop', 'SHED (drop)', 'bounded buffer, overflow is discarded')}
        {policyBtn('block', 'BLOCK', 'bounded buffer, producer forced to slow')}
        {policyBtn('unbounded', 'UNBOUNDED', '"just buffer it" — what could go wrong')}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        <Bar
          label={policy === 'unbounded' ? 'Buffer (no limit — measured in RAM)' : `Buffer (cap ${fmtNum(BUFFER_CAP)} msgs)`}
          u={policy === 'unbounded' ? memMB / OOM_MB : s.buf / BUFFER_CAP}
          ch={C.net}
          txt={policy === 'unbounded' ? `${memMB.toFixed(0)} MB` : `${fmtNum(s.buf)} msgs`}
          note={policy === 'unbounded' ? `process OOMs at ${OOM_MB} MB` : undefined}
        />
        <div className="mono" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, marginTop: 8 }}>
          {policy === 'drop' && (
            <span style={{ color: s.dropped > 0 ? C.alert : C.dim }}>
              dropped: <b>{fmtNum(s.dropped)}</b> msgs — visible, countable, alarmable
            </span>
          )}
          {policy === 'block' && (
            <span style={{ color: blockedRate > 0 ? C.compute : C.dim }}>
              producer slowed by <b>{fmtNum(blockedRate)}/s</b> — the pressure travels UPSTREAM
            </span>
          )}
          {policy === 'unbounded' && (
            <span style={{ color: s.oomed > 0 ? C.alert : C.dim }}>
              {s.oomed > 0 ? <b>💥 OOM-killed ×{s.oomed} — buffer AND process gone, all at once</b> : 'memory climbing… latency climbing with it…'}
            </span>
          )}
        </div>
      </div>

      <Punchline color={C.net}>
        An unbounded buffer doesn't avoid the choice — it converts overload into memory growth, rising latency for everything
        in line, and one deferred, bigger crash at the worst moment. Real systems choose on purpose: <b>shed</b> when freshness
        beats completeness (metrics, live video), <b>block</b> when the producer can safely slow (batch jobs, TCP itself — its
        window IS blocking backpressure), and bound every queue so the failure is a number you alarm on, not a surprise. "Every
        buffer bounded, every bound a decision" is a sentence that wins design reviews.
      </Punchline>
    </div>
  )
}
