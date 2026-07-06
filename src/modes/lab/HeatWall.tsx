import { useEffect, useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'

/* TOY 15 — THE HEAT WALL: why clocks stopped getting faster. Power grows ~f³
   (switching energy × the voltage that must rise with frequency), so a fixed
   cooling budget puts a hard ceiling near ~4 GHz — and the industry turned to
   more cores instead of faster ones (~2005). Fills the compute wall. */

const COOLING_BUDGET = 100 // watts the package can shed, normalized
// power(f) normalized so ~4 GHz sits right at the budget: P ∝ f³
const powerAt = (ghz: number) => COOLING_BUDGET * (ghz / 4) ** 3
const CEILING = 4

export function HeatWall({ onComplete }: { onComplete: () => void }) {
  const [ghz, setGhz] = useState(2)
  const sawWall = useRef(false)
  const power = powerAt(ghz)
  const over = power > COOLING_BUDGET

  useEffect(() => {
    if (!sawWall.current && over) {
      sawWall.current = true
      onComplete()
    }
  }, [over, onComplete])

  const W = 560
  const H = 180
  const PADL = 40
  const PADB = 26
  const fx = (g: number) => PADL + ((g - 1) / (6 - 1)) * (W - PADL - 12)
  const fy = (p: number) => H - PADB - Math.min(1, p / (COOLING_BUDGET * 2)) * (H - PADB - 12)
  const curve = Array.from({ length: 51 }, (_, i) => {
    const g = 1 + (i / 50) * 5
    return `${fx(g).toFixed(1)},${fy(powerAt(g)).toFixed(1)}`
  }).join(' ')

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        A transistor burns a little energy every time it flips, and a faster clock needs a higher voltage to flip cleanly — so
        power climbs like <b>frequency cubed</b>. A chip package can only shed so much heat. Drag the clock up and watch power
        slam into that ceiling: past it, the die must <b>throttle</b> or cook.
      </p>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}>
            clock: <b style={{ color: over ? C.alert : C.compute, fontSize: 17 }}>{ghz.toFixed(1)} GHz</b>
          </span>
          <span className="mono" style={{ fontSize: 13, color: C.dim }}>
            power: <b style={{ color: over ? C.alert : C.ok, fontSize: 17 }}>{Math.round(power)} W</b>
            <span style={{ color: C.faint }}> / {COOLING_BUDGET} W budget</span>
            {over && <b style={{ color: C.alert }}> · THROTTLING</b>}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={0.1}
          value={ghz}
          onChange={(e) => setGhz(+e.target.value)}
          style={{ marginTop: 12 }}
          aria-label="clock frequency in GHz"
        />

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 12 }} role="img" aria-label="power vs frequency curve">
          {/* cooling budget line */}
          <line x1={PADL} y1={fy(COOLING_BUDGET)} x2={W - 12} y2={fy(COOLING_BUDGET)} stroke={C.alert} strokeDasharray="5 4" />
          <text x={W - 12} y={fy(COOLING_BUDGET) - 5} fill={C.alert} fontSize={10} textAnchor="end" fontFamily="'IBM Plex Mono', monospace">
            cooling budget
          </text>
          {/* ~4 GHz ceiling */}
          <line x1={fx(CEILING)} y1={12} x2={fx(CEILING)} y2={H - PADB} stroke={C.faint} strokeDasharray="3 4" />
          <text x={fx(CEILING) + 4} y={22} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            ~4 GHz wall
          </text>
          <line x1={PADL} y1={H - PADB} x2={W - 12} y2={H - PADB} stroke={C.line} />
          <polyline points={curve} fill="none" stroke={over ? C.alert : C.compute} strokeWidth={2.5} />
          <circle cx={fx(ghz)} cy={fy(power)} r={6} fill={over ? C.alert : C.ok} stroke={C.bg} strokeWidth={1.5} />
          <text x={PADL} y={H - 8} fill={C.faint} fontSize={10} fontFamily="'IBM Plex Mono', monospace">
            frequency → · power ∝ f³
          </text>
        </svg>
      </div>

      <Punchline color={C.compute}>
        Double the clock and you roughly <b>octuple</b> the heat — so a package that sheds ~100 W hits a wall near <b>~4 GHz</b>,
        and it has barely moved in twenty years. That wall is the whole story of modern CPUs: around 2005 the industry stopped
        selling gigahertz and started selling <i>cores</i>, because two cores at 3 GHz fit the heat budget that one core at 6 GHz
        shatters. "Just get a faster machine" quietly died here — and every parallel-programming headache was born.
      </Punchline>
    </div>
  )
}
