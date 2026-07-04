// Builder scenarios (docs/content-pipeline.md §6). Story → translate → think →
// targets. JSX is copy + <Term> links only. Spec 010 ports the original three;
// three more arrive with the content pipeline work.

import type { ReactNode } from 'react'
import { Term as T } from '../ui/Term'

export interface TranslateRow {
  math: string
  out: string
}

export interface Scenario {
  name: string
  rps: number
  readPct: number
  budget: number
  p99Target: number
  /** traffic profile multiplier per tick 0..TICKS */
  profile: (t: number) => number
  story: ReactNode
  translate: TranslateRow[]
  think: ReactNode[]
}

export const SCENARIO_TICKS = 30

export const SCENARIOS: Scenario[] = [
  {
    name: 'Blog goes viral',
    rps: 8000,
    readPct: 0.98,
    budget: 2000,
    p99Target: 150,
    profile: (t) => Math.min(1, t / 10),
    story: (
      <>
        You wrote a post last night. This morning it's #1 on Hacker News. Thousands of people are opening the <i>same page</i>{' '}
        right now — each visit is a <T k="read">read</T> (fetch the post, fetch comments). A handful leave comments — those are{' '}
        <T k="write">writes</T>. Nobody warned your one small server.
      </>
    ),
    translate: [
      { math: '~40k readers over the peak hour, ~5 page-loads each, clumped', out: '≈ 8,000 req/s at peak' },
      { math: 'readers vastly outnumber commenters (lurker rule ~50:1)', out: '98% reads · 2% writes' },
      { math: 'everyone wants the SAME post', out: 'cache hit rate can be very high' },
    ],
    think: [
      <>
        Everyone is reading one identical page. What does that mean for a <T k="cache">cache</T>'s <T k="hitrate">hit rate</T> —
        and how little database do you actually need?
      </>,
      <>160 writes/s of comments — is the database's write side ever in danger here?</>,
    ],
  },
  {
    name: 'Ticket sale launch',
    rps: 45000,
    readPct: 0.9,
    budget: 6500,
    p99Target: 200,
    profile: (t) => Math.min(1, t / 8),
    story: (
      <>
        A stadium show goes on sale at noon sharp. Half a million fans are camped on the page. At 12:00:00 they all start
        hammering refresh on seat maps and prices (<T k="read">reads</T>), and the lucky ones complete purchases (
        <T k="write">writes</T>). A purchase is a serious write: it must be <T k="durable">durable</T> and correct — selling one
        seat twice is a lawsuit, so no shortcuts on the write path.
      </>
    ),
    translate: [
      { math: '500k fans × ~5–6 refreshes/min in the rush, overlapping', out: '≈ 45,000 req/s at peak' },
      { math: 'browsing dominates; only some reach checkout', out: '90% reads · 10% writes' },
      { math: '10% of 45k', out: "4,500 writes/s — versus one primary's ~10k ceiling" },
    ],
    think: [
      <>
        40,500 reads/s: mostly the same seat maps. How much reaches the database after an 85–90% <T k="hitrate">hit rate</T> —
        and can what's left fit, or do you need <T k="replica">replicas</T>?
      </>,
      <>
        4,500 writes/s fits one primary at ~45% <T k="util">utilization</T>… is that comfortable, or one clump away from the
        knee?
      </>,
      <>
        Could you <T k="queue">queue</T> purchases? Careful — a buyer needs to know NOW if they got the seat. Which writes
        tolerate delay is a design decision, not a technical one.
      </>,
    ],
  },
  {
    name: 'Sensor firehose',
    rps: 9000,
    readPct: 0.15,
    budget: 5000,
    p99Target: 250,
    profile: (t) => (t >= 12 && t <= 22 ? 2.2 : 1) * Math.min(1, t / 6),
    story: (
      <>
        A logistics company straps a tracker on each of its 60,000 delivery vans. Every 8 seconds, every tracker{' '}
        <T k="phonehome">phones home</T>: "here's my GPS position, speed, engine temp." Each report is a <T k="write">write</T> —
        the device deposits data and asks nothing back. The only <T k="read">reads</T> are dispatchers watching dashboards.
        Mid-run, a cell-network hiccup disconnects a chunk of the fleet; when it recovers, they all reconnect and resend at once
        — a classic <T k="herd">thundering herd</T> at ~2× normal volume.
      </>
    ),
    translate: [
      { math: '60,000 vans ÷ 1 report per 8s', out: '= 7,500 writes/s, flat, 24/7' },
      { math: 'dashboards + API queries on top', out: '≈ 9,000 req/s · 15% reads / 85% writes' },
      { math: 'herd burst: 2.2 × 7,650', out: "≈ 16,800 writes/s vs one primary's 10k ceiling" },
    ],
    think: [
      <>
        Steady state fits one primary (~77% <T k="util">utilization</T> — already near the knee). The burst does not. Two
        philosophies: buy capacity for the peak (<T k="shard">shards</T>) or buy time (<T k="queue">queue</T>).
      </>,
      <>
        The deciding question: does anyone suffer if a GPS ping lands 30 seconds late? For telemetry — no. That tolerance is what
        makes the <T k="queue">queue</T> option legitimate here and NOT at the ticket checkout.
      </>,
      <>
        If you queue: workers + primary must drain the <T k="backlog">backlog</T> after the burst. Size the drain, not just the
        intake.
      </>,
    ],
  },
]
