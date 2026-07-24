import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'

/* TOY 04 — THE QUEUE: why every scale trigger on the cheat sheet says 70–80%. */

interface QueueState {
  queue: number[]
  busyLeft: number
  waits: number[]
  served: number
  t: number
}

export function TheQueue({ onComplete }: { onComplete: () => void }) {
  const [util, setUtil] = useState(0.6)
  const [, force] = useState(0)
  const S = useRef<QueueState>({ queue: [], busyLeft: 0, waits: [], served: 0, t: 0 })
  const sawKnee = useRef(false)

  const MU = 6 // service rate per second

  useRaf((dt) => {
    const s = S.current
    s.t += dt
    const lambda = util * MU
    if (Math.random() < lambda * dt) s.queue.push(s.t)
    if (s.busyLeft > 0) s.busyLeft -= dt
    if (s.busyLeft <= 0 && s.queue.length > 0) {
      const arrived = s.queue.shift()!
      s.waits.push(s.t - arrived)
      if (s.waits.length > 40) s.waits.shift()
      s.busyLeft = (0.7 + Math.random() * 0.6) / MU // variance is the villain
      s.served++
    }
    if (s.queue.length > 400) s.queue.length = 400
    if (!sawKnee.current && util >= 0.9 && s.queue.length > 15) {
      sawKnee.current = true
      onComplete()
    }
    force((x) => x + 1)
  }, true)

  const s = S.current
  const avgWaitMs = s.waits.length ? (s.waits.reduce((a, b) => a + b, 0) / s.waits.length) * 1000 : 0
  const theoWait = (rho: number) => (rho >= 0.995 ? 200 : rho / (1 - rho)) * (1000 / MU)

  const W = 560
  const H = 170
  const PAD = 34
  const pts: string[] = []
  for (let rho = 0.05; rho <= 0.99; rho += 0.01) {
    const x = PAD + ((rho - 0.05) / 0.94) * (W - PAD - 10)
    const y = H - 22 - Math.min(1, theoWait(rho) / 2500) * (H - 40)
    pts.push(`${x},${y}`)
  }
  const curX = PAD + ((util - 0.05) / 0.94) * (W - PAD - 10)
  const curY = H - 22 - Math.min(1, theoWait(util) / 2500) * (H - 40)

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        One server, requests arriving at random. Intuition says a server at 90% utilization is "fine — it has 10% spare." The
        queue disagrees. Because arrivals are <i>random</i>, they clump — and near full utilization there's no slack left to
        absorb a clump. Drag the slider and watch waiting time, not throughput.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 13, color: C.dim, whiteSpace: 'nowrap' }}>
            arrival rate:{' '}
            <b style={{ color: util >= 0.8 ? C.alert : C.net, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(util * 100)}%
            </b>{' '}
            of capacity
          </span>
          <span className="mono" style={{ fontSize: 13, color: C.dim, whiteSpace: 'nowrap' }}>
            avg wait:{' '}
            <b style={{ color: avgWaitMs > 400 ? C.alert : avgWaitMs > 150 ? C.compute : C.ok, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>
              {avgWaitMs.toFixed(0)} ms
            </b>
            <span style={{ color: C.faint }}> · in queue: {s.queue.length}</span>
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={98}
          value={util * 100}
          onChange={(e) => setUtil(+e.target.value / 100)}
          style={{ marginTop: 12 }}
          aria-label="arrival rate as percent of capacity"
        />

        {/* live queue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, minHeight: 34 }}>
          <div
            className="mono"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: s.busyLeft > 0 ? C.net : C.panelUp,
              border: `2px solid ${C.net}`,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: s.busyLeft > 0 ? C.bg : C.dim,
            }}
          >
            {s.busyLeft > 0 ? 'BUSY' : 'idle'}
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', flex: 1 }}>
            {s.queue.slice(0, 120).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < 10 ? C.compute : C.alert, opacity: 0.9 }} />
            ))}
            {s.queue.length > 120 && (
              <span className="mono" style={{ fontSize: 11, color: C.alert }}>
                +{s.queue.length - 120} more
              </span>
            )}
          </div>
        </div>

        {/* the hockey stick */}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14 }}>
          <line x1={PAD} y1={H - 22} x2={W - 8} y2={H - 22} stroke={C.line} />
          <line x1={PAD} y1={12} x2={PAD} y2={H - 22} stroke={C.line} />
          <polyline points={pts.join(' ')} fill="none" stroke={C.net} strokeWidth={2} />
          <line
            x1={PAD + ((0.8 - 0.05) / 0.94) * (W - PAD - 10)}
            y1={12}
            x2={PAD + ((0.8 - 0.05) / 0.94) * (W - PAD - 10)}
            y2={H - 22}
            stroke={C.compute}
            strokeDasharray="4 4"
          />
          <text
            x={PAD + ((0.8 - 0.05) / 0.94) * (W - PAD - 10) + 5}
            y={24}
            fill={C.compute}
            fontSize={11}
            fontFamily="'IBM Plex Mono', monospace"
          >
            80% — the knee
          </text>
          <circle cx={curX} cy={curY} r={6} fill={util >= 0.8 ? C.alert : C.ok} />
          <text x={PAD} y={H - 6} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            utilization →
          </text>
          <text x={PAD + 4} y={22} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            waiting time (theory: ~1/(1−ρ))
          </text>
        </svg>
      </div>

      <Punchline color={C.net}>
        Sit at 60% for a while, then drag to 92% and wait ten seconds. <b>Throughput barely changed; waiting exploded.</b> That's
        the whole secret: delay grows like 1/(1−utilization), a curve with a knee near 80%. Now re-read your cheat sheet — CPU
        &gt; 70%, memory &gt; 80%, throughput near 80% of max — every scale trigger is the same knee, on the same curve, for the
        same reason. And in an interview, "I'd provision to keep steady-state utilization near 60–70%" is a sentence that shows
        you know <i>why</i>, not just <i>what</i>.
      </Punchline>
    </div>
  )
}
