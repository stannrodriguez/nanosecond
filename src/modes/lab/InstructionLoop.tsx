import { useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'

/* TOY 14 — THE INSTRUCTION LOOP: what "running code" physically is. A CPU
   fetches, decodes, executes — and a pipeline runs them like an assembly line,
   doing far more work at the SAME clock. The step spec 086 calls the app's
   biggest hole: the processing step itself. */

const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'] // classic 5-stage RISC pipeline
const NINSTR = 6
const SEQ_CYCLES = NINSTR * STAGES.length // 30: each instruction finishes before the next starts
const PIPE_CYCLES = STAGES.length + NINSTR - 1 // 10: fill, then one instruction retires per cycle

export function InstructionLoop({ onComplete }: { onComplete: () => void }) {
  const [pipelined, setPipelined] = useState(false)
  const cycles = pipelined ? PIPE_CYCLES : SEQ_CYCLES
  const ipc = NINSTR / cycles

  // stage start cycle for instruction i (0-based): sequential = i*stages, pipelined = i
  const startCol = (i: number) => (pipelined ? i : i * STAGES.length)

  const W = 560
  const COLS = SEQ_CYCLES
  const cellW = W / COLS
  const rowH = 22
  const H = NINSTR * rowH + 22

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        This is what "the computer runs your code" actually means: every instruction is <b>fetched, decoded, executed</b>, its
        memory touched, its result written back — five steps. Run them one-at-a-time and the core mostly sits idle. Switch on the{' '}
        <b>pipeline</b> and the steps overlap like an assembly line — same clock, far more work.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0' }}>
        <button
          onClick={() => {
            setPipelined(true)
            onComplete()
          }}
          className="mono"
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            background: pipelined ? C.compute : C.panelUp,
            color: pipelined ? C.bg : C.dim,
            border: `1px solid ${pipelined ? C.compute : C.line}`,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          pipeline: {pipelined ? 'ON — assembly line' : 'OFF — one at a time'}
        </button>
        <span className="mono" style={{ fontSize: 13, color: C.dim }}>
          {NINSTR} instructions in{' '}
          <b style={{ color: pipelined ? C.ok : C.alert, fontSize: 16 }}>{cycles} cycles</b>
          <span style={{ color: C.faint }}> · {ipc.toFixed(2)} per cycle</span>
        </span>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          {/* cycle gridlines */}
          {Array.from({ length: COLS + 1 }, (_, c) => (
            <line key={c} x1={c * cellW} y1={0} x2={c * cellW} y2={NINSTR * rowH} stroke={C.line} strokeWidth={0.5} opacity={0.4} />
          ))}
          {Array.from({ length: NINSTR }, (_, i) => (
            <g key={i}>
              <text x={2} y={i * rowH + 15} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
                I{i + 1}
              </text>
              {STAGES.map((st, s) => {
                const col = startCol(i) + s
                return (
                  <g key={s}>
                    <rect
                      x={col * cellW + 1}
                      y={i * rowH + 2}
                      width={cellW - 2}
                      height={rowH - 4}
                      rx={2}
                      fill={C.compute}
                      opacity={0.25 + 0.6 * (s / (STAGES.length - 1))}
                    />
                    <text
                      x={col * cellW + cellW / 2}
                      y={i * rowH + 15}
                      fill={C.text}
                      fontSize={8.5}
                      textAnchor="middle"
                      fontFamily="'IBM Plex Mono', monospace"
                    >
                      {st}
                    </text>
                  </g>
                )
              })}
            </g>
          ))}
          <text x={2} y={H - 6} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            cycles → {pipelined ? '(one instruction retires every cycle once the pipe is full)' : '(the core finishes one before starting the next)'}
          </text>
        </svg>
      </div>

      <Punchline color={C.compute}>
        Same six instructions, same clock speed — <b>{SEQ_CYCLES} cycles vs {PIPE_CYCLES}</b>. The pipeline didn't make any single
        instruction faster; it stopped the core from waiting, retiring one result per cycle once full. Push it further —
        toward one-per-cycle, then several — and you get the modern core. But the assembly line only flies if it knows which
        instruction comes next: at every branch it has to <i>guess</i> (toy 16), and the faster the clock it runs at, the more
        heat it makes (toy 15). This little loop, billions of times a second, is your program.
      </Punchline>
    </div>
  )
}
