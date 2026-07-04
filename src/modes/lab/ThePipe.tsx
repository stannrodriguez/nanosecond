import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'

/* TOY 07 — THE PIPE: bandwidth × RTT; the ACK has to come back. */

const LINK_MBPS = 1000 // 1 Gbps link
const WINDOWS = [64, 256, 1024, 4096, 16384] // KB

export function ThePipe({ onComplete }: { onComplete: () => void }) {
  const [rtt, setRtt] = useState(70)
  const [winIdx, setWinIdx] = useState(1)
  const moved = useRef({ rtt: false, win: false })

  const windowKB = WINDOWS[winIdx]
  const throughputMBs = Math.min(LINK_MBPS / 8, windowKB / 1024 / (rtt / 1000)) // MB/s
  const linkMBs = LINK_MBPS / 8
  const util = throughputMBs / linkMBs
  const bdpKB = (linkMBs * 1024 * rtt) / 1000

  const mark = (k: 'rtt' | 'win') => {
    moved.current[k] = true
    if (moved.current.rtt && moved.current.win) onComplete()
  }

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        A 1 Gbps link, one TCP stream. The sender may only have one <b>window</b> of unacknowledged bytes in flight — then it
        must stop and wait for ACKs, which travel at the speed of light like everything else. So a single stream's ceiling
        isn't the link. It's <span className="mono">window ÷ RTT</span>. Drag both and watch the fat pipe run empty.
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '14px 0' }}>
        <div style={{ flex: '1 1 240px' }}>
          <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
            round-trip time: <b style={{ color: C.text }}>{rtt} ms</b>{' '}
            <span style={{ color: C.faint }}>{rtt <= 1 ? '(same rack)' : rtt <= 10 ? '(same metro)' : rtt <= 90 ? '(cross-country)' : '(intercontinental)'}</span>
          </div>
          <input type="range" min={1} max={200} value={rtt} onChange={(e) => { setRtt(+e.target.value); mark('rtt') }} aria-label="round trip time" />
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <div className="mono" style={{ fontSize: 12.5, color: C.dim, marginBottom: 4 }}>
            TCP window: <b style={{ color: C.text }}>{windowKB >= 1024 ? `${windowKB / 1024} MB` : `${windowKB} KB`}</b>
          </div>
          <input type="range" min={0} max={WINDOWS.length - 1} value={winIdx} onChange={(e) => { setWinIdx(+e.target.value); mark('win') }} aria-label="TCP window size" />
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        {/* the pipe */}
        <div style={{ position: 'relative', height: 46, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 23, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${Math.max(1.5, util * 100)}%`,
              background: `linear-gradient(90deg, ${C.net}33, ${C.net})`,
              transition: 'width .25s',
            }}
          />
          <span className="mono" style={{ position: 'absolute', right: 12, top: 14, fontSize: 12, color: util < 0.3 ? C.alert : C.dim }}>
            link {Math.round(util * 100)}% full
          </span>
        </div>
        <div className="mono" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, marginTop: 12 }}>
          <span style={{ color: C.dim }}>
            one stream delivers <b style={{ color: util < 0.3 ? C.alert : C.ok }}>{throughputMBs >= 100 ? Math.round(throughputMBs) : throughputMBs.toFixed(1)} MB/s</b>
            <span style={{ color: C.faint }}> of {Math.round(linkMBs)} MB/s</span>
          </span>
          <span style={{ color: C.dim }}>
            to fill this link you'd need <b style={{ color: C.compute }}>{bdpKB >= 1024 ? `${(bdpKB / 1024).toFixed(1)} MB` : `${Math.round(bdpKB)} KB`}</b> in flight
            <span style={{ color: C.faint }}> (bandwidth × RTT)</span>
          </span>
        </div>
      </div>

      <Punchline color={C.net}>
        Bandwidth is not throughput. A 1 Gbps cross-country link needs <b>~8.75 MB</b> continuously in flight (1 Gbps × 70 ms)
        before one stream can fill it — and default windows are a fraction of that, so the pipe runs mostly <i>empty</i> while
        everyone blames "the network". This is why big transfers use parallel streams, why browsers open multiple connections,
        why CDNs win by shrinking RTT instead of buying bandwidth, and why "just get a fatter pipe" so often changes nothing.
      </Punchline>
    </div>
  )
}
