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

/* ---------------- Axis labels: collision-hide + edge-anchor ----------------
   The app-wide label-overlap fix. Sims position tick/landmark labels along an
   axis; when two would crowd, the less-important one must drop (first and last
   always survive), and the edge labels must anchor inward so they never spill
   outside the track. `collisionHide` is the pure rule both HTML and SVG axes
   share; `AxisLabels` is the ready-made SVG tick row. */

/**
 * Given ascending tick positions (any unit — px or %), return which to show.
 * Rules: keep the first and last; drop any intermediate whose gap to the last
 * shown tick is below `minGap`; if the last tick crowds the previous shown one,
 * drop that previous intermediate to make room (never the first).
 */
export function collisionHide(positions: number[], minGap: number): boolean[] {
  const n = positions.length
  const show = new Array<boolean>(n).fill(false)
  if (n === 0) return show
  show[0] = true
  if (n === 1) return show
  let lastShown = positions[0]
  for (let i = 1; i < n - 1; i++) {
    if (positions[i] - lastShown >= minGap) {
      show[i] = true
      lastShown = positions[i]
    }
  }
  // the last tick always shows; if it crowds the previous shown intermediate, drop that one
  show[n - 1] = true
  if (positions[n - 1] - lastShown < minGap) {
    for (let i = n - 2; i > 0; i--) {
      if (show[i]) {
        show[i] = false
        break
      }
    }
  }
  return show
}

/** An SVG tick-label row with collision-hiding and inward edge-anchoring. */
export function AxisLabels({
  ticks,
  y,
  fontSize = 10,
  color = C.faint,
  minGap = 40,
}: {
  /** each tick's x (in the SVG's user units) and its label */
  ticks: { x: number; label: string }[]
  y: number
  fontSize?: number
  color?: string
  /** minimum px/user-unit gap between adjacent shown labels */
  minGap?: number
}) {
  const show = collisionHide(
    ticks.map((t) => t.x),
    minGap,
  )
  const last = ticks.length - 1
  return (
    <>
      {ticks.map((t, i) =>
        show[i] ? (
          <text
            key={i}
            x={t.x}
            y={y}
            fill={color}
            fontSize={fontSize}
            fontFamily="'IBM Plex Mono', monospace"
            textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
          >
            {t.label}
          </text>
        ) : null,
      )}
    </>
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
