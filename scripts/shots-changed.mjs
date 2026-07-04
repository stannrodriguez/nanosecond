// Which Playwright screenshots actually changed vs the committed baseline?
// Prints a short list so a reviewer (human or agent) only has to LOOK at
// shots that moved — not all of them. Informational: always exits 0.
//
//   node scripts/shots-changed.mjs            compare shots vs baseline
//   node scripts/shots-changed.mjs --update   accept current shots as baseline
//
// A shot is CHANGED when >TOLERANCE% of pixels differ (or its size changed).
// Animated sims never reproduce pixel-perfectly, so known-volatile shots get
// a looser tolerance and are labeled; treat their "changed" as a hint, not
// an alarm.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const SHOTS = 'e2e/shots'
const BASELINE = 'e2e/baseline'
const TOLERANCE = Number(process.env.SHOTS_TOLERANCE ?? 1) // % pixels
// Mid-animation captures (live sims, timing-dependent runs).
const VOLATILE_TOLERANCE = 15
const VOLATILE = new Set([
  'builder-verdict.png',
  'oncall-result.png',
  'lab-stampede.png',
  'lab-hotpartition.png',
])

const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')) : [])

if (process.argv.includes('--update')) {
  mkdirSync(BASELINE, { recursive: true })
  for (const f of list(SHOTS)) copyFileSync(join(SHOTS, f), join(BASELINE, f))
  console.log(`baseline updated: ${list(SHOTS).length} shots`)
  process.exit(0)
}

const shots = list(SHOTS)
const baseline = list(BASELINE)
if (!shots.length) {
  console.log('no shots — run pnpm e2e first')
  process.exit(0)
}

const changed = []
for (const f of shots) {
  if (!baseline.includes(f)) {
    changed.push(`NEW      ${f}`)
    continue
  }
  const a = PNG.sync.read(readFileSync(join(BASELINE, f)))
  const b = PNG.sync.read(readFileSync(join(SHOTS, f)))
  if (a.width !== b.width || a.height !== b.height) {
    changed.push(`RESIZED  ${f} (${a.width}×${a.height} → ${b.width}×${b.height})`)
    continue
  }
  const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 })
  const pct = (diff / (a.width * a.height)) * 100
  const tol = VOLATILE.has(f) ? VOLATILE_TOLERANCE : TOLERANCE
  if (pct > tol) changed.push(`CHANGED  ${f} (${pct.toFixed(1)}% of pixels${VOLATILE.has(f) ? ', volatile sim' : ''})`)
}
for (const f of baseline) if (!shots.includes(f)) changed.push(`MISSING  ${f} (in baseline, not regenerated)`)

if (!changed.length) {
  console.log(`shots: all ${shots.length} match baseline — nothing to review`)
} else {
  console.log(`shots to review (${changed.length} of ${shots.length}):`)
  for (const line of changed) console.log(`  ${line}`)
  console.log('accept intended changes with: node scripts/shots-changed.mjs --update')
}
