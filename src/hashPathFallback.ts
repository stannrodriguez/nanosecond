export interface LocationLike {
  protocol?: string
  pathname: string
  search: string
  hash: string
}

/**
 * Compute a hash-routed URL when a visitor lands on a direct path without a
 * hash (for example `/about` -> `/#/about`). Returns `null` when no rewrite
 * is needed.
 */
export function hashFallbackTarget(loc: LocationLike): string | null {
  if (loc.protocol && loc.protocol !== 'http:' && loc.protocol !== 'https:') return null
  if (loc.hash && loc.hash !== '#') return null
  const normalized = loc.pathname.replace(/^\/+/, '/').replace(/\/+$/, '')
  if (!normalized || normalized === '/index.html') return null
  return `/#${normalized}${loc.search}`
}

/**
 * Normalize direct path loads (like `/about` or `/lab/light`) into hash URLs
 * before HashRouter mounts, using `replaceState` so the Back button works
 * cleanly without a redirect loop.
 */
export function applyHashPathFallback(): void {
  const target = hashFallbackTarget(window.location)
  if (target) {
    window.history.replaceState(null, '', target)
  }
}
