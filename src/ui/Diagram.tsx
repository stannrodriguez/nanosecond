import { C } from '../theme'

// Architecture diagram renderer for flaw puzzles (design-review reference).
export interface DiagNode {
  id: string
  x: number
  y: number
  label: string
  sub?: string
  /** render as a rounded "chip" (a policy/config, not a box) */
  chip?: boolean
}

export interface DiagEdge {
  a: string
  b: string
  label?: string
}

export function Diagram({
  nodes,
  edges,
  picked,
  onPick,
  flaw,
  revealed,
  locked,
}: {
  nodes: DiagNode[]
  edges: DiagEdge[]
  picked: string | null
  onPick: (id: string) => void
  flaw: string
  revealed: boolean
  locked: boolean
}) {
  const W = 660
  const H = 250
  const NW = 122
  const NH = 46
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]))
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', background: C.bg, borderRadius: 10, border: `1px solid ${C.line}` }}
      role="group"
      aria-label="Architecture diagram"
    >
      {edges.map((e, i) => {
        const a = pos[e.a]
        const b = pos[e.b]
        return (
          <g key={i}>
            <line x1={a.x + NW / 2} y1={a.y + NH / 2} x2={b.x + NW / 2} y2={b.y + NH / 2} stroke={C.line} strokeWidth="1.5" />
            {e.label && (
              <text
                x={(a.x + b.x + NW) / 2}
                y={(a.y + b.y + NH) / 2 - 5}
                fill={C.faint}
                fontSize="9"
                fontFamily="'IBM Plex Mono', monospace"
                textAnchor="middle"
              >
                {e.label}
              </text>
            )}
          </g>
        )
      })}
      {nodes.map((n) => {
        const isPicked = picked === n.id
        const isFlaw = revealed && flaw === n.id
        const stroke = isFlaw ? C.alert : isPicked ? C.net : n.chip ? C.compute + '88' : C.line
        return (
          <g key={n.id} onClick={() => !locked && onPick(n.id)} style={{ cursor: locked ? 'default' : 'pointer' }}>
            <rect
              x={n.x}
              y={n.y}
              width={NW}
              height={NH}
              rx={n.chip ? 14 : 8}
              fill={isFlaw ? C.alert + '22' : isPicked ? C.panelUp : C.panel}
              stroke={stroke}
              strokeWidth={isPicked || isFlaw ? 2 : 1.2}
              style={isFlaw ? { animation: 'ns-pulse 1s infinite' } : {}}
            />
            <text
              x={n.x + NW / 2}
              y={n.y + (n.sub ? 20 : 27)}
              fill={isFlaw ? C.alert : C.text}
              fontSize="11.5"
              fontWeight="600"
              textAnchor="middle"
              fontFamily="'Space Grotesk', sans-serif"
            >
              {n.label}
            </text>
            {n.sub && (
              <text
                x={n.x + NW / 2}
                y={n.y + 35}
                fill={C.faint}
                fontSize="8.5"
                textAnchor="middle"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {n.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
