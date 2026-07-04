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
  await page.goto('/#/manual')
  await page.getByRole('button', { name: 'request', exact: true }).first().click()
  await expect(page.getByRole('dialog')).toContainText('REQUEST')
  await page.screenshot({ path: 'e2e/shots/manual-glossary.png', fullPage: true })
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
