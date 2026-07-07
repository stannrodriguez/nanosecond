import { C } from '../theme'
import { HAPPENED, type RealIncident } from '../content/oncall'

/** "This Actually Happened" — a real public post-mortem attached to a boss or
 *  flaw reveal (spec 060). Links official writeups only. */
export function ThisActuallyHappened({ ids }: { ids: string[] }) {
  const incidents = ids.map((id) => HAPPENED[id]).filter((x): x is RealIncident => !!x)
  if (!incidents.length) return null
  return (
    <div
      style={{
        marginTop: 12,
        background: C.panel,
        border: `1px solid ${C.storage}55`,
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: C.storage, marginBottom: 10 }}>
        ⚑ THIS ACTUALLY HAPPENED
      </div>
      {incidents.map((inc, i) => (
        <div key={inc.id} style={{ marginTop: i ? 12 : 0 }}>
          <a
            href={inc.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: C.net, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            {inc.title} · <span style={{ color: C.dim, fontWeight: 400 }}>{inc.when}</span> ↗
          </a>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginTop: 4 }}>{inc.what}</div>
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, marginTop: 4 }}>
            <span className="mono" style={{ color: C.mem, fontSize: 10.5, letterSpacing: 1 }}>
              LESSON ·{' '}
            </span>
            {inc.lesson}
          </div>
        </div>
      ))}
    </div>
  )
}
