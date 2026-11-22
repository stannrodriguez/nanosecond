import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Chip } from '../../ui/kit'
import { useRaf } from '../../ui/useRaf'
import { fmtBig, fmtDist, fmtTimeNs } from '../../ui/fmt'

/* TOY 01 — RACE LIGHT: pick an operation, watch how far light gets. */

const LIGHT_OPS = [
  {
    name: '1 CPU cycle',
    ns: 0.3,
    ch: C.compute,
    punch:
      'Light barely made it across the chip. One tick of a 3.3 GHz clock is only enough time for light to cross 9 cm. That is why a processor die stays around 2 cm wide and why clock speed stopped climbing: signals have to cross it before the next tick arrives.',
  },
  {
    name: 'L1 cache hit',
    ns: 1,
    ch: C.mem,
    punch:
      '30 cm: light just crossed your keyboard. L1 cache hits in a nanosecond because it sits millimetres away from the ALU. In hardware, fast and close are almost the same word.',
  },
  {
    name: 'RAM fetch (DRAM)',
    ns: 100,
    ch: C.mem,
    punch:
      'While the CPU waited on one value from RAM, light crossed a 30-metre building and the core sat idle for ~300 cycles. Closing that gap is the whole reason caches, hardware prefetchers, and data-locality engineering exist.',
  },
  {
    name: 'NVMe SSD read',
    ns: 80000,
    ch: C.storage,
    punch:
      '24 kilometres: light crossed an entire city while the SSD read trapped electrons out of one flash page. In that time, your CPU could have run roughly a quarter-million instructions. That divide between memory and disk is what every cache, buffer pool, and write batch is trying to keep you on the right side of.',
  },
  {
    name: 'HDD random read',
    ns: 8e6,
    ch: C.storage,
    punch:
      '2,400 km: light crossed half a continent while a metal arm moved one centimetre and waited for a spinning platter. That mechanical delay is the tax behind the 1000× random-vs-sequential gap in The Disk.',
  },
  {
    name: 'Cross-region round trip',
    ns: 7e7,
    ch: C.net,
    punch:
      '21,000 km: light traveled halfway around the planet, because the packet literally made that round trip. Nothing in the stack is broken or sluggish; the request just had to cross the Earth, and no software change shrinks the globe. That distance sets the hard floor under every strongly consistent multi-region write.',
  },
]

