import { expect, test } from '@playwright/test'

// Keep in sync with MODES in src/App.tsx.
const ROUTES = [
  { hash: '#/lab', title: 'INTUITION LAB', shot: 'lab' },
  { hash: '#/manual', title: 'CONCEPT LIBRARY', shot: 'manual' },
  { hash: '#/drills', title: 'DRILLS', shot: 'drills' },
  { hash: '#/builder', title: 'THE BUILDER', shot: 'builder' },
  { hash: '#/review', title: 'DESIGN REVIEW', shot: 'review' },
  { hash: '#/on-call', title: 'ON-CALL', shot: 'oncall' },
]

test('root redirects to the Lab', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/lab$/)
  await expect(page.getByRole('heading', { name: 'INTUITION LAB' })).toBeVisible()
})

for (const r of ROUTES) {
  test(`route ${r.hash} renders`, async ({ page }) => {
    await page.goto(`/${r.hash}`)
    await expect(page.getByRole('heading', { name: r.title })).toBeVisible()
    // Fonts settle before the screenshot so shots are comparable run-to-run.
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `e2e/shots/${r.shot}.png`, fullPage: true })
  })
}

test('narrow viewport (380px) does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 800 })
  await page.goto('/#/lab')
  await expect(page.getByRole('heading', { name: 'INTUITION LAB' })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
})
