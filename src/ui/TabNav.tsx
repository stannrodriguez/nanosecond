import { C, FONT } from '../theme'

export interface Tab {
  id: string
  label: string
  sub?: string
  /** active underline color (defaults net) */
  ch?: string
}

// The in-mode sub-tab pattern every prototype shares.
export function TabNav({ tabs, active, onPick }: { tabs: readonly Tab[]; active: string; onPick: (id: string) => void }) {
  return (
    <nav style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const is = active === t.id
        const col = t.ch ?? C.net
        return (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{
              padding: '10px 14px 12px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${is ? col : 'transparent'}`,
              color: is ? C.text : C.dim,
              cursor: 'pointer',
              fontFamily: FONT.mono,
              fontSize: 12,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600 }}>{t.label}</div>
            {t.sub && <div style={{ fontSize: 10.5, color: is ? col : C.faint, marginTop: 2 }}>{t.sub}</div>}
          </button>
        )
      })}
    </nav>
  )
}
