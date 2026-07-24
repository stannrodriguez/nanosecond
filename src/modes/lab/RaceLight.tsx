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
      "Light barely crossed the chip. One tick of a 3.3 GHz clock is the time light needs to cross a die 9 cm wide — this is why chips are 2 cm across, and why clock speed stopped climbing. The chip can't be bigger than one tick of light.",
  },
  {
    name: 'L1 cache hit',
    ns: 1,
    ch: C.mem,
    punch:
      "30 cm — light crossed your keyboard. L1 is fast because it's physically millimetres from the ALU. 'Fast' and 'close' are the same word in hardware.",
  },
  {
    name: 'RAM fetch (DRAM)',
    ns: 100,
    ch: C.mem,
    punch:
      "While your CPU fetched one value from RAM, light crossed a 30-metre building — and the CPU sat through ~300 cycles doing nothing. That idle gap is the entire reason caches, prefetching, and 'keep it in L1' engineering exist.",
  },
  {
    name: 'NVMe SSD read',
    ns: 80000,
    ch: C.storage,
    punch:
      "24 kilometres — light crossed the whole city while the drive sensed trapped electrons in one flash page. Your CPU could have executed a quarter-million instructions. This is the wall between 'in memory' and 'on disk' — the line every cache, buffer, and batch exists to keep work on the right side of.",
  },
  {
    name: 'HDD random read',
    ns: 8e6,
    ch: C.storage,
    punch:
      '2,400 km — light crossed half the continent while a metal arm swung one centimetre and waited for a platter to spin. That one swing is the mechanical fee behind THE DISK\'s 1000× random-vs-sequential gap.',
  },
  {
    name: 'Cross-region round trip',
    ns: 7e7,
    ch: C.net,
    punch:
      "21,000 km — light went halfway around the planet, because that's literally what the round trip is. Nothing here is 'slow'; the request simply traveled the Earth, and no engineering shortens the Earth. That distance is the floor under every multi-region strongly-consistent write.",
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
        Nothing outruns light — 30 cm per nanosecond, the universe's hard speed limit. Pick an operation and race it: the
        photon stops where the operation finishes, and the landmarks below are your ruler.
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
          elapsed{' '}
          <b style={{ color: C.text, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtTimeNs(done ? op.ns : elapsedNs)}</b>
          {done ? '' : ` / ${fmtTimeNs(op.ns)}`}
        </span>
        <span style={{ color: C.dim }}>
          light traveled{' '}
          <b style={{ color: op.ch, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmtDist(done ? 0.2998 * op.ns : dist)}</b>
        </span>
        <span style={{ color: C.dim }}>
          CPU cycles burned{' '}
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
        log scale — every gridline gap ≈ ×100
      </div>

      {done && <Punchline color={op.ch}>{op.punch}</Punchline>}
      {!running && !done && <div style={{ color: C.faint, fontSize: 13, marginTop: 12 }}>Click an operation to start the race.</div>}
    </div>
  )
}
