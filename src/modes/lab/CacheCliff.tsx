import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Term as T } from '../../ui/Term'

/* TOY 13 — THE CACHE CLIFF: your data's home, not your instruction count,
   sets your speed. Grow the working set past L1→L2→L3→DRAM and watch the
   identical work fall off a cliff — and watch locality move the cliff. */

type Pattern = 'sequential' | 'random'

interface Level {
  name: string
  capKB: number
  ns: number
  color: string
}

// The latency ladder's top rungs, as capacities (numbers.ts: l1/l2/l3/dram).
const LEVELS: Level[] = [
  { name: 'L1', capKB: 48, ns: 1, color: C.ok },
  { name: 'L2', capKB: 1024, ns: 4, color: C.mem },
  { name: 'L3', capKB: 32768, ns: 12, color: C.compute },
  { name: 'DRAM', capKB: Infinity, ns: 100, color: C.alert },
]

const backingFor = (kb: number): Level => LEVELS.find((l) => kb <= l.capKB)!
// Random pointer-chase pays the full latency of the smallest level that holds the set.
const randomNs = (kb: number): number => backingFor(kb).ns
// Sequential stride-1 reuses each 64-byte line ~8× and the prefetcher hides most
// of the rest, so it barely feels the cliff (numbers.ts: cache-line).
const seqNs = (kb: number): number => 1 + ((backingFor(kb).ns - 1) / 8) * 0.6
const avgNs = (kb: number, pat: Pattern): number => (pat === 'random' ? randomNs(kb) : seqNs(kb))

const fmtSize = (kb: number): string => (kb >= 1024 ? `${(kb / 1024).toFixed(kb >= 10240 ? 0 : 1)} MB` : `${Math.round(kb)} KB`)

// chart geometry
const W = 560
const H = 210
const PADL = 42
const PADR = 14
const PADT = 14
const PADB = 30
const L2MIN = 2 // 4 KB
const L2MAX = 16 // 64 MB
const NSMIN = 0.8
const NSMAX = 130
const xr = (l2: number) => PADL + ((l2 - L2MIN) / (L2MAX - L2MIN)) * (W - PADL - PADR)
const yr = (ns: number) =>
  PADT + ((Math.log(NSMAX) - Math.log(ns)) / (Math.log(NSMAX) - Math.log(NSMIN))) * (H - PADT - PADB)

