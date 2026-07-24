import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Term as T } from '../../ui/Term'

/* TOY 17 — THE TLB TOLL: RAM has a SECOND cliff beyond the caches. Every access
   is really translate-then-fetch; the TLB caches translations, and when the
   working set outgrows its reach you pay a page-walk on every access — then, in
   swap, you fall onto the disk rungs from toy 02. Sibling of The Cache Cliff. */

const PAGE_KB = 4
const TLB_ENTRIES = 1536
const TLB_REACH_KB = TLB_ENTRIES * PAGE_KB // ~6 MB translated for free
const RAM_KB = 16 * 1024 * 1024 // 16 GB
const FETCH_NS = 100 // a DRAM fetch (toy 03)
const WALK_NS = 100 // a page-table walk: extra memory trips to translate
const FAULT_NS = 8_000_000 // a page fault to disk (toy 02's 8 ms seek)

interface Regime {
  name: string
  translate: number
  fetch: number
  color: string
  note: string
}
const regimeFor = (kb: number): Regime => {
  if (kb <= TLB_REACH_KB) return { name: 'TLB-covered', translate: 0, fetch: FETCH_NS, color: C.ok, note: 'translation is free — the TLB has the mapping' }
  if (kb <= RAM_KB) return { name: 'page-walk', translate: WALK_NS, fetch: FETCH_NS, color: C.compute, note: 'TLB miss: the CPU walks the page table on almost every access' }
  return { name: 'swap', translate: WALK_NS, fetch: FAULT_NS, color: C.alert, note: 'the page is on disk — every touch is a fault (~8 ms)' }
}

const fmtSize = (kb: number) => (kb >= 1024 * 1024 ? `${Math.round(kb / 1024 / 1024)} GB` : kb >= 1024 ? `${Math.round(kb / 1024)} MB` : `${Math.round(kb)} KB`)
const fmtNs = (ns: number) => (ns >= 1_000_000 ? `${(ns / 1_000_000).toFixed(1)} ms` : ns >= 1000 ? `${(ns / 1000).toFixed(1)} µs` : `${Math.round(ns)} ns`)

const W = 560
const H = 200
const PADL = 46
const PADB = 28
const L2MIN = 10 // 1 MB (2^10 KB)
const L2MAX = 26 // 64 GB
const NSMIN = 60
const NSMAX = 12_000_000
const xr = (l2: number) => PADL + ((l2 - L2MIN) / (L2MAX - L2MIN)) * (W - PADL - 12)
const yr = (ns: number) => 14 + ((Math.log(NSMAX) - Math.log(Math.max(ns, NSMIN))) / (Math.log(NSMAX) - Math.log(NSMIN))) * (H - PADB - 14)
const effAt = (kb: number) => {
  const r = regimeFor(kb)
  return r.translate + r.fetch
}

export function TlbToll({ onComplete }: { onComplete: () => void }) {
  const [l2, setL2] = useState(12) // 4 MB — inside TLB reach
  const sawToll = useRef(false)
  const sizeKB = 2 ** l2
  const r = regimeFor(sizeKB)
  const eff = r.translate + r.fetch

  useEffect(() => {
    if (!sawToll.current && sizeKB > TLB_REACH_KB) {
      sawToll.current = true
      onComplete()
    }
  }, [sizeKB])

  const pts: string[] = []
  for (let x = L2MIN; x <= L2MAX + 0.001; x += 0.1) pts.push(`${xr(x).toFixed(1)},${yr(effAt(2 ** x)).toFixed(1)}`)

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Programs address a private, imaginary memory; the hardware translates every <T k="virtualmemory">address</T> to a real one
        first — so each access is secretly <b>translate, then fetch</b>. A small cache called the TLB keeps recent translations
        free. Grow the working set past what it can cover and a second cliff appears — one the <T k="cache">caches</T> can't
        save you from.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}>
            working set: <b style={{ color: r.color, fontSize: 17 }}>{fmtSize(sizeKB)}</b>{' '}
            <span style={{ color: C.faint }}>· {r.name}</span>
          </span>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}>
            per access: <b style={{ color: r.color, fontSize: 17 }}>{fmtNs(eff)}</b>
          </span>
        </div>
        <input type="range" min={L2MIN} max={L2MAX} step={0.1} value={l2} onChange={(e) => setL2(+e.target.value)} style={{ marginTop: 12 }} aria-label="working set size (log scale)" />
        <div className="mono" style={{ fontSize: 11.5, color: r.color, marginTop: 8 }}>{r.note}</div>

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 10 }} role="img" aria-label="effective access time vs working set">
          {[
            [TLB_REACH_KB, 'TLB reach ~6 MB'],
            [RAM_KB, 'RAM 16 GB'],
          ].map(([kb, label]) => (
            <g key={label as string}>
              <line x1={xr(Math.log2(kb as number))} y1={14} x2={xr(Math.log2(kb as number))} y2={H - PADB} stroke={C.line} strokeDasharray="3 4" />
              <text x={xr(Math.log2(kb as number)) - 4} y={24} textAnchor="end" fill={C.faint} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
                {label as string}
              </text>
            </g>
          ))}
          {[
            [FETCH_NS, '100ns'],
            [FETCH_NS + WALK_NS, '200ns'],
            [FAULT_NS, '8ms'],
          ].map(([ns, lab]) => (
            <text key={lab as string} x={4} y={yr(ns as number) + 3} fill={C.faint} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
              {lab as string}
            </text>
          ))}
          <line x1={PADL} y1={H - PADB} x2={W - 12} y2={H - PADB} stroke={C.line} />
          <polyline points={pts.join(' ')} fill="none" stroke={C.storage} strokeWidth={2.5} />
          <circle cx={xr(l2)} cy={yr(eff)} r={6} fill={r.color} stroke={C.bg} strokeWidth={1.5} />
          <text x={PADL} y={H - 8} fill={C.faint} fontSize={9.5} fontFamily="'IBM Plex Mono', monospace">
            working set (log) → · effective access time (log)
          </text>
        </svg>
      </div>

      <Punchline color={C.mem}>
        "It fits in RAM" was never the last question — it has to fit in the <i>map</i> of RAM too. Inside the TLB's reach,
        translation is invisible; past it you pay a <b>page walk</b> on nearly every access, and past physical RAM you fall onto
        the disk rungs from <b>The Disk</b> — a ~{Math.round(FAULT_NS / (FETCH_NS + WALK_NS)).toLocaleString()}× cliff the moment
        you touch swap. This is why huge-memory workloads reach for huge pages (fewer, bigger mappings) and why "the box started
        swapping" is a synonym for "the box died."
      </Punchline>
    </div>
  )
}
