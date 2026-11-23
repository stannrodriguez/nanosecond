import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hashFallbackTarget } from '../src/hashPathFallback'

describe('hashFallbackTarget', () => {
  it('rewrites direct app paths when the hash is empty', () => {
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/about', search: '', hash: '' })).toBe('/#/about')
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/practice', search: '', hash: '' })).toBe('/#/practice')
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/manual', search: '', hash: '' })).toBe('/#/manual')
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/manual/briefings', search: '', hash: '' })).toBe(
      '/#/manual/briefings',
    )
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/lab/light', search: '', hash: '' })).toBe('/#/lab/light')
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/lab/queue', search: '', hash: '' })).toBe('/#/lab/queue')
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/lab/disk', search: '', hash: '' })).toBe('/#/lab/disk')
  })

  it('normalizes trailing and duplicate leading slashes and preserves query strings', () => {
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/about/', search: '', hash: '' })).toBe('/#/about')
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '//lab/light/', search: '?from=share', hash: '' })).toBe(
      '/#/lab/light?from=share',
    )
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/about', search: '', hash: '#' })).toBe('/#/about')
  })

  it('does nothing for root, index.html, existing hashes, or file:// URLs', () => {
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/', search: '', hash: '' })).toBeNull()
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '///', search: '', hash: '' })).toBeNull()
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/index.html', search: '', hash: '' })).toBeNull()
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/', search: '', hash: '#/about' })).toBeNull()
    expect(hashFallbackTarget({ protocol: 'https:', pathname: '/about', search: '', hash: '#/practice' })).toBeNull()
    expect(hashFallbackTarget({ protocol: 'file:', pathname: '/tmp/dist/index.html', search: '', hash: '' })).toBeNull()
  })
})

describe('vercel.json SPA rewrite', () => {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'))

  it('keeps automatic git deploys disabled', () => {
    expect(config.git?.deploymentEnabled).toBe(false)
  })

  it('rewrites app paths to /index.html while leaving static files untouched', () => {
    expect(config.rewrites).toHaveLength(1)
    const [{ source, destination }] = config.rewrites
    expect(destination).toBe('/index.html')

    const re = new RegExp(`^${source}$`)
    for (const appPath of ['/about', '/practice', '/manual', '/manual/briefings', '/lab/light', '/lab/queue', '/unknown']) {
      expect(re.test(appPath), `expected rewrite to match ${appPath}`).toBe(true)
    }
    for (const staticPath of [
      '/assets/index-abc123.js',
      '/assets/index-abc123.css',
      '/assets/space-grotesk.woff2',
      '/favicon.ico',
      '/favicon.svg',
      '/apple-touch-icon.png',
      '/og-card.png',
      '/og-card.svg',
      '/icon-192.png',
      '/icon-512.png',
      '/site.webmanifest',
      '/index.html',
    ]) {
      expect(re.test(staticPath), `expected rewrite to skip ${staticPath}`).toBe(false)
    }
  })
})
