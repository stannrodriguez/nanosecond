// Design system — single source of truth (docs/architecture.md).
// Inline styles only; no CSS framework.

export const C = {
  bg: '#0F1930',
  panel: '#152238',
  panelUp: '#1B2C48',
  line: '#283A5C',
  text: '#E9EEF8',
  dim: '#8FA0C0',
  faint: '#5B6C8F',
  // channels
  net: '#53DCEC',
  compute: '#F6BB52',
  storage: '#EF7BD0',
  mem: '#72EAA8',
  alert: '#F26D5E',
  gold: '#F6D452',
  ok: '#72EAA8',
} as const

export type Channel = 'net' | 'compute' | 'storage' | 'mem'

export const CH_COLOR: Record<Channel, string> = {
  net: C.net,
  compute: C.compute,
  storage: C.storage,
  mem: C.mem,
}

export const CH_LABEL: Record<Channel, string> = {
  net: 'NETWORK',
  compute: 'COMPUTE',
  storage: 'STORAGE',
  mem: 'MEMORY',
}

export const FONT = {
  display: "'Space Grotesk', sans-serif",
  mono: "'IBM Plex Mono', monospace",
} as const

// The 80% danger line — drawn on every utilization bar, everywhere, always.
export const DANGER_UTIL = 0.8