const LANDMARKS = [
  { m: 0.02, label: 'chip die' },
  { m: 0.3, label: 'keyboard' },
  { m: 2, label: 'server rack' },
  { m: 100, label: 'datacenter' },
  { m: 10e3, label: 'city' },
  { m: 1e6, label: '1,000 km' },
  { m: 4.5e6, label: 'US coast-to-coast' },
  { m: 2e7, label: 'half the planet' },
]
const LOG_MIN = Math.log10(0.005)
const LOG_MAX = Math.log10(4e7)
const xOf = (m: number) => ((Math.log10(Math.max(m, 0.005)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100

export function RaceLight({ onComplete }: { onComplete: () => void }) {
  const [opIdx, setOpIdx] = useState(2)
  const [u, setU] = useState(0)
  const [running, setRunning] = useState(false)
  const op = LIGHT_OPS[opIdx]
  const DUR = 4.5

  // Measure the track so landmark labels can be collision-hidden by real
  // pixel width (rules 3–4 of the app-wide label fix): keep the first and
  // last, drop any intermediate whose label box would overlap a neighbour,
  // and right-anchor the final label so it never spills past the edge.
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackW, setTrackW] = useState(800)
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setTrackW(el.clientWidth))
    ro.observe(el)
    setTrackW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const shownLandmarks = (() => {
    const CHAR = 6.2 // ≈ px per mono char at this size
    const PAD = 8
    const items = LANDMARKS.map((l) => ({
      xpx: (xOf(l.m) / 100) * trackW,
      w: Math.max(l.label.length, fmtDist(l.m).length) * CHAR,
    }))
    const lastIx = items.length - 1
    const lastLeft = items[lastIx].xpx - items[lastIx].w // reserved region for the right-anchored last label
    const show = new Set<number>([0, lastIx])
    let cursor = items[0].xpx + items[0].w + PAD
    for (let k = 1; k < lastIx; k++) {
      if (items[k].xpx >= cursor && items[k].xpx + items[k].w + PAD <= lastLeft) {
        show.add(k)
        cursor = items[k].xpx + items[k].w + PAD
      }
    }
    return show
  })()

  useRaf((dt) => {
    setU((prev) => {
      const next = prev + dt / DUR
      if (next >= 1) {
        setRunning(false)
        onComplete()
        return 1
      }
      return next
    })
  }, running)

  // elapsed time moves linearly in LOG space so every decade is visible
  const logStartNs = -1.5
  const logEndNs = Math.log10(op.ns)
  const elapsedNs = Math.pow(10, logStartNs + u * (logEndNs - logStartNs))
  const dist = 0.2998 * elapsedNs
  const cycles = elapsedNs / 0.3
  const done = u >= 1

  const start = (i: number) => {
    setOpIdx(i)
    setU(0)
    setRunning(true)
  }

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Nothing outruns light: 30 cm per nanosecond, the hard speed limit of physics. Pick an operation below to race it. The
        photon stops the instant the operation finishes, using the landmarks along the track as your ruler.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        {LIGHT_OPS.map((o, i) => (
          <Chip key={o.name} active={i === opIdx} onClick={() => start(i)} color={o.ch}>
            {o.name}
          </Chip>
        ))}
      </div>

      <div className="mono" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, margin: '16px 0 10px' }}>
        <span style={{ color: C.dim }}>
          Elapsed{' '}
          <b style={{ color: C.text, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtTimeNs(done ? op.ns : elapsedNs)}</b>
          {done ? '' : ` / ${fmtTimeNs(op.ns)}`}
        </span>
        <span style={{ color: C.dim }}>
          Light traveled{' '}
          <b style={{ color: op.ch, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtDist(done ? 0.2998 * op.ns : dist)}</b>
        </span>
        <span style={{ color: C.dim }}>
          CPU cycles spent{' '}
          <b style={{ color: C.compute, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtBig(done ? op.ns / 0.3 : cycles)}</b>
        </span>
      </div>

      {/* the log-scale racetrack */}
      <div
        ref={trackRef}
        style={{ position: 'relative', height: 120, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}
      >
        {LANDMARKS.map((l, i) => {
          const showLabel = shownLandmarks.has(i)
          const isLast = i === LANDMARKS.length - 1
          const anchor = isLast ? { right: 4 as const, textAlign: 'right' as const } : { left: 4 as const }
          return (
            <div key={l.label} style={{ position: 'absolute', left: `${xOf(l.m)}%`, top: 0, bottom: 0 }}>
              <div style={{ width: 1, height: '100%', background: C.line }} />
              {showLabel && (
                <>
                  <span className="mono" style={{ position: 'absolute', top: 8, ...anchor, fontSize: 10, color: C.faint, whiteSpace: 'nowrap' }}>
                    {l.label}
                  </span>
                  <span className="mono" style={{ position: 'absolute', bottom: 6, ...anchor, fontSize: 9, color: C.faint, whiteSpace: 'nowrap' }}>
                    {fmtDist(l.m)}
                  </span>
                </>
              )}
            </div>
          )
        })}
        {/* light trail */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '52%',
            height: 3,
            width: `${xOf(done ? 0.2998 * op.ns : dist)}%`,
            background: `linear-gradient(90deg, transparent, ${op.ch})`,
            boxShadow: `0 0 12px ${op.ch}`,
          }}
        />
        {/* photon */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${xOf(done ? 0.2998 * op.ns : dist)}% - 6px)`,
            top: 'calc(52% - 5px)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: `0 0 16px 4px ${op.ch}`,
          }}
        />
      </div>
      {/* caption on its own line — never sharing a band with the tick labels */}
      <div className="mono" style={{ fontSize: 10.5, color: C.faint, textAlign: 'right', marginTop: 6, whiteSpace: 'nowrap' }}>
        Log scale: each gridline gap is roughly ×100
      </div>

      {done && <Punchline color={op.ch}>{op.punch}</Punchline>}
      {!running && !done && <div style={{ color: C.faint, fontSize: 13, marginTop: 12 }}>Pick an operation above to start the race.</div>}
    </div>
  )
}
