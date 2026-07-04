// Field Manual sections — plain-language briefings with small diagrams.
// JSX here is content (copy + <Term> links), not logic; spec 020 grows this
// to 10 sections.

import type { ReactNode } from 'react'
import { C } from '../theme'
import { Term as T } from '../ui/Term'

export interface ManualSection {
  id: string
  title: string
  body: ReactNode
}

function RequestFlow() {
  const stops = [
    { label: 'phone', ms: '', col: C.dim },
    { label: 'load balancer', ms: '~1 ms', col: C.net },
    { label: 'app server', ms: '~3 ms', col: C.compute },
    { label: 'cache', ms: '~1 ms', col: C.mem },
    { label: 'database', ms: '~5 ms', col: C.storage },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '14px 0' }}>
      {stops.map((s, i) => (
        <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ textAlign: 'center' }}>
            <span
              style={{
                display: 'block',
                padding: '10px 12px',
                background: C.bg,
                border: `1.5px solid ${s.col}`,
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: s.col,
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </span>
            <span className="mono" style={{ display: 'block', fontSize: 10, color: C.faint, marginTop: 3 }}>
              {s.ms}
            </span>
          </span>
          {i < stops.length - 1 && <span style={{ color: C.faint, fontSize: 16, margin: '0 2px', paddingBottom: 14 }}>→</span>}
        </span>
      ))}
    </div>
  )
}

function Spark({ d, col }: { d: string; col: string }) {
  return (
    <svg width="110" height="34" viewBox="0 0 110 34">
      <polyline points={d} fill="none" stroke={col} strokeWidth="2" />
      <line x1="0" y1="32" x2="110" y2="32" stroke={C.line} />
    </svg>
  )
}

export const MANUAL: ManualSection[] = [
  {
    id: 'request',
    title: 'Anatomy of one request',
    body: (
      <>
        <p>
          When someone taps a button, a <T k="request">request</T> makes this trip — and the reply retraces it:
        </p>
        <RequestFlow />
        <p>
          Each stop exists for one reason. The <T k="lb">load balancer</T> spreads traffic so servers are interchangeable. The{' '}
          <T k="appserver">app server</T> runs your logic. The <T k="cache">cache</T> intercepts repeat questions so most{' '}
          <T k="read">reads</T> never reach the database. The database is the slowest stop and the only one holding truth — which
          is why the whole architecture is arranged to protect it.
        </p>
        <p style={{ color: C.dim }}>
          Total: ~5–10 ms when healthy. Systems don't fail by this number growing gently — they fail when one stop saturates and
          its line explodes (see <T k="util">utilization</T>).
        </p>
      </>
    ),
  },
  {
    id: 'rw',
    title: "Reads vs writes — why they're priced differently",
    body: (
      <>
        <p>
          The first question to ask about ANY system: what's the <T k="readpct">read/write mix</T>?
        </p>
        <p>
          A <T k="read">read</T> just looks. Looking is cheap to scale because answers can be <i>copied</i> — into a{' '}
          <T k="cache">cache</T>, onto <T k="replica">replicas</T> — and served from anywhere.
        </p>
        <p>
          A <T k="write">write</T> changes the truth. It must be <T k="durable">durable</T> (on disk before you say "saved"), and
          every copy must learn about it. So copies don't help writes — each copy must do every write anyway. Your only write
          moves: split the data (<T k="shard">shard</T>) or buffer the burst (<T k="queue">queue</T>).
        </p>
        <div
          className="mono"
          style={{ fontSize: 12.5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', marginTop: 6 }}
        >
          read-heavy → cache + replicas &nbsp;·&nbsp; write-heavy → queue + shards
        </div>
      </>
    ),
  },
  {
    id: 'traffic',
    title: 'Where the traffic numbers come from',
    body: (
      <>
        <p>Interviewers give you a story, not a number. The translation is always the same shape:</p>
        <div
          className="mono"
          style={{ fontSize: 13, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0' }}
        >
          (how many actors) × (actions per actor per time) = requests per second
        </div>
        <p>
          Humans: 10M daily users × 50 taps/day ÷ 86,400s ≈ 5,800 <T k="rps">req/s</T> average (shortcut: 1M/day ≈ 12/s), then ×
          2–5 for peak hours. Machines (<T k="iot">IoT</T>): 60,000 devices <T k="phonehome">phoning home</T> every 8s = 7,500/s
          flat, day and night — no peak hours, but brutal <T k="burst">bursts</T> when they all act at once.
        </p>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
          <div>
            <Spark col={C.mem} d="0,20 20,19 40,21 60,19 80,20 110,20" />
            <div className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              machine-steady (IoT)
            </div>
          </div>
          <div>
            <Spark col={C.net} d="0,28 15,26 30,18 45,8 60,10 75,18 95,26 110,28" />
            <div className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              human-diurnal (apps)
            </div>
          </div>
          <div>
            <Spark col={C.alert} d="0,26 30,25 45,24 50,4 62,5 68,24 90,25 110,26" />
            <div className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              burst (launch, herd)
            </div>
          </div>
        </div>
        <p style={{ color: C.dim, marginTop: 10 }}>
          Design for the peak, pay for the average — that tension is what queues and autoscaling are for.
        </p>
      </>
    ),
  },
  {
    id: 'parts',
    title: 'The parts bin',
    body: null, // rendered from src/content/components.ts by the mode
  },
  {
    id: 'judge',
    title: "How you're judged (and why)",
    body: (
      <>
        <p>
          <b>
            <T k="p99">p99 latency</T>
          </b>{' '}
          — not the average. 99 quick requests hide one 3-second disaster; averages forgive it, users don't. <b>Error rate</b> — a
          request dropped at a saturated component is a user seeing a spinner. <b>Cost</b> — anyone can pass with 10× hardware;
          the skill is passing at 60–70% <T k="util">utilization</T> with money left over.
        </p>
        <p style={{ color: C.dim }}>
          Together these are your <T k="sla">SLA</T>. In interviews say it out loud: "I'm designing for p99 under 200ms at peak,
          and I'll keep steady-state utilization near 70% for burst headroom." That sentence is half the interview.
        </p>
      </>
    ),
  },
]
