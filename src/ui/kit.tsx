// UI kit — the shared visual atoms every mode composes from. Inline styles
// only (docs/architecture.md), tokens from src/theme.ts. Keep this small and
// unopinionated: it standardizes the container, the eyebrow label, the action
// button, and the selectable chip — the four shapes that were duplicated ~80×
// across the modes.

import { useState, type CSSProperties, type ReactNode } from 'react'
import { C } from '../theme'

/* ---------------- Interaction floor (calm redesign) ----------------
   Inline styles can't express :hover, so hover state is tracked in React.
   These three atoms standardize the hover/transition treatment the design
   handoff asks for "everywhere": a hover hook, the ghost button (back /
   prev-next / try-again), and the lift-on-hover card. Reduced-motion is
   handled globally in index.css (it kills all transitions). */

/** Track hover (and keyboard focus) for inline-styled elements. */
export function useHover() {
  const [hovered, setHovered] = useState(false)
  const bind = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setHovered(true),
    onBlur: () => setHovered(false),
  }
  return [hovered, bind] as const
}

/** The quiet mono ghost button: back, prev/next, try again. */
export function GhostButton({
  children,
  onClick,
  title,
  ariaLabel,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  title?: string
  ariaLabel?: string
  style?: CSSProperties
}) {
  const [h, bind] = useHover()
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      {...bind}
      className="mono"
      style={{
        background: 'none',
        border: `1px solid ${h ? '#3A5080' : C.line}`,
        borderRadius: 8,
        color: h ? C.text : C.dim,
        padding: '6px 11px',
        cursor: 'pointer',
        fontSize: 11.5,
        whiteSpace: 'nowrap',
        transition: 'color .15s, border-color .15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/** A card that lifts on hover, its border brightening to an accent color.
    Renders a <button> when onClick is given, else a plain <div>. */
export function LiftCard({
  children,
  accent = C.line,
  onClick,
  ariaLabel,
  title,
  style,
}: {
  children: ReactNode
  /** border color on hover (the channel/type accent); base border stays C.line */
  accent?: string
  onClick?: () => void
  ariaLabel?: string
  title?: string
  style?: CSSProperties
}) {
  const [h, bind] = useHover()
  const base: CSSProperties = {
    textAlign: 'left',
    background: C.panel,
    border: `1px solid ${h ? accent + '77' : C.line}`,
    borderRadius: 12,
    color: C.text,
    fontFamily: 'inherit',
    transition: 'transform .15s ease, border-color .15s ease, box-shadow .15s ease',
    transform: h ? 'translateY(-2px)' : 'none',
    boxShadow: h ? '0 10px 26px rgba(0,0,0,.35)' : 'none',
    ...style,
  }
  if (onClick) {
    return (
      <button onClick={onClick} aria-label={ariaLabel} title={title} {...bind} style={{ ...base, cursor: 'pointer' }}>
        {children}
      </button>
    )
  }
  return (
    <div {...bind} aria-label={ariaLabel} title={title} style={base}>
      {children}
    </div>
  )
}

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
