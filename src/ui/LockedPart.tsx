// A locked component slot (The Forge, spec 070). Renders greyed in place of a
// live control — never hidden — with a deep link to the toy that forges it.
// Shared by the Builder workbench, the On-Call workbench, and the parts bin.

import { Link } from 'react-router-dom'
import { C } from '../theme'
import { forgeForComponent } from '../content/forge'

export function LockedPart({ component, price }: { component: string; price?: number }) {
  const f = forgeForComponent(component)
  if (!f) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        padding: '8px 0',
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span style={{ fontSize: 12.5, color: C.faint, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden>🔒</span>
        {f.label}
        {price !== undefined && (
          <span className="mono" style={{ color: C.faint, fontSize: 11 }}>
            ${price}
          </span>
        )}
      </span>
      <Link
        to={`/lab/${f.toyId}`}
        className="mono"
        style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: C.gold, textDecoration: 'none' }}
      >
        ⚒ Forge in the Lab →
      </Link>
    </div>
  )
}
