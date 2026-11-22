// LossToggle (spec 069, networking briefing block 2): the same live video
// call over both transport promises, with packet loss on a slider. The TCP
// lane repairs every loss and stalls; the UDP lane shrugs losses off and
// stays current. Model: 30 packets/s and an 80 ms round trip (stated in the
// block's fine print) — each lost packet freezes a TCP stream for ≥1 RTT, so
// the frozen share of each second is rate × loss × RTT.

import { useState } from 'react'
import { C } from '../theme'
import { VizFrame, Bars } from './viz'

const RATE = 30 // packets per second
const RTT = 0.08 // seconds

const fmtPct = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

function tcpFeel(loss: number): string {
  if (loss === 0) return 'On a clean network, reliability costs nothing extra. That is why TCP makes such a strong default.'
  if (loss <= 2) {
    const gap = (1 / (RATE * (loss / 100))).toFixed(1)
    return `A freeze roughly every ${gap} s, each ≥ 80 ms. The call hitches, then rushes to catch up: every byte arrives, just not on time.`
  }
  if (loss <= 6)
    return 'Stalls begin stacking on top of each other, leaving the buffer perpetually waiting on a missing packet. The stream is completely reliable and completely unwatchable.'
  return 'Now the video is a slideshow. TCP is keeping its promise to the letter, which is exactly why that promise fails live media.'
}

function udpFeel(loss: number): string {
  if (loss === 0) return 'Feels identical to TCP on a clean wire, minus the handshake round trip you never had to pay.'
  if (loss <= 2) return 'A tiny glitch you barely register, and the conversation keeps flowing. In live media, lost beats late.'
  if (loss <= 6)
    return 'Audio crackles and drops the occasional syllable, yet the call stays live and understandable. The app smooths over missing pieces instead of pausing for them.'
  return 'Rough, though still real-time. No transport protocol rescues loss this heavy, yet UDP keeps the packets that do arrive current.'
}

function Lane({
  title,
  col,
  promise,
  stat,
  barLabel,
  barFrac,
  barTag,
  feel,
}: {
  title: string
  col: string
  promise: string
  stat: string
  barLabel: string
  barFrac: number
  barTag: string
  feel: string
}) {
  return (
    <div style={{ border: `1px solid ${col}44`, borderRadius: 8, padding: '10px 12px', flex: '1 1 260px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px 10px', flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <span style={{ fontSize: 12, color: C.faint }}>{promise}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 8 }}>{stat}</div>
      <Bars bars={[{ label: barLabel, frac: barFrac, col, tag: barTag }]} />
      <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.55, marginTop: 10 }}>{feel}</div>
    </div>
  )
}

export function LossToggle({ accent = C.net }: { accent?: string }) {
  const [loss, setLoss] = useState(2)
  // one lost packet freezes the TCP stream ≥1 RTT → frozen share = rate·loss·RTT
  const stallPct = Math.min(100, RATE * loss * RTT)
  return (
    <VizFrame accent={accent}>
      <label style={{ display: 'block' }}>
        <span className="mono" style={{ fontSize: 11.5, color: C.dim, letterSpacing: 0.5 }}>
          same wire, both promises · packet loss: <b style={{ color: accent }}>{fmtPct(loss)}%</b>
        </span>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={loss}
          onChange={(e) => setLoss(Number(e.target.value))}
          style={{ marginTop: 8 }}
          aria-label="packet loss"
        />
      </label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <Lane
          title="TCP · live video call"
          col={C.net}
          promise="“every byte, in order”: repairs loss, pauses the stream"
          stat={loss === 0 ? 'smooth, nothing to repair' : `${fmtPct(stallPct)}% of each second spent frozen`}
          barLabel="frozen"
          barFrac={stallPct / 100}
          barTag={`${fmtPct(stallPct)}%`}
          feel={tcpFeel(loss)}
        />
        <Lane
          title="UDP · the same call"
          col={C.mem}
          promise="“deliver on arrival”: skips lost frames, keeps moving"
          stat={loss === 0 ? 'smooth, nothing to lose' : `${fmtPct(loss)}% of frames simply gone`}
          barLabel="lost"
          barFrac={loss / 100}
          barTag={`${fmtPct(loss)}%`}
          feel={udpFeel(loss)}
        />
      </div>
    </VizFrame>
  )
}
