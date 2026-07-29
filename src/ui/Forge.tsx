// The Forge's shared surfaces (spec 070): the parts bin and the locked row.
// Locked parts are always visible and always greyed — never hidden — and every
// one of them links straight to the toy that forges it (product-spec §3.8).

import { Link } from 'react-router-dom'
import { C, CH_COLOR } from '../theme'
import { COMPONENTS } from '../content/components'
import { forgeById } from '../content/forge'
import { useProgress, isForged } from '../state/progress'

/** "Forge this in the Lab →", pointing at the toy that owns the part. */
export function ForgeLink({ componentId, compact }: { componentId: string; compact?: boolean }) {
  const f = forgeById(componentId)
  if (!f) return null
  return (
    <Link
      to={`/lab/${f.toyId}`}
      className="mono"
      style={{
        fontSize: compact ? 10 : 11,
        color: C.gold,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        borderBottom: `1px solid ${C.gold}44`,
      }}
    >
      {compact ? 'forge →' : 'Forge this in the Lab →'}
    </Link>
  )
}

/**
 * A locked stand-in for one control in a stack panel. Same height and rhythm
 * as the Stepper it replaces, so a locked workbench reads as a workbench with
 * parts missing rather than a different screen.
 */
export function LockedRow({ label, componentId }: { label: string; componentId: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '8px 0',
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span style={{ fontSize: 12.5, color: C.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden>⚒</span>
        <span>{label}</span>
      </span>
      <ForgeLink componentId={componentId} compact />
    </div>
  )
}

/**
 * THE PARTS BIN — all eight parts, forged or not, with the six gated ones
 * showing their lock and their way out. This is the player's map of the
 * progression spine: what they can build with, and what they have to
 * understand first.
 */
export function PartsBin() {
  const forged = useProgress((s) => s.forged)
  const gated = COMPONENTS.filter((c) => c.forge)
  const forgedCount = gated.filter((c) => isForged(forged, c.forge)).length
  return (
    <section aria-label="Parts bin" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.8, color: C.gold }}>
          ⚒ THE PARTS BIN
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: forgedCount === gated.length ? C.ok : C.faint }}>
          {forgedCount}/{gated.length} forged
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.55, margin: '6px 0 0', maxWidth: 620 }}>
        You may not build with a part you haven't understood. Each locked part opens in the Lab toy that teaches its
        mechanism — play it, answer one question about it, and it's yours everywhere.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {COMPONENTS.map((c) => {
          const open = isForged(forged, c.forge)
          const col = CH_COLOR[c.ch]
          const f = c.forge ? forgeById(c.forge) : undefined
          const body = (
            <>
              <span aria-hidden style={{ fontSize: 10 }}>
                {c.forge ? (open ? '✓' : '⚒') : '·'}
              </span>
              {c.name}
            </>
          )
          const style = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            padding: '4px 10px',
            borderRadius: 999,
            whiteSpace: 'nowrap' as const,
            textDecoration: 'none',
            border: `1px solid ${open || !c.forge ? col + '66' : C.line}`,
            color: open || !c.forge ? col : C.faint,
            background: open || !c.forge ? col + '11' : 'transparent',
          }
          return f && !open ? (
            <Link key={c.id} to={`/lab/${f.toyId}`} className="mono" style={style} title={`Locked — forge it in ${f.toyId}`}>
              {body}
            </Link>
          ) : (
            <span key={c.id} className="mono" style={style} title={c.capacity}>
              {body}
            </span>
          )
        })}
      </div>
    </section>
  )
}
