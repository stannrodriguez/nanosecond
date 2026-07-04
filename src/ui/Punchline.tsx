import type { ReactNode } from 'react'
import { C } from '../theme'

export function Punchline({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${color}55`,
        borderRadius: 8,
        padding: '12px 14px',
        marginTop: 14,
        fontSize: 14,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  )
}
