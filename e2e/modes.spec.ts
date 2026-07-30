import { expect, test } from '@playwright/test'

// Deeper per-mode smoke: exercise one real interaction per ported prototype
// and screenshot the resulting screen for the parity check.
// (Calm redesign: the CALL IT forecast gate is gone — sims render directly.)

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

test('manual: reference section shows every definition without a click', async ({ page }) => {
  await page.goto('/#/manual')
  const ref = page.getByRole('region', { name: 'Reference' })
  await expect(ref.getByRole('heading', { name: 'REFERENCE' })).toBeVisible()
  // group headers and a sample of always-visible definitions, no expanding
  for (const group of ['REQUESTS & TRAFFIC', 'CPU & MEMORY', 'RESILIENCE']) {
    await expect(ref.getByText(group, { exact: true })).toBeVisible()
  }
  // definitions render with their terms on load (no accordions, no hover):
  // sample rows from the first and last groups carry substantial visible text
  for (const row of ['#ref-read', '#ref-write', '#ref-failover']) {
    await expect(page.locator(row)).toBeVisible()
    expect(((await page.locator(row).textContent()) ?? '').length).toBeGreaterThan(80)
  }
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-reference.png', fullPage: true })
})

test('manual: the glossary drawer bridges to the reference row', async ({ page }) => {
  await page.goto('/#/manual/briefings/networking')
  await page.getByRole('button', { name: 'request', exact: true }).first().click()
  await page.getByRole('button', { name: 'see in reference →' }).click()
  await expect(page).toHaveURL(/#\/manual\/reference\/request$/)
  await expect(page.locator('#ref-request')).toBeInViewport()
  // unknown term ids degrade to the index (ADR 0004)
  await page.goto('/#/manual/reference/not-a-term')
  await expect(page).toHaveURL(/#\/manual\/reference$/)
})

test('manual: the ladder card previews the rungs and climbs', async ({ page }) => {
  await page.goto('/#/manual')
  const card = page.getByRole('button', { name: 'THE LADDER', exact: true })
  await expect(card).toContainText('climb →')
  await card.click()
  await expect(page).toHaveURL(/#\/manual\/ladder$/)
  await expect(page.getByText('One CPU cycle')).toBeVisible()
})

test('manual: legacy section ids redirect to their re-shelved home', async ({ page }) => {
  await page.goto('/#/manual/briefings/replication')
  await expect(page).toHaveURL(/#\/manual\/briefings\/relational-db$/)
})

test('drills: lock in a guess and see the verdict + derivation', async ({ page }) => {
  await page.goto('/#/drills')
  await page.getByRole('button', { name: 'Lock it in' }).click()
  await expect(page.getByText(/DEAD ON|WITHIN AN ORDER OF MAGNITUDE|OFF BY \d+ ORDER/)).toBeVisible()
  await expect(page.getByText(/bounded by:/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/drills-reveal.png', fullPage: true })
})

test('builder: briefing gate then workbench renders steppers', async ({ page }) => {
  await page.goto('/#/builder')
  await expect(page.getByText('THE STORY, AS NUMBERS')).toBeVisible()
  await page.getByRole('button', { name: /Open the workbench/i }).click()
  await expect(page.getByText('YOUR ARCHITECTURE')).toBeVisible()
  await expect(page.getByText('MONTHLY COST')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/builder-workbench.png', fullPage: true })
})

test('builder: a run produces a verdict', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/#/builder')
  await page.getByRole('button', { name: /Open the workbench/i }).click()
  await page.getByRole('button', { name: 'Run scenario' }).click()
  await expect(page.getByText(/SYSTEM (HELD|FAILED)/)).toBeVisible({ timeout: 30_000 })
  await page.screenshot({ path: 'e2e/shots/builder-verdict.png', fullPage: true })
})

test('review: accuse a component in the chain and see the verdict', async ({ page }) => {
  await page.goto('/#/review')
  await expect(page.getByText('The Sawtooth Scheduler')).toBeVisible()
  // click the flawed component straight in the linear chain (no separate lock step)
  await page.getByRole('button', { name: /Watcher/ }).click()
  await expect(page.getByText(/CAUGHT IT/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/review-reveal.png', fullPage: true })
})

test('review: the "actually fine" puzzle rewards shipping it, and grades judgment', async ({ page }) => {
  test.setTimeout(60_000)
  // deep link straight to the fine puzzle (ADR 0004 sub-content URL)
  await page.goto('/#/review/flaw/boring')
  await expect(page.getByText('The Boring Monolith')).toBeVisible()
  await page.getByRole('button', { name: /declare it sound/ }).click()
  await expect(page.getByText(/CORRECT — the honest call was/)).toBeVisible({ timeout: 25_000 })
  // aggregate judgment surfaces after a graded attempt
  await expect(page.getByText('JUDGMENT', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Teach it back/ })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/review-fine.png', fullPage: true })
})

test('review: daily incident is one-shot and date-seeded with a share string', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/#/review/daily')
  await expect(page.getByText(/DAILY INCIDENT · #/).first()).toBeVisible()
  await expect(page.getByText(/day streak/).first()).toBeVisible()
  await page.getByRole('button', { name: /declare it sound/ }).click()
  await expect(page.getByRole('button', { name: /Share result/ })).toBeVisible({ timeout: 25_000 })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/review-daily.png', fullPage: true })
  // one shot: reloading shows the recap, not a fresh puzzle
  await page.reload()
  await expect(page.getByText(/Come back tomorrow for Incident/)).toBeVisible()
})

test('review: interrogation extracts requirements and springs the unasked-question trap', async ({ page }) => {
  test.setTimeout(60_000)
  // deep link to a specific interrogation (ADR 0004 sub-content URL)
  await page.goto('/#/review/interrogate/upload')
  await expect(page.getByText('“Let users upload files”')).toBeVisible()
  await expect(page.getByText('THE PITCH')).toBeVisible()
  // buy a question that crystallizes a requirement, deliberately skipping the crucial one
  await page.getByRole('button', { name: /per-user or per-project storage quotas/ }).click()
  await expect(page.getByText(/REQUIREMENTS SO FAR/)).toBeVisible()
  await page.getByRole('button', { name: /Lock requirements/ }).click()
  // the crucial question fires as a mid-build trap + full ranked debrief
  await expect(page.getByText(/IT FOUND YOU/)).toBeVisible()
  await expect(page.getByText(/MISSED · CRUCIAL/)).toBeVisible()
  await expect(page.getByText(/EVERY QUESTION, RANKED BY INFORMATION VALUE/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/review-interrogate.png', fullPage: true })
})

test('lab index progress bar reflects completed toys per channel', async ({ page }) => {
  await page.goto('/#/lab')
  // the segmented progress bar has one cell per toy, tooltip = "NN · NAME"
  await expect(page.getByTitle('01 · RACE LIGHT')).toBeVisible()
  await expect(page.getByTitle('18 · FALSE SHARING')).toBeVisible()
})

test('on-call: map renders and first encounter opens', async ({ page }) => {
  await page.goto('/#/on-call')
  await expect(page.getByRole('heading', { name: 'ON-CALL' })).toBeVisible()
  await expect(page.getByText('act 1/3')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/oncall-map.png', fullPage: true })
  await page.getByRole('button', { name: /Launch Day/ }).click()
  await expect(page.getByRole('button', { name: 'Take the traffic' })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/oncall-encounter.png', fullPage: true })
})

test('manual: the networking briefing carries its terms on the page (spec 068)', async ({ page }) => {
  await page.goto('/#/manual/briefings/networking')
  const panel = page.getByRole('region', { name: 'The terms' })
  await expect(panel.getByText('THE TERMS')).toBeVisible()
  // collapsed rows read as a phrasebook: term + SAY IT sentence, no click needed
  await expect(panel.getByText(/UDP trades delivery guarantees for latency/)).toBeVisible()
  // expanding a row reveals the def and the rest of the speakable contract
  const row = panel.getByRole('button', { name: /TCP/ }).first()
  await row.click()
  await expect(row).toHaveAttribute('aria-expanded', 'true')
  await expect(panel.getByText('REACH FOR')).toBeVisible()
  await expect(panel.getByText('TRAP')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-terms.png', fullPage: true })
  // the panel is opt-in per briefing: absent where no termShelf is declared
  await page.goto('/#/manual/briefings/api-design')
  await expect(page.getByRole('region', { name: 'The terms' })).toHaveCount(0)
  // and it holds the 380px accessibility floor
  await page.setViewportSize({ width: 380, height: 900 })
  await page.goto('/#/manual/briefings/networking')
  await expect(page.getByRole('region', { name: 'The terms' })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
  await page.screenshot({ path: 'e2e/shots/manual-terms-380px.png', fullPage: true })
})

test('manual: the networking briefing is a four-block deep briefing (spec 069)', async ({ page }) => {
  await page.goto('/#/manual/briefings/networking')
  // the four numbered blocks, in order
  await expect(page.getByRole('heading', { name: /THE STACK/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /TRANSPORT/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /ONE TAP, EVERY LAYER/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /WHERE THIS PAGE HANDS OFF/ })).toBeVisible()
  // LayerStack: L4 starts open (block 2 deepens it); dim floors are not buttons
  const l4 = page.getByRole('button', { name: /L4 · Transport/ })
  await expect(l4).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: /L5–6/ })).toHaveCount(0)
  const l7 = page.getByRole('button', { name: /L7 · Application/ })
  await expect(l7).toHaveAttribute('aria-expanded', 'false')
  await l7.click()
  await expect(l7).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('HTTP · DNS · WebSocket · SSE · gRPC · WebRTC')).toBeVisible()
  // LossToggle: at the initial 2% loss both lanes state their price…
  await expect(page.getByText('4.8% of each second spent frozen')).toBeVisible()
  await expect(page.getByText('2% of frames simply gone')).toBeVisible()
  // …and a clean wire makes both promises free
  await page.getByRole('slider', { name: 'packet loss' }).fill('0')
  await expect(page.getByText('smooth — nothing to repair')).toBeVisible()
  await expect(page.getByText('smooth — nothing to lose')).toBeVisible()
  // the worked example ends on the FIN/ACK teardown note
  const stepper = page.getByText('step 1 / 7')
  await expect(stepper).toBeVisible()
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page.getByText(/torn down with FIN\/ACK/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-networking.png', fullPage: true })
})

test('say it: the deck is L2-gated, flips, grades, and reaches the tally (spec 067)', async ({ page }) => {
  // a cold deep link (briefing never opened) shows the lock, not the cards
  await page.goto('/#/manual/briefings/networking/say-it')
  await expect(page.getByText('SAY IT · LOCKED')).toBeVisible()
  await expect(page.getByText('Read the briefing first', { exact: false })).toBeVisible()
  // opening the briefing satisfies law L2; the entry card leads in
  await page.goto('/#/manual/briefings/networking')
  await page.getByRole('button', { name: /SAY IT — 6 questions an interviewer would ask/ }).click()
  await expect(page).toHaveURL(/#\/manual\/briefings\/networking\/say-it$/)
  await expect(page.getByText('INTERVIEWER', { exact: true })).toBeVisible()
  await expect(page.getByText('Say your answer out loud.')).toBeVisible()
  // flip → model answer + checklist + trap + number + dotted terms
  await page.getByRole('button', { name: 'flip → model answer' }).click()
  await expect(page.getByText('A STRONG ANSWER SOUNDS LIKE')).toBeVisible()
  await expect(page.getByText('DID YOU SAY…')).toBeVisible()
  const check = page.getByRole('button', { name: /Named what/ }).first()
  await check.click()
  await expect(check).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-sayit.png', fullPage: true })
  // grade through the whole deck to the tally
  await page.getByRole('button', { name: /nailed it/ }).click()
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'flip → model answer' }).click()
    await page.getByRole('button', { name: /partial/ }).click()
  }
  await expect(page.getByText('Deck done.')).toBeVisible()
  await expect(page.getByText('1 nailed')).toBeVisible()
  await expect(page.getByText('5 partial')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/manual-sayit-done.png', fullPage: true })
  // unknown sub-paths degrade to the briefing, never 404 (ADR 0004)
  await page.goto('/#/manual/briefings/networking/not-a-mode')
  await expect(page).toHaveURL(/#\/manual\/briefings\/networking$/)
  // sections without a deck bounce their say-it URL back to the briefing
  await page.goto('/#/manual/briefings/api-design/say-it')
  await expect(page).toHaveURL(/#\/manual\/briefings\/api-design$/)
  // and the deck holds the 380px floor
  await page.setViewportSize({ width: 380, height: 900 })
  await page.goto('/#/manual/briefings/networking/say-it')
  await expect(page.getByText('INTERVIEWER', { exact: true })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)
  await page.screenshot({ path: 'e2e/shots/manual-sayit-380px.png', fullPage: true })
})

test('manual: shelves open a section with its interactive viz', async ({ page }) => {
  await page.goto('/#/manual')
  await page.getByRole('button', { name: /Managing long-running tasks/ }).click()
  await expect(page.getByText('return a receipt', { exact: false })).toBeVisible()
  await expect(page.getByText("WHERE YOU'LL FEEL THIS")).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/manual-delivery.png', fullPage: true })
})

test('manual: WHERE THIS TOUCHES carries an annotated, navigable edge (spec 074)', async ({ page }) => {
  await page.goto('/#/manual/briefings/relational-db')
  await expect(page.getByText('WHERE THIS TOUCHES')).toBeVisible()
  // an edge is a claim: neighbor + kind badge + the sentence facing THIS page
  await expect(page.getByText('composes with').first()).toBeVisible()
  await expect(
    page.getByText('Every read-throughput number the engine quotes assumes the right index exists', {
      exact: false,
    }),
  ).toBeVisible()
  // and the neighbor is reachable, landing on a page whose own edge points back
  await page.getByRole('link', { name: /Database indexing/ }).click()
  await expect(page.getByRole('heading', { name: 'Database indexing' })).toBeVisible()
  await expect(
    page.getByText('The planner is what decides whether your index gets used at all', { exact: false }),
  ).toBeVisible()
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

test('lab: 18 toys registered; hot partition throttles and forges shards', async ({ page }) => {
  await page.goto('/#/lab')
  await expect(page.getByRole('button', { name: /13 · THE CACHE CLIFF/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /18 · FALSE SHARING/ })).toBeVisible()
  await page.getByRole('button', { name: /05 · HOT PARTITION/ }).click()
  await expect(page.getByText('THROTTLING').first()).toBeVisible({ timeout: 10_000 })
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

test('lab: the journey spine deep-links its toys into the lab', async ({ page }) => {
  await page.goto('/#/lab')
  // stations render top to bottom; each toy is a card under its station
  await expect(page.getByText("THE DATABASE'S DOOR", { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '10 · CONNECTION POOL' }).click()
  await expect(page).toHaveURL(/#\/lab\/connpool$/)
  // the toy page names its single takeaway
  await expect(page.getByText('THE CLICK')).toBeVisible()
})

test('lab: the memory pair — tlb toll falls into swap, false sharing stalls', async ({ page }) => {
  // The TLB Toll: drag the working set past RAM into swap
  await page.goto('/#/lab/tlb-toll')
  await page.getByRole('slider', { name: /working set/ }).evaluate((el) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, '26')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.getByText('swap', { exact: false }).first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-tlb-toll.png', fullPage: true })
  // False Sharing: padding restores scaling
  await page.goto('/#/lab/false-sharing')
  await page.getByRole('button', { name: 'padded apart' }).click()
  await expect(page.getByText('padded: scales', { exact: false })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/lab-false-sharing.png', fullPage: true })
})

test('lab: the chip trio — instruction loop pipelines, heat wall throttles', async ({ page }) => {
  // The Instruction Loop: pipelining collapses the cycle count
  await page.goto('/#/lab/instruction-loop')
  await expect(page.getByText('6 instructions in', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: /pipeline: OFF/ }).click()
  await expect(page.getByText(/pipeline: ON/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-instruction-loop.png', fullPage: true })
  // The Heat Wall: push the clock past the cooling budget
  await page.goto('/#/lab/heat-wall')
  await page.getByRole('slider', { name: /clock frequency/ }).evaluate((el) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, '6')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.getByText('THROTTLING', { exact: false }).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/lab-heat-wall.png', fullPage: true })
})

test('lab: the cache cliff plots the memory staircase and falls off it', async ({ page }) => {
  await page.goto('/#/lab/cachecliff')
  await expect(page.getByText(/avg access/).first()).toBeVisible()
  // drag the working set to the far end (into DRAM) on the random curve
  const slider = page.getByRole('slider', { name: /working set/ })
  await slider.focus()
  for (let i = 0; i < 130; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByText(/lives in DRAM/)).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-cachecliff.png', fullPage: true })
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

test('drills: category label, then calibration via the quiet link', async ({ page }) => {
  await page.goto('/#/drills')
  await expect(page.getByText(/ESTIMATE · /)).toBeVisible()
  await page.getByRole('button', { name: 'Lock it in' }).click()
  await page.getByRole('button', { name: 'try again' }).click()
  await page.getByRole('button', { name: /CALIBRATION —/ }).click()
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
  await expect(page.getByText('YOU SAID').first()).toBeVisible()
  await page.getByRole('button', { name: /blind spots by theme/ }).click()
  await expect(page.getByText(/MISSED 1×/).first()).toBeVisible()
  // back to the log, then into the pre-interview briefing
  await page.getByRole('button', { name: /the journal/ }).click()
  await page.getByRole('button', { name: 'pre-interview briefing' }).click()
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

// ---- The Forge (spec 070): the progression spine across three modes ----

test('forge: parts start locked in the Builder, with the way out on every row', async ({ page }) => {
  await page.goto('/#/builder')
  await expect(page.getByText('⚒ THE PARTS BIN')).toBeVisible()
  await expect(page.getByText('0/6 forged')).toBeVisible()
  await page.getByRole('button', { name: /Open the workbench/i }).click()
  // locked rows are greyed and present — never hidden — and each links to its toy
  await expect(page.getByText('Cache nodes · $200', { exact: true })).toBeVisible()
  await expect(page.getByText('Read replicas · $400', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'forge →' })).toHaveCount(4)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/builder-forge-locked.png', fullPage: true })
})

test('forge: the challenge stays shut until the toy has clicked', async ({ page }) => {
  await page.goto('/#/lab/stampede')
  await expect(page.getByText(/forges the .* for the Builder and On-Call/)).toBeVisible()
  await expect(page.getByText('Cache node — locked')).toBeVisible()
})

test('forge: answering the hit-rate challenge unlocks the cache node in the Builder', async ({ page }) => {
  // seed the toy as internalized — the sim itself is covered by its own test
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nanosecond-progress',
      JSON.stringify({ state: { toysCompleted: { stampede: true }, sectionsRead: {}, forecasts: {}, forged: {} }, version: 0 }),
    )
  })
  await page.goto('/#/lab/stampede')
  await expect(page.getByText('⚒ THE FORGE · HIT-RATE CHALLENGE')).toBeVisible()
  await page.getByRole('button', { name: /80% — misses have to fall/ }).click()
  await expect(page.getByText('FORGED', { exact: true })).toBeVisible()
  await expect(page.getByText('Cache node forged')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/lab-forge.png', fullPage: true })

  await page.goto('/#/builder')
  await expect(page.getByText('1/6 forged')).toBeVisible()
  await page.getByRole('button', { name: /Open the workbench/i }).click()
  // the locked stand-in is gone; the real stepper is in its place
  await expect(page.getByText('Cache nodes · $200', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Cache nodes · $200 · 100k ops')).toBeVisible()
  await expect(page.getByRole('link', { name: 'forge →' })).toHaveCount(3)
})

test('forge: a wrong answer explains itself and lands in the scar journal', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nanosecond-progress',
      JSON.stringify({ state: { toysCompleted: { hotpartition: true }, sectionsRead: {}, forecasts: {}, forged: {} }, version: 0 }),
    )
  })
  await page.goto('/#/lab/hotpartition')
  await page.getByRole('button', { name: /event_id — every query already names an event/ }).click()
  await expect(page.getByText('NOT YET')).toBeVisible()
  await expect(page.getByText(/Sharding by the hot key is not sharding/)).toBeVisible()
  await expect(page.getByText('DB shard — locked')).toBeVisible()
  await page.goto('/#/journal')
  await expect(page.getByText(/KEY-CHOICE CHALLENGE/).first()).toBeVisible()
})

test('forge at 380px: the parts bin, a locked workbench and a challenge all fit', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 900 })
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'nanosecond-progress',
      JSON.stringify({ state: { toysCompleted: { hotpartition: true }, sectionsRead: {}, forecasts: {}, forged: {} }, version: 0 }),
    )
  })
  const noOverflow = async () => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  }
  await page.goto('/#/builder')
  await expect(page.getByText('⚒ THE PARTS BIN')).toBeVisible()
  await noOverflow()
  await page.getByRole('button', { name: /Open the workbench/i }).click()
  await noOverflow()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'e2e/shots/builder-forge-380px.png', fullPage: true })
  await page.goto('/#/lab/hotpartition')
  await expect(page.getByText('⚒ THE FORGE · KEY-CHOICE CHALLENGE')).toBeVisible()
  await noOverflow()
  await page.screenshot({ path: 'e2e/shots/lab-forge-380px.png', fullPage: true })
  // On-Call carries the same locked rows in its stack panel
  await page.goto('/#/on-call')
  await page.getByRole('button', { name: /Launch Day/ }).click()
  await expect(page.getByText('Cache nodes · $200', { exact: true })).toBeVisible()
  await noOverflow()
})
