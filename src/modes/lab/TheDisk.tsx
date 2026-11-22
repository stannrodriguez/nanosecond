import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Button } from '../../ui/kit'
import { useRaf } from '../../ui/useRaf'

/* TOY 02 — THE DISK: two identical 7200 RPM drives race, slowed 120×. */

interface DiskState {
  angle: number
  diskMs: number
  phase: 'seek' | 'rotwait' | 'read'
  phaseLeft: number
  headR: number
  targetR: number
  targetAngle: number
  randReads: number
  seqArc: number
  seqMB: number
  seqTrackR: number
}

function drawPlatter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  angle: number,
  opts: {
    headR: number
    reading: boolean
    target: { r: number; angle: number; hot: boolean } | null
    seqArc: number
    trackR: number
  },
) {
  ctx.save()
  ctx.translate(cx, cy)
  const grad = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R)
  grad.addColorStop(0, '#22345A')
  grad.addColorStop(1, '#101C36')
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = C.line
  ctx.stroke()
  ctx.rotate(angle)
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2)
    ctx.beginPath()
    ctx.moveTo(R * 0.2, 0)
    ctx.lineTo(R * 0.95, 0)
    ctx.strokeStyle = '#283A5C66'
    ctx.stroke()
  }
  ctx.restore()

  if (opts.seqArc > 0) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.beginPath()
    ctx.arc(0, 0, opts.trackR, angle, angle + opts.seqArc)
    ctx.strokeStyle = C.mem
    ctx.lineWidth = 7
    ctx.stroke()
    ctx.restore()
  }
  if (opts.target) {
    ctx.save()
    ctx.translate(cx, cy)
    const a = angle + opts.target.angle
    ctx.beginPath()
    ctx.arc(0, 0, opts.target.r, a - 0.12, a + 0.12)
    ctx.strokeStyle = opts.target.hot ? '#fff' : C.storage
    ctx.lineWidth = 7
    ctx.stroke()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.14, 0, Math.PI * 2)
  ctx.fillStyle = '#0B1426'
  ctx.fill()
  ctx.strokeStyle = C.line
  ctx.stroke()
  const pivotX = cx + R + 26
  const pivotY = cy + R * 0.85
  const headX = cx + opts.headR
  const headY = cy
  ctx.beginPath()
  ctx.moveTo(pivotX, pivotY)
  ctx.lineTo(headX, headY)
  ctx.strokeStyle = '#B9C6DE'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, 7, 0, Math.PI * 2)
  ctx.fillStyle = '#B9C6DE'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(headX, headY, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = opts.reading ? '#fff' : C.net
  ctx.fill()
}

