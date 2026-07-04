import { expect, test } from '@playwright/test'

// Deeper per-mode smoke: exercise one real interaction per ported prototype
// and screenshot the resulting screen for the parity check.

test('lab: switch to The Queue toy and see the knee chart', async ({ page }) => {
  await page.goto('/#/lab')
  await page.getByRole('button', { name: /THE QUEUE/ }).click()
  await expect(page.getByText('80% — the knee')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-queue.png', fullPage: true })
})

test('manual: ladder tab opens a rung with physics', async ({ page }) => {
  await page.goto('/#/manual')
  await page.getByRole('button', { name: /THE LADDER/ }).click()
  await expect(page.getByText('One CPU cycle')).toBeVisible()
  await page.getByText('Main memory (DRAM)').click()
  await expect(page.getByText('WHY IT MATTERS IN AN INTERVIEW')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-ladder.png', fullPage: true })
})

test('manual: glossary drawer opens from a dotted term', async ({ page }) => {
  // deep link straight to the open section (ADR 0004)
  await page.goto('/#/manual/briefings/networking')
  await page.getByRole('button', { name: 'request', exact: true }).first().click()
  await expect(page.getByRole('dialog')).toContainText('REQUEST')
  await page.screenshot({ path: 'e2e/shots/manual-glossary.png', fullPage: true })
})

test('manual: legacy section ids redirect to their re-shelved home', async ({ page }) => {
  await page.goto('/#/manual/briefings/replication')
  await expect(page).toHaveURL(/#\/manual\/briefings\/relational-db$/)
})

test('drills: lock in a guess and see the derivation', async ({ page }) => {
  await page.goto('/#/drills')
  await page.getByRole('button', { name: 'Lock it in' }).click()
  await expect(page.getByText('HOW TO DERIVE IT')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/drills-reveal.png', fullPage: true })
})

test('builder: briefing gate then workbench renders steppers', async ({ page }) => {
  await page.goto('/#/builder')
  await expect(page.getByText('BRIEFING — READ THE STORY')).toBeVisible()
  await page.getByRole('button', { name: /open the workbench/ }).click()
  await expect(page.getByText('YOUR ARCHITECTURE')).toBeVisible()
  await expect(page.getByText('MONTHLY COST')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/builder-workbench.png', fullPage: true })
})

test('builder: a run produces a verdict', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/#/builder')
  await page.getByRole('button', { name: /open the workbench/ }).click()
  await page.getByRole('button', { name: 'Run scenario' }).click()
  await expect(page.getByText(/SYSTEM (HELD|FAILED)/)).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: 'e2e/shots/builder-verdict.png', fullPage: true })
})

test('review: accuse a component and watch the reveal', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/#/review')
  await expect(page.getByText('The Sawtooth Scheduler')).toBeVisible()
  await page.locator('svg[aria-label="Architecture diagram"] g').filter({ hasText: 'Watcher' }).first().click()
  await page.getByRole('button', { name: /Lock in suspicion/ }).click()
  await expect(page.getByText(/CORRECT|the real flaw/)).toBeVisible({ timeout: 20_000 })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/review-reveal.png', fullPage: true })
})

test('on-call: map renders and first encounter opens', async ({ page }) => {
  await page.goto('/#/on-call')
  await expect(page.getByRole('heading', { name: 'ON-CALL' })).toBeVisible()
  await expect(page.getByText('node 1/10')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/oncall-map.png', fullPage: true })
  await page.getByRole('button', { name: /Launch Day/ }).click()
  await expect(page.getByRole('button', { name: 'Take the traffic' })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/oncall-encounter.png', fullPage: true })
})

test('manual: shelves open a section with its interactive viz', async ({ page }) => {
  await page.goto('/#/manual')
  await page.getByRole('button', { name: /Managing long-running tasks/ }).click()
  await expect(page.getByText('return a receipt', { exact: false })).toBeVisible()
  await expect(page.getByText("WHERE YOU'LL FEEL THIS")).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-delivery.png', fullPage: true })
})

test('library at 380px: shelves and the widest viz do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 900 })
  const noOverflow = async () => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  }
  await page.goto('/#/manual')
  await noOverflow()
  // consistent-hashing carries the widest viz (the ring SVG)
  await page.goto('/#/manual/briefings/consistent-hashing')
  await expect(page.getByText('nodes on the ring', { exact: false })).toBeVisible()
  await noOverflow()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-380px.png', fullPage: true })
})

test('lab: 12 toys registered; hot partition throttles and forges shards', async ({ page }) => {
  await page.goto('/#/lab')
  await expect(page.getByRole('button', { name: /12 · TTL & STAMPEDE/ })).toBeVisible()
  await page.getByRole('button', { name: /05 · HOT PARTITION/ }).click()
  await expect(page.getByText('THROTTLING').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/FORGED: DB SHARD/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-hotpartition.png', fullPage: true })
})

test('lab: ttl stampede spikes the DB', async ({ page }) => {
  test.setTimeout(45_000)
  await page.goto('/#/lab')
  await page.getByRole('button', { name: /12 · TTL & STAMPEDE/ }).click()
  await expect(page.getByText(/× capacity/)).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: 'e2e/shots/lab-stampede.png', fullPage: true })
})

