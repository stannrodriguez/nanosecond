import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { useRaf } from '../../ui/useRaf'

/* TOY 03 — LEAKY BITS: RAM is billions of leaking buckets, refreshed forever. */

const GRID = 96 // 12 x 8

interface Cell {
  bit: 0 | 1
  level: number
  rate: number
  corrupt: boolean
}

const initCells = (): Cell[] =>
  Array.from({ length: GRID }, () => ({
    bit: Math.random() > 0.45 ? 1 : 0,
    level: 0.7 + Math.random() * 0.3,
    rate: 0.03 + Math.random() * 0.05, // charge lost per second (~1e10 slower than reality)
    corrupt: false,
  }))

export function LeakyBits({ onComplete }: { onComplete: () => void }) {
  const [refreshOn, setRefreshOn] = useState(true)
  const [, force] = useState(0)
  const cells = useRef<Cell[] | null>(null)
  const sweepRow = useRef(0)
  const sweepT = useRef(0)
  const readFlash = useRef<Record<number, number>>({})
  const sawDecay = useRef(false)
  if (!cells.current) cells.current = initCells()

  useRaf((dt) => {
    const cs = cells.current!
    for (const c of cs) {
      if (c.bit === 1 && !c.corrupt) {
        c.level = Math.max(0, c.level - c.rate * dt)
        if (c.level < 0.35) c.corrupt = true // sense amp now reads it wrong
      }
    }
    if (refreshOn) {
      sweepT.current += dt
      if (sweepT.current > 0.18) {
        sweepT.current = 0
        const row = sweepRow.current
        for (let i = row * 12; i < row * 12 + 12; i++) {
          const c = cs[i]
          if (!c.corrupt && c.bit === 1) c.level = 1
          if (c.corrupt) c.level = 0 // refresh faithfully rewrites the WRONG value
        }
        sweepRow.current = (row + 1) % 8
      }
    }
    if (!sawDecay.current && cs.filter((c) => c.corrupt).length >= 10) {
      sawDecay.current = true
      onComplete()
    }
    force((x) => x + 1)
  }, true)

  const readCell = (i: number) => {
    const c = cells.current![i]
    // destructive read: dump charge, sense, rewrite
    readFlash.current[i] = performance.now()
    if (!c.corrupt && c.bit === 1) c.level = 1
  }

  const corruptCount = cells.current.filter((c) => c.corrupt).length

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Inside DRAM, every bit is <b>one transistor and one microscopic capacitor</b>. Charge the capacitor and you have a 1. The
        catch is that tiny capacitors leak. Each green bar below is a bit of stored data slowly draining away. Your RAM only
        remembers anything because of the <b>refresh sweep</b>, where the memory controller reads and rewrites every row every
        64 ms, nonstop. Switch refresh off to see what happens. (Time is slowed ~10 billion× so you can watch the controller
        make its rounds.)
      </p>
      <div style={{ display: 'flex', gap: 10, margin: '14px 0', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setRefreshOn(!refreshOn)}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            background: refreshOn ? C.mem : C.alert,
            color: C.bg,
            border: 'none',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Refresh: {refreshOn ? 'ON (data survives)' : 'OFF (watch it fade)'}
        </button>
        <button
          onClick={() => {
            cells.current = initCells()
            sweepRow.current = 0
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
          Rewrite all data
        </button>
        <span className="mono" style={{ fontSize: 13, color: corruptCount ? C.alert : C.dim }}>
          Bits lost: <b>{corruptCount}</b> / {GRID}
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6 }}>
          {cells.current.map((c, i) => {
            const row = Math.floor(i / 12)
            const sweeping = refreshOn && row === sweepRow.current
            const col = c.corrupt ? C.alert : c.bit === 0 ? C.faint : c.level > 0.5 ? C.mem : C.compute
            const flash = readFlash.current[i] && performance.now() - readFlash.current[i] < 350
            return (
              <div
                key={i}
                onClick={() => readCell(i)}
                title="Click to read (drain, sense, then rewrite)"
                style={{
                  height: 42,
                  background: C.bg,
                  borderRadius: 4,
                  border: `1px solid ${sweeping ? C.net : flash ? '#fff' : C.line}`,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${(c.bit === 0 && !c.corrupt ? 0.06 : c.level) * 100}%`,
                    background: col,
                    opacity: c.corrupt ? 0.8 : 0.9,
                    transition: 'height .12s linear',
                  }}
                />
                {c.corrupt && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#fff',
                    }}
                  >
                    ✕
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <div
          className="mono"
          style={{ fontSize: 11, color: C.faint, marginTop: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}
        >
          <span>green = charged (1) · grey = empty (0) · amber = fading · ✕ = below sense threshold (bit lost)</span>
          <span style={{ color: C.net }}>{refreshOn ? `refreshing row ${sweepRow.current + 1}` : 'refresh off'}</span>
        </div>
      </div>

      <Punchline color={C.mem}>
        Once you see the capacitor, the numbers make sense. <b>Why ~100 ns?</b> Reading a cell lets a tiny trickle of charge onto
        a long wire, waits for a sense amplifier to call 0 or 1, and immediately rewrites the charge because the read itself{' '}
        <i>drained</i> the bit (click any cell to watch that white flash: drain → sense → rewrite).{' '}
        <b>Why is RAM cheap and dense?</b> Each bit takes one transistor and one capacitor, compared to six transistors for cache
        SRAM. <b>Why does RAM go blank when the power cuts?</b> Without refresh, the charge leaks away in milliseconds. Every
        database durability mechanism, from WAL and fsync to replication, exists because the fastest memory in the machine is
        built out of leaking buckets.
      </Punchline>
    </div>
  )
}
