import { C } from '../theme'

// Scaffold-only stub; each mode replaces this as its spec lands.
export function Placeholder({ spec }: { spec: string }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px dashed ${C.line}`,
        borderRadius: 10,
        padding: '28px 24px',
        color: C.dim,
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      Under construction — this mode arrives with <span className="mono" style={{ color: C.net }}>{spec}</span>.
    </div>
  )
}
