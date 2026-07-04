// UI kit — the shared visual atoms every mode composes from. Inline styles
// only (docs/architecture.md), tokens from src/theme.ts. Keep this small and
// unopinionated: it standardizes the container, the eyebrow label, the action
// button, and the selectable chip — the four shapes that were duplicated ~80×
// across the modes.

import type { CSSProperties, ReactNode } from 'react'
import { C } from '../theme'

/* ---------------- Panel: the standard bordered container ---------------- */
export function Panel({
  children,
  pad = 16,
  accent,
  style,
}: {
  children: ReactNode
  pad?: number
  /** tint the border with a channel color (defaults to the neutral line) */
  accent?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${accent ? accent + '55' : C.line}`,
        borderRadius: 10,
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ---------------- Eyebrow: the mono uppercase section label ---------------- */
export function Eyebrow({ children, color = C.dim, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color, ...style }}>
      {children}
    </div>
  )
}

/* ---------------- Button: action buttons with variants ---------------- */
type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const BTN_PAD: Record<ButtonSize, string> = { sm: '8px 14px', md: '10px 20px', lg: '12px 22px' }
const BTN_FONT: Record<ButtonSize, number> = { sm: 13, md: 14, lg: 15 }

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  style,
  ...rest
}: {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  full?: boolean
  disabled?: boolean
  style?: CSSProperties
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'style'>) {
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: C.net, fg: C.bg, border: C.net },
    danger: { bg: C.alert, fg: '#fff', border: C.alert },
    secondary: { bg: C.panelUp, fg: C.text, border: C.line },
    ghost: { bg: C.bg, fg: C.dim, border: C.line },
  }
  const p = disabled ? { bg: C.line, fg: C.faint, border: C.line } : palette[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: BTN_PAD[size],
        width: full ? '100%' : undefined,
        background: p.bg,
        color: p.fg,
        border: `1px solid ${p.border}`,
        borderRadius: 8,
        fontWeight: 700,
        fontSize: BTN_FONT[size],
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------------- Chip: a selectable pill (pickers, toggles) ---------------- */
export function Chip({
  children,
  active,
  onClick,
  color = C.net,
  mono = true,
  disabled = false,
  style,
}: {
  children: ReactNode
  active: boolean
  onClick?: () => void
  /** accent color when active */
  color?: string
  mono?: boolean
  disabled?: boolean
  style?: CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={mono ? 'mono' : undefined}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        background: active ? color : C.panel,
        color: active ? C.bg : C.dim,
        border: `1px solid ${active ? color : C.line}`,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
