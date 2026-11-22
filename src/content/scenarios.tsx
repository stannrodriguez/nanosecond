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
        You published a post last night, and this morning it hit #1 on Hacker News. Thousands of readers are opening the{' '}
        <i>same page</i> right now. Each visit is a <T k="read">read</T> (fetching the post and its comments), while a small
        fraction leave comments of their own, which are <T k="write">writes</T>. Nobody gave your lone small server a heads-up.
      </>
    ),
    translate: [
      { math: '~40k readers over the peak hour, ~5 page loads each, clumped together', out: '≈ 8,000 req/s at peak' },
      { math: 'readers far outnumber commenters (roughly 50:1 lurker ratio)', out: '98% reads · 2% writes' },
      { math: 'almost everyone is asking for the exact same post', out: 'cache hit rate can stay very high' },
    ],
    think: [
      <>
        Everyone is fetching one identical page. What does that let a <T k="cache">cache</T> do to its{' '}
        <T k="hitrate">hit rate</T>, and how small can the database tier stay?
      </>,
      <>Comments come in at 160 writes/s. Is the database's write path under any real threat here?</>,
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
        A stadium show goes on sale at noon sharp, and half a million fans are already camped on the page. At 12:00:00, they
        all start hammering refresh on seat maps and pricing (<T k="read">reads</T>), while the lucky ones complete purchases (
        <T k="write">writes</T>). A purchase is a high-stakes write: it has to be <T k="durable">durable</T> and exact. Selling
        the same seat twice turns into a lawsuit, so you cannot cut corners on the write path.
      </>
    ),
    translate: [
      { math: '500k fans × ~5 to 6 refreshes/min during the rush, overlapping', out: '≈ 45,000 req/s at peak' },
      { math: 'browsing dominates while only a fraction reach checkout', out: '90% reads · 10% writes' },
      { math: '10% of 45k', out: "4,500 writes/s against one primary's ~10k ceiling" },
    ],
    think: [
      <>
        You are looking at 40,500 reads/s, mostly for the same seat maps. How many misses still hit the database at an 85 to
        90% <T k="hitrate">hit rate</T>, and can one primary handle them or do you need <T k="replica">replicas</T>?
      </>,
      <>
        At 4,500 writes/s, a single primary sits near 45% <T k="util">utilization</T>. Is that plenty of room, or one nasty
        clump away from the knee?
      </>,
      <>
        Should you put purchases behind a <T k="queue">queue</T>? Pause before answering: a buyer expects to know right now
        whether they got the seat. Which writes can tolerate delay is a product decision, not just a technical one.
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
        A logistics company straps a tracker onto each of its 60,000 delivery vans. Every 8 seconds, each tracker{' '}
        <T k="phonehome">phones home</T> with its GPS position, speed, and engine temp. Every check-in is a{' '}
        <T k="write">write</T>: the van drops off telemetry and expects nothing back. The only <T k="read">reads</T> come from
        dispatchers watching live dashboards. Halfway through the run, a cell-network hiccup knocks part of the fleet offline;
        when service returns, those vans reconnect and resend together in a classic <T k="herd">thundering herd</T> at roughly
        2× normal volume.
      </>
    ),
    translate: [
      { math: '60,000 vans ÷ 1 report every 8s', out: '= 7,500 writes/s, steady, 24/7' },
      { math: 'dashboards + API queries layered on top', out: '≈ 9,000 req/s · 15% reads / 85% writes' },
      { math: 'herd burst: 2.2 × 7,650', out: "≈ 16,800 writes/s against one primary's 10k ceiling" },
    ],
    think: [
      <>
        Steady traffic fits on one primary (~77% <T k="util">utilization</T>, already hugging the knee), while the burst blows
        right past it. You have two paths: buy capacity for the peak (<T k="shard">shards</T>) or buy time (a{' '}
        <T k="queue">queue</T>).
      </>,
      <>
        Here is the deciding question: does anyone get hurt if a GPS ping arrives 30 seconds late? For telemetry, no. That
        slack is why a <T k="queue">queue</T> works cleanly here and fails at ticket checkout.
      </>,
      <>
        If you add a queue, your workers and primary still have to drain the <T k="backlog">backlog</T> once the burst passes.
        Size the drain, not just the intake.
      </>,
    ],
  },
]
