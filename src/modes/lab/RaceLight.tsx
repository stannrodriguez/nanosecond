import { useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'
import { fmtBig, fmtDist, fmtTimeNs } from '../../ui/fmt'

/* TOY 01 — RACE LIGHT: pick an operation, watch how far light gets. */

const LIGHT_OPS = [
  {
    name: '1 CPU cycle',
    ns: 0.3,
    ch: C.compute,
    punch:
      "Light barely crossed the chip. One tick of a 3.3 GHz clock is the time light needs to cross a die 9 cm wide — this is WHY chips are 2 cm across, and why clock speed stopped climbing. The chip can't be bigger than one tick of light.",
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
      "While your CPU fetched ONE value from RAM, light crossed a 30-metre building — and the CPU sat through ~300 cycles doing nothing. That idle gap is the entire reason caches, prefetching, and 'keep it in L1' engineering exist.",
  },
  {
    name: 'NVMe SSD read',
    ns: 80000,
    ch: C.storage,
    punch:
      "24 kilometres — light crossed the whole city while the drive sensed trapped electrons in one flash page. Your CPU could have executed a quarter-million instructions. This is the wall between 'in memory' and 'on disk' — the single most important line in systems design.",
  },
  {
    name: 'HDD random read',
    ns: 8e6,
    ch: C.storage,
    punch:
      '2,400 km — light crossed half the continent while a metal arm swung one centimetre and waited for a platter to spin. Now go to THE DISK toy and watch it happen.',
  },
  {
    name: 'Cross-region round trip',
    ns: 7e7,
    ch: C.net,
    punch:
      "21,000 km — light went HALFWAY AROUND THE PLANET, because that's literally what the round trip is. Nothing is 'slow' here; the request simply traveled the Earth. This is why multi-region sync consistency costs what it costs. Geography is the final boss.",
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
        Light is the fastest thing that can ever exist — 30 cm per nanosecond. Pick an operation and race it. Where light ends up
        when the operation finishes IS the intuition for that number.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
        {LIGHT_OPS.map((o, i) => (
          <button
            key={o.name}
            onClick={() => start(i)}
            className="mono"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: i === opIdx ? o.ch : C.panel,
              color: i === opIdx ? C.bg : C.dim,
              border: `1px solid ${i === opIdx ? o.ch : C.line}`,
            }}
          >
            {o.name}
          </button>
        ))}
      </div>

      <div className="mono" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, margin: '16px 0 10px' }}>
        <span style={{ color: C.dim }}>
          elapsed <b style={{ color: C.text, fontSize: 16 }}>{fmtTimeNs(done ? op.ns : elapsedNs)}</b>
          {done ? '' : ` / ${fmtTimeNs(op.ns)}`}
        </span>
        <span style={{ color: C.dim }}>
          light traveled <b style={{ color: op.ch, fontSize: 16 }}>{fmtDist(done ? 0.2998 * op.ns : dist)}</b>
        </span>
        <span style={{ color: C.dim }}>
          CPU cycles burned <b style={{ color: C.compute, fontSize: 16 }}>{fmtBig(done ? op.ns / 0.3 : cycles)}</b>
        </span>
      </div>

      {/* the log-scale racetrack */}
      <div style={{ position: 'relative', height: 120, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
        {LANDMARKS.map((l) => (
          <div key={l.label} style={{ position: 'absolute', left: `${xOf(l.m)}%`, top: 0, bottom: 0 }}>
            <div style={{ width: 1, height: '100%', background: C.line }} />
            <span className="mono" style={{ position: 'absolute', top: 8, left: 4, fontSize: 10, color: C.faint, whiteSpace: 'nowrap' }}>
              {l.label}
            </span>
            <span className="mono" style={{ position: 'absolute', bottom: 6, left: 4, fontSize: 9, color: C.faint }}>
              {fmtDist(l.m)}
            </span>
          </div>
        ))}
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
        <span className="mono" style={{ position: 'absolute', right: 10, top: 8, fontSize: 10, color: C.faint }}>
          log scale — every gridline gap ≈ ×100
        </span>
      </div>

      {done && <Punchline color={op.ch}>{op.punch}</Punchline>}
      {!running && !done && <div style={{ color: C.faint, fontSize: 13, marginTop: 12 }}>Click an operation to start the race.</div>}
    </div>
  )
}