const curve = (pat: Pattern): string => {
  const pts: string[] = []
  for (let l2 = L2MIN; l2 <= L2MAX + 0.001; l2 += 0.08) {
    const kb = 2 ** l2
    pts.push(`${xr(l2).toFixed(1)},${yr(avgNs(kb, pat)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export function CacheCliff({ onComplete }: { onComplete: () => void }) {
  const [l2, setL2] = useState(4) // 16 KB — starts inside L1
  const [pattern, setPattern] = useState<Pattern>('random')
  const sawCliff = useRef(false)

  const sizeKB = 2 ** l2
  const level = backingFor(sizeKB)
  const avg = avgNs(sizeKB, pattern)
  const mult = avg / 1

  useEffect(() => {
    if (!sawCliff.current && pattern === 'random' && avg >= 50) {
      sawCliff.current = true
      onComplete()
    }
  }, [avg, pattern, onComplete])

  const seqPts = curve('sequential')
  const randPts = curve('random')

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Below is the memory ladder as a chart: how long one access takes as your working set grows. Drag the set from a few KB
        to 64 MB and the marker climbs L1 → L2 → L3 → DRAM — the same loop, up to <b>100× the wait</b>. Then flip between a
        sequential walk and a random pointer-chase: order decides whether you ride the 64-byte{' '}
        <T k="cacheline">cache line</T> or waste it.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}>
            working set: <b style={{ color: level.color, fontSize: 17 }}>{fmtSize(sizeKB)}</b>{' '}
            <span style={{ color: C.faint }}>· lives in {level.name}</span>
          </span>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}>
            avg access:{' '}
            <b style={{ color: level.color, fontSize: 17 }}>{avg < 10 ? avg.toFixed(1) : Math.round(avg)} ns</b>
            <span style={{ color: C.faint }}> · ≈ {mult < 2 ? '1' : Math.round(mult)}× vs L1</span>
          </span>
        </div>
        <input
          type="range"
          min={L2MIN}
          max={L2MAX}
          step={0.1}
          value={l2}
          onChange={(e) => setL2(+e.target.value)}
          style={{ marginTop: 12 }}
          aria-label="working set size (log scale)"
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {(['sequential', 'random'] as Pattern[]).map((p) => (
            <button
              key={p}
              onClick={() => setPattern(p)}
              className="mono"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: pattern === p ? (p === 'random' ? C.alert : C.ok) : C.panelUp,
                color: pattern === p ? C.bg : C.dim,
                border: `1px solid ${pattern === p ? (p === 'random' ? C.alert : C.ok) : C.line}`,
              }}
            >
              {p === 'sequential' ? 'sequential (stride-1)' : 'random (pointer-chase)'}
            </button>
          ))}
          <span className="mono" style={{ fontSize: 11, color: C.faint, alignSelf: 'center' }}>
            same work, same bytes — only the access order changes
          </span>
        </div>

        {/* the staircase */}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14 }} role="img" aria-label="latency vs working-set-size staircase">
          {/* level capacity boundaries */}
          {LEVELS.slice(0, 3).map((lv) => {
            const x = xr(Math.log2(lv.capKB))
            return (
              <g key={lv.name}>
                <line x1={x} y1={PADT} x2={x} y2={H - PADB} stroke={C.line} strokeDasharray="3 4" />
                <text x={x - 4} y={PADT + 9} textAnchor="end" fill={C.faint} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
                  {lv.name} {fmtSize(lv.capKB)}
                </text>
              </g>
            )
          })}
          {/* axes */}
          <line x1={PADL} y1={H - PADB} x2={W - PADR} y2={H - PADB} stroke={C.line} />
          <line x1={PADL} y1={PADT} x2={PADL} y2={H - PADB} stroke={C.line} />
          {/* ladder ticks */}
          {LEVELS.map((lv) => (
            <text key={lv.name} x={6} y={yr(lv.ns) + 3} fill={lv.color} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
              {lv.ns}ns
            </text>
          ))}
          {/* the two curves — both always drawn so the gap is visible */}
          <polyline points={seqPts} fill="none" stroke={C.ok} strokeWidth={pattern === 'sequential' ? 3 : 1.5} opacity={pattern === 'sequential' ? 1 : 0.4} />
          <polyline points={randPts} fill="none" stroke={C.alert} strokeWidth={pattern === 'random' ? 3 : 1.5} opacity={pattern === 'random' ? 1 : 0.4} />
          {/* current marker */}
          <circle cx={xr(l2)} cy={yr(avg)} r={6} fill={level.color} stroke={C.bg} strokeWidth={1.5} />
          <text x={PADL} y={H - 8} fill={C.faint} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
            working set (log) →
          </text>
          <text x={W - PADR} y={H - 8} fill={C.faint} fontSize={9.5} textAnchor="end" fontFamily="'IBM Plex Mono', monospace">
            green = sequential · red = random
          </text>
        </svg>
      </div>

      <Punchline color={C.mem}>
        Same loop, same bytes, up to <b>100× the time</b> — the only thing that changed is whether the data fit in a cache and
        whether you walked it in order. That's the whole reason an array of structs can crush a linked list of the identical
        fields, why column stores like Parquet exist, and why "make it fit in <T k="cpucache">cache</T>" beats
        almost every micro-optimization. Your Race Light ladder isn't trivia: L1, L2, L3, DRAM are the rungs your hottest code
        hits millions of times a second — and <i>which</i> rung is a layout decision you make, not a constant you inherit.
      </Punchline>
    </div>
  )
}
