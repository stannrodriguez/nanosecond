import { expect, test } from '@playwright/test'

// Spec 042: sub-content URLs (ADR 0004), the channel-grouped Lab index, and
// the registry-derived cross-links.

test('lab index groups toys by channel with a completion count', async ({ page }) => {
  await page.goto('/#/lab')
  for (const wall of ['NETWORK', 'COMPUTE', 'STORAGE', 'MEMORY']) {
    await expect(page.getByText(wall, { exact: true })).toBeVisible()
  }
  await expect(page.getByText('0/12 mechanisms internalized')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-index.png', fullPage: true })
})

test('a toy deep link renders the toy directly and back returns to the index', async ({ page }) => {
  await page.goto('/#/lab/queue')
  await expect(page.getByText('80% — the knee')).toBeVisible()
  // reload keeps your place
  await page.reload()
  await expect(page.getByText('80% — the knee')).toBeVisible()
  await page.getByRole('link', { name: '← all toys' }).click()
  await expect(page.getByText('mechanisms internalized')).toBeVisible()
  await page.goBack()
  await expect(page.getByText('80% — the knee')).toBeVisible()
})

test('toy detail prev/next walks the catalog', async ({ page }) => {
  await page.goto('/#/lab/queue')
  await page.getByRole('button', { name: '05 →' }).click()
  await expect(page).toHaveURL(/#\/lab\/hotpartition$/)
  await page.getByRole('button', { name: '← 04' }).click()
  await expect(page).toHaveURL(/#\/lab\/queue$/)
})

test('toy detail cross-links into the manual briefing (concept registry)', async ({ page }) => {
  await page.goto('/#/lab/replag')
  await page.getByRole('link', { name: /read the briefing/ }).click()
  await expect(page).toHaveURL(/#\/manual\/briefings\/relational-db$/)
  await expect(page.getByText('Relational databases').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-deeplink.png', fullPage: true })
})

test('unknown sub-content ids degrade to the mode index, never 404', async ({ page }) => {
  await page.goto('/#/lab/not-a-toy')
  await expect(page).toHaveURL(/#\/lab$/)
  await page.goto('/#/review/nonsense')
  await expect(page).toHaveURL(/#\/review\/flaw$/)
  await page.goto('/#/journal')
  await expect(page).toHaveURL(/#\/journal\/log$/)
})

test('review and drills tabs live in the URL', async ({ page }) => {
  await page.goto('/#/review/taste')
  await expect(page.getByText(/right answer, right reason/i).first()).toBeVisible()
  await page.goto('/#/drills/calibration')
  await expect(page.getByText(/No answers yet — run a few drills/)).toBeVisible()
})

test('journal is a right-aligned utility tab that routes', async ({ page }) => {
  await page.goto('/#/lab')
  await page.getByRole('link', { name: /JOURNAL/ }).click()
  await expect(page).toHaveURL(/#\/journal\/log$/)
  await expect(page.getByRole('heading', { name: 'SCAR JOURNAL' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/journal-nav.png', fullPage: true })
})