test('lab: consensus toy commits a cross-region write', async ({ page }) => {
  await page.goto('/#/lab')
  await page.getByRole('button', { name: /08 · CONSENSUS/ }).click()
  await page.getByRole('button', { name: 'cross-region (US E↔W)' }).click()
  await page.getByRole('button', { name: 'Commit one write' }).click()
  await expect(page.getByText('141 ms')).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: 'e2e/shots/lab-consensus.png', fullPage: true })
})

test('lab at 380px: no horizontal overflow on index or toys', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 900 })
  const noOverflow = async () => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  }
  await page.goto('/#/lab')
  await noOverflow()
  for (const name of [/07 · THE PIPE/, /10 · CONNECTION POOL/, /11 · BACKPRESSURE/]) {
    await page.goto('/#/lab')
    await page.getByRole('button', { name }).click()
    await noOverflow()
  }
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-380px.png', fullPage: true })
})

test('drills: leitner chip, category label, and calibration tab', async ({ page }) => {
  await page.goto('/#/drills')
  await expect(page.getByText(/ESTIMATE · /)).toBeVisible()
  await expect(page.getByText('new card')).toBeVisible()
  await page.getByRole('button', { name: 'Lock it in' }).click()
  await expect(page.getByText('HOW TO DERIVE IT')).toBeVisible()
  await page.getByRole('button', { name: 'Next drill →' }).click()
  await page.getByRole('button', { name: /02 · CALIBRATION/ }).click()
  await expect(page.getByText(/ACCURACY BY CATEGORY — your blind spots/)).toBeVisible()
  await expect(page.getByText('LEITNER BOXES', { exact: false })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/drills-stats.png', fullPage: true })
})

test('journal: a drill miss lands as a scar with its lesson', async ({ page }) => {
  await page.goto('/#/drills')
  // drag the slider to an extreme so the answer is a guaranteed miss
  await page.locator('input[type=range]').first().fill('0')
  await page.getByRole('button', { name: 'Lock it in' }).click()
  await page.goto('/#/journal')
  await expect(page.getByRole('heading', { name: 'SCAR JOURNAL' })).toBeVisible()
  await expect(page.getByText('you:', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: /02 · BY THEME/ }).click()
  await expect(page.getByText(/MISSED 1×/).first()).toBeVisible()
  await page.getByRole('button', { name: /03 · PRE-INTERVIEW BRIEFING/ }).click()
  await expect(page.getByText(/5 SHAKIEST NUMBERS/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/journal-briefing.png', fullPage: true })
})

test('on-call: a full encounter runs to a survivable result (tick runner)', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/#/on-call')
  await page.getByRole('button', { name: /Launch Day/ }).click()
  await page.getByRole('button', { name: 'Take the traffic' }).click()
  // useTickRunner drives ticks 0..15; the run resolves to a reward draft
  await expect(page.getByRole('button', { name: /Collect & draft reward/ })).toBeVisible({ timeout: 40_000 })
  await page.screenshot({ path: 'e2e/shots/oncall-result.png', fullPage: true })
})