export function TheDisk({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ diskMs: 0, randReads: 0, seqMB: 0, phase: 'idle' as string })
  const S = useRef<DiskState | null>(null)
  const won = useRef(false)

  const reset = () => {
    S.current = {
      angle: 0,
      diskMs: 0,
      phase: 'seek',
      phaseLeft: 4,
      headR: 60,
      targetR: 40 + Math.random() * 60,
      targetAngle: Math.random() * Math.PI * 2,
      randReads: 0,
      seqArc: 0,
      seqMB: 0,
      seqTrackR: 78,
    }
    setStats({ diskMs: 0, randReads: 0, seqMB: 0, phase: 'seek' })
  }
  useEffect(reset, [])

  useRaf((dt) => {
    const s = S.current
    if (!s) return
    const SLOW = 120
    const diskDt = (dt * 1000) / SLOW
    s.diskMs += diskDt
    const w = 2 * Math.PI * 120 // rad per disk-second (7200rpm)
    s.angle = (s.angle + w * (diskDt / 1000)) % (Math.PI * 2)

    if (s.phase === 'seek') {
      s.phaseLeft -= diskDt
      const p = Math.max(0, s.phaseLeft / 4)
      s.headR = s.headR + (s.targetR - s.headR) * (1 - p) * 0.3
      if (s.phaseLeft <= 0) {
        s.headR = s.targetR
        s.phase = 'rotwait'
      }
    } else if (s.phase === 'rotwait') {
      const sectorA = (s.angle + s.targetAngle) % (Math.PI * 2)
      if (sectorA < 0.15 || sectorA > Math.PI * 2 - 0.02) {
        s.phase = 'read'
        s.phaseLeft = 0.35
      }
    } else if (s.phase === 'read') {
      s.phaseLeft -= diskDt
      if (s.phaseLeft <= 0) {
        s.randReads += 1
        s.targetR = 40 + Math.random() * 60
        s.targetAngle = Math.random() * Math.PI * 2
        s.phase = 'seek'
        s.phaseLeft = 4
      }
    }
    s.seqArc = Math.min(Math.PI * 1.9, s.seqArc + w * (diskDt / 1000))
    s.seqMB += 200 * (diskDt / 1000)

    const cv = canvasRef.current
    if (cv) {
      const ctx = cv.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height)
        ctx.font = "11px 'IBM Plex Mono', monospace"
        drawPlatter(ctx, 150, 130, 100, s.angle, {
          headR: s.headR,
          reading: s.phase === 'read',
          target: { r: s.targetR, angle: s.targetAngle, hot: s.phase === 'read' },
          seqArc: 0,
          trackR: 0,
        })
        ctx.fillStyle = C.storage
        ctx.fillText('RANDOM READS', 96, 262)
        ctx.fillStyle = C.faint
        ctx.fillText(s.phase === 'seek' ? 'moving arm to track…' : s.phase === 'rotwait' ? 'waiting for sector…' : 'reading sector!', 92, 278)
        drawPlatter(ctx, 470, 130, 100, s.angle, { headR: s.seqTrackR, reading: true, target: null, seqArc: s.seqArc, trackR: s.seqTrackR })
        ctx.fillStyle = C.mem
        ctx.fillText('SEQUENTIAL STREAM', 400, 262)
        ctx.fillStyle = C.faint
        ctx.fillText('arm stays put, data streams', 392, 278)
      }
    }
    if (!won.current && s.randReads >= 3 && (s.seqMB * 1024) / (s.randReads * 4) > 300) {
      won.current = true
      onComplete()
    }
    setStats({ diskMs: s.diskMs, randReads: s.randReads, seqMB: s.seqMB, phase: s.phase })
  }, running)

  const randKB = stats.randReads * 4
  const ratio = randKB > 0 ? (stats.seqMB * 1024) / randKB : 0

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Two identical 7200 RPM hard drives, slowed 120× so you can see the mechanics. The left drive does what a database without an index, or a badly designed one, asks: swing
        the actuator arm to a new track (~4 ms), then <i>wait for the spinning platter to carry the sector underneath it</i> (~4
        ms on average). The right drive parks the head on one track and streams continuously. Same hardware, opposite access
        patterns. Watch the gap open up.
      </p>
      <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
        <Button variant={running ? 'secondary' : 'primary'} size="lg" onClick={() => setRunning(!running)}>
          {running ? 'Pause' : stats.diskMs > 0 ? 'Resume' : 'Start the race'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRunning(false)
            reset()
          }}
          style={{ background: C.panel, fontWeight: 400 }}
        >
          Reset
        </Button>
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 8, overflowX: 'auto' }}>
        <canvas ref={canvasRef} width={620} height={290} style={{ width: '100%', maxWidth: 620, display: 'block', margin: '0 auto' }} />
      </div>
      <div className="mono" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, marginTop: 12 }}>
        <span style={{ color: C.dim }}>
          Disk time <b style={{ color: C.text }}>{stats.diskMs.toFixed(0)} ms</b>
        </span>
        <span style={{ color: C.dim }}>
          Random: <b style={{ color: C.storage }}>{stats.randReads} reads</b> ({randKB} KB)
        </span>
        <span style={{ color: C.dim }}>
          Sequential: <b style={{ color: C.mem }}>{stats.seqMB.toFixed(1)} MB</b>
        </span>
        {ratio > 1 && (
          <span style={{ color: C.compute }}>
            Sequential is ahead by <b>{Math.round(ratio).toLocaleString()}×</b>
          </span>
        )}
      </div>
      <Punchline color={C.storage}>
        The random drive tops out around <b>120 reads/second</b>. That ceiling comes straight from spinning metal (7200 RPM is
        8.3 ms per revolution, so you wait half a spin on average) and no clever software can outrun it. Much of the modern data
        stack exists to work around this single gap: B-trees minimize how many jumps a lookup needs, LSM-trees and write-ahead
        logs turn random writes into sequential appends, and Kafka hits huge throughput <i>precisely because</i> it treats
        storage like the right-hand platter behind an API. Even on SSDs with no moving parts, sequential access still beats
        random access. The ratio shrinks, yet the same storage architectures still win.
      </Punchline>
    </div>
  )
}
