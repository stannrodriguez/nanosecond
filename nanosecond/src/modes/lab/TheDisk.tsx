import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
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

export function TheDisk() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ diskMs: 0, randReads: 0, seqMB: 0, phase: 'idle' as string })
  const S = useRef<DiskState | null>(null)

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
        ctx.fillText(s.phase === 'seek' ? 'seeking (arm moving)…' : s.phase === 'rotwait' ? 'waiting for rotation…' : 'reading!', 92, 278)
        drawPlatter(ctx, 470, 130, 100, s.angle, { headR: s.seqTrackR, reading: true, target: null, seqArc: s.seqArc, trackR: s.seqTrackR })
        ctx.fillStyle = C.mem
        ctx.fillText('SEQUENTIAL STREAM', 400, 262)
        ctx.fillStyle = C.faint
        ctx.fillText('head never moves — data flows', 392, 278)
      }
    }
    setStats({ diskMs: s.diskMs, randReads: s.randReads, seqMB: s.seqMB, phase: s.phase })
  }, running)

  const randKB = stats.randReads * 4
  const ratio = randKB > 0 ? (stats.seqMB * 1024) / randKB : 0

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Two identical 7200 RPM drives, slowed 120× so you can watch. The left one does what a database without an index (or a
        badly designed one) asks: jump to a random sector — swing the arm (~4 ms), then <i>wait for the platter to bring the data
        around</i> (~4 ms average). The right one refuses to move the head and just streams. Same hardware. Watch the score.
      </p>
      <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
        <button
          onClick={() => setRunning(!running)}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            background: running ? C.panelUp : C.net,
            color: running ? C.text : C.bg,
            border: `1px solid ${running ? C.line : C.net}`,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {running ? 'Pause' : stats.diskMs > 0 ? 'Resume' : 'Start the race'}
        </button>
        <button
          onClick={() => {
            setRunning(false)
            reset()
          }}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: C.panel,
            color: C.dim,
            border: `1px solid ${C.line}`,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 8, overflowX: 'auto' }}>
        <canvas ref={canvasRef} width={620} height={290} style={{ width: '100%', maxWidth: 620, display: 'block', margin: '0 auto' }} />
      </div>
      <div className="mono" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, marginTop: 12 }}>
        <span style={{ color: C.dim }}>
          disk time <b style={{ color: C.text }}>{stats.diskMs.toFixed(0)} ms</b>
        </span>
        <span style={{ color: C.dim }}>
          random: <b style={{ color: C.storage }}>{stats.randReads} reads</b> ({randKB} KB)
        </span>
        <span style={{ color: C.dim }}>
          sequential: <b style={{ color: C.mem }}>{stats.seqMB.toFixed(1)} MB</b>
        </span>
        {ratio > 1 && (
          <span style={{ color: C.compute }}>
            sequential is winning <b>{Math.round(ratio).toLocaleString()}×</b>
          </span>
        )}
      </div>
      <Punchline color={C.storage}>
        The random drive maxes out near <b>120 reads/second</b> — that number is rotation physics (7200 RPM = 8.3 ms/rev, you
        wait half a spin on average) and cannot be engineered away. The entire modern data stack is built to dodge this: B-trees
        minimize the jumps, LSM-trees &amp; write-ahead logs convert writes into pure appends, and Kafka is fast{' '}
        <i>precisely because</i> it's just the right-hand platter with an API. Even on SSDs (no moving parts) the
        sequential-beats-random asymmetry survives — smaller, but it drives the same designs.
      </Punchline>
    </div>
  )
}
