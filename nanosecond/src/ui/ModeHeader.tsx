import type { ReactNode } from 'react'
import { C } from '../theme'

// Every mode has a one-line thesis under its title (docs/architecture.md).
export function ModeHeader({ title, thesis, children }: { title: string; thesis: string; children?: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>{title}</h1>
        <span className="mono" style={{ fontSize: 11.5, color: C.faint }}>
          {thesis}
        </span>
      </div>
      {children}
    </div>
  )
}
