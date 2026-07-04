// Shared display formatters (voice: mono, compact, honest precision).

export const fmtNum = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toPrecision(3) + 'B'
  if (n >= 1e6) return (n / 1e6).toPrecision(3) + 'M'
  if (n >= 1e3) return (n / 1e3).toPrecision(3) + 'k'
  return Math.round(n).toLocaleString()
}

export const fmtTimeNs = (ns: number): string => {
  if (ns < 1e3) return `${ns < 10 ? ns.toFixed(1) : Math.round(ns)} ns`
  if (ns < 1e6) return `${(ns / 1e3).toPrecision(3)} µs`
  if (ns < 1e9) return `${(ns / 1e6).toPrecision(3)} ms`
  return `${(ns / 1e9).toPrecision(3)} s`
}

export const fmtDist = (m: number): string => {
  if (m < 0.01) return `${(m * 1000).toFixed(1)} mm`
  if (m < 1) return `${(m * 100).toFixed(0)} cm`
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${Math.round(m / 1000).toLocaleString()} km`
}

export const fmtBig = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toPrecision(3) + ' billion'
  if (n >= 1e6) return (n / 1e6).toPrecision(3) + ' million'
  if (n >= 1e3) return Math.round(n).toLocaleString()
  return Math.round(n).toString()
}

/** Human scale: 1 ns = 1 s. Input in ns, reads as seconds. */
export const fmtHuman = (ns: number): string => {
  const s = ns
  if (s < 1) return `${(s * 1000).toFixed(0)} ms — a camera flash`
  if (s < 60) return `${s.toPrecision(2)} s`
  if (s < 3600) return `${(s / 60).toPrecision(2)} min`
  if (s < 86400) return `${(s / 3600).toPrecision(2)} hours`
  if (s < 86400 * 60) return `${(s / 86400).toPrecision(2)} days`
  if (s < 86400 * 365) return `${(s / 86400 / 30.4).toPrecision(2)} months`
  return `${(s / 86400 / 365).toPrecision(2)} years`
}
