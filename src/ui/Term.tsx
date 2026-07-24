import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../theme'
import { GLOSSARY } from '../content/glossary'

// Law L6: every term is tappable — dotted underline, bottom drawer, everywhere.

const GlossCtx = createContext<(key: string) => void>(() => {})

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [termKey, setTermKey] = useState<string | null>(null)
  const open = useCallback((k: string) => setTermKey(k), [])
  const value = useMemo(() => open, [open])
  return (
    <GlossCtx.Provider value={value}>
      <div style={{ paddingBottom: termKey ? 120 : 0 }}>{children}</div>
      {termKey && <GlossaryDrawer termKey={termKey} onClose={() => setTermKey(null)} />}
    </GlossCtx.Provider>
  )
}

export function Term({ k, children }: { k: string; children: ReactNode }) {
  const open = useContext(GlossCtx)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        open(k)
      }}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: C.net,
        cursor: 'pointer',
        font: 'inherit',
        borderBottom: `1px dotted ${C.net}88`,
      }}
    >
      {children}
    </button>
  )
}

function GlossaryDrawer({ termKey, onClose }: { termKey: string; onClose: () => void }) {
  const entry = GLOSSARY[termKey]
  const navigate = useNavigate()
  if (!entry) return null
  const goToRef = () => {
    onClose()
    navigate('/manual/briefings')
    requestAnimationFrame(() => {
      const el = document.getElementById(`ref-${termKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.click()
      }
    })
  }
  return (
    <div
      role="dialog"
      aria-label={`Glossary: ${entry.name}`}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: C.panelUp,
        borderTop: `2px solid ${C.net}`,
        padding: '14px 20px 18px',
        boxShadow: '0 -8px 30px #0009',
      }}
    >
      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <span className="mono" style={{ color: C.net, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
            {entry.name.toUpperCase()}
          </span>
          <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 6 }}>{entry.def}</div>
          <button
            onClick={goToRef}
            className="mono"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              marginTop: 8,
              cursor: 'pointer',
              fontSize: 11,
              color: C.dim,
            }}
          >
            see in reference →
          </button>
        </div>
        <button
          onClick={onClose}
          aria-label="Close glossary"
          style={{
            background: 'none',
            border: `1px solid ${C.line}`,
            borderRadius: 6,
            color: C.dim,
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: 13,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
