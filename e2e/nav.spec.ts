import { expect, test } from '@playwright/test'

// Spec 042: sub-content URLs (ADR 0004), the Lab index journey spine, and the
// registry-derived cross-links.

test('lab index reads as a journey spine with a completion count', async ({ page }) => {
  await page.goto('/#/lab')
  // stations of the request's journey, top to bottom
  await expect(page.getByRole('heading', { name: 'INTUITION LAB' })).toBeVisible()
  await expect(page.getByText('THE WIRE', { exact: true })).toBeVisible()
  await expect(page.getByText('THE FRONT DOOR', { exact: true })).toBeVisible()
  await expect(page.getByText('0/18 internalized')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-index.png', fullPage: true })
})

test('a toy deep link renders the toy directly and back returns to the index', async ({ page }) => {
  await page.goto('/#/lab/queue')
  await expect(page.getByText('80% — the knee')).toBeVisible()
  // the sim renders directly now (no forecast gate); reload keeps the page
  await page.reload()
  await expect(page.getByText('80% — the knee')).toBeVisible()
  await page.getByRole('button', { name: '← the journey' }).click()
  await expect(page.getByText(/internalized/)).toBeVisible()
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

test('a manual briefing deep-links directly to its re-shelved home', async ({ page }) => {
  // (toy-page KEEP-THE-LOOP cross-links were dropped in the calm redesign;
  // the manual still resolves a concept's home shelf via its section id)
  await page.goto('/#/manual/briefings/replication')
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
  // unknown puzzle id under the flaw tab also degrades to the tab index
  await page.goto('/#/review/flaw/not-a-puzzle')
  await expect(page).toHaveURL(/#\/review\/flaw$/)
  await page.goto('/#/journal')
  await expect(page).toHaveURL(/#\/journal\/log$/)
})

test('review and drills tabs live in the URL', async ({ page }) => {
  await page.goto('/#/review/taste')
  await expect(page.getByText(/Two defensible designs, one set of requirements/i).first()).toBeVisible()
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

// Spec: README-v3 IA restructure — five nav sections, a /practice hub, /about.

test('the top nav is five sections, and PRACTICE stays lit across its modes', async ({ page }) => {
  await page.goto('/#/lab')
  const nav = page.getByRole('navigation', { name: 'Sections' })
  for (const label of ['LAB', 'LIBRARY', 'PRACTICE', 'ABOUT']) {
    await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
  await expect(nav.getByRole('link', { name: /JOURNAL/ })).toBeVisible()
  // the four modes left the nav
  for (const gone of ['DRILLS', 'BUILDER', 'REVIEW', 'ON-CALL']) {
    await expect(nav.getByRole('link', { name: gone, exact: true })).toHaveCount(0)
  }
  // PRACTICE is the current section on the hub and inside every mode beneath it
  const practice = nav.getByRole('link', { name: 'PRACTICE', exact: true })
  for (const inside of ['/#/practice', '/#/drills', '/#/builder', '/#/review', '/#/on-call']) {
    await page.goto(inside)
    await expect(practice).toHaveAttribute('aria-current', 'page')
  }
})

test('the practice hub lists the four modes in order and opens one', async ({ page }) => {
  await page.goto('/#/practice')
  await expect(page.getByRole('heading', { name: 'PRACTICE' })).toBeVisible()
  for (const name of ['DRILLS', 'BUILDER', 'REVIEW', 'ON-CALL']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'ON-CALL', exact: true }).click()
  await expect(page).toHaveURL(/#\/on-call$/)
})

test('each mode carries a ← practice breadcrumb back to the hub', async ({ page }) => {
  for (const mode of ['/#/drills', '/#/builder', '/#/review', '/#/on-call']) {
    await page.goto(mode)
    await page.getByRole('button', { name: '← practice' }).click()
    await expect(page).toHaveURL(/#\/practice$/)
  }
})

test('about states the premise and links onward through the learning loop', async ({ page }) => {
  await page.goto('/#/about')
  await expect(page.getByRole('heading', { name: 'WHAT IS THIS?' })).toBeVisible()
  await expect(page.getByText(/teaches the physical constraints behind systems design/)).toBeVisible()
  // the loop's two calls to action are links; LAB routes into the Lab
  await page.getByRole('button', { name: /^LAB/ }).click()
  await expect(page).toHaveURL(/#\/lab$/)
})
