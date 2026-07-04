import { useState } from 'react'
import { C } from '../theme'

// Content honesty: every component card and toy punchline carries `simplifies`
// fine print behind a small toggle (docs/architecture.md).
export function FinePrint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        className="mono"
        style={{
          background: 'none',
          border: 'none',
          color: C.faint,
          fontSize: 11,
          cursor: 'pointer',
          padding: 0,
          letterSpacing: 0.5,
        }}
      >
        {open ? '▾' : '▸'} what this simplifies
      </button>
      {open && (
        <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.55, marginTop: 6, borderLeft: `2px solid ${C.line}`, paddingLeft: 10 }}>
          {text}
        </div>
      )}
    </div>
  )
}
