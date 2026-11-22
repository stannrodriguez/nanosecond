import { useRef, useState } from 'react'
import { C } from '../../theme'
import { Punchline } from '../../ui/Punchline'
import { Button } from '../../ui/kit'
import { useRaf } from '../../ui/useRaf'
import { fmtNum } from '../../ui/fmt'

/* TOY 09 — LSM vs B-TREE: same writes, two engines, opposite physics. */

const TOTAL_WRITES = 50_000
const BTREE_WPS = 120 * 25 // random page updates; 25 pages batched per seek-ish — still ~3k/s
const LSM_WPS = 100_000 // sequential appends
const FLUSH_EVERY = 10_000 // writes per flushed LSM file

export function LsmVsBtree({ onComplete }: { onComplete: () => void }) {
  const [running, setRunning] = useState(false)
  const [readResult, setReadResult] = useState<null | { btreeMs: number; lsmMs: number }>(null)
  const [, force] = useState(0)
  const S = useRef({ btree: 0, lsm: 0, files: 0, done: false })

  useRaf((dt) => {
    const s = S.current
    const SLOW = 6 // slow the race so it's watchable
    s.btree = Math.min(TOTAL_WRITES, s.btree + (BTREE_WPS / SLOW) * dt * 60)
    s.lsm = Math.min(TOTAL_WRITES, s.lsm + (LSM_WPS / SLOW) * dt * 60)
    s.files = Math.min(Math.floor(s.lsm / FLUSH_EVERY), Math.ceil(TOTAL_WRITES / FLUSH_EVERY))
    if (s.btree >= TOTAL_WRITES && !s.done) {
      s.done = true
      setRunning(false)
    }
    force((x) => x + 1)
  }, running)

  const s = S.current
  const reset = () => {
    S.current = { btree: 0, lsm: 0, files: 0, done: false }
    setReadResult(null)
  }

  const readOneRow = () => {
    const btreeMs = 3 * 8 // ~3 page hops × 8ms (cold, spinning disk for drama)
    const lsmMs = Math.max(1, s.files) * 8 // check each file, newest first
    setReadResult({ btreeMs, lsmMs })
    onComplete()
  }

  return (
    <div>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, marginTop: 4 }}>
        Both engines get the same stream of {fmtNum(TOTAL_WRITES)} row updates. The <b>B-tree</b> files each row in place,
        doing a random page read-modify-write every time. The <b>LSM</b> declines to hunt: it appends to a memory buffer and
        flushes sorted files sequentially. Run the race, then send a single read to see who picks up the tab.
      </p>
      <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
        <Button variant={running ? 'secondary' : 'primary'} size="lg" onClick={() => (s.done ? (reset(), setRunning(true)) : setRunning(!running))}>
          {running ? 'Pause' : s.done ? 'Race again' : s.btree > 0 ? 'Resume' : 'Start the write race'}
        </Button>
        <Button variant="ghost" onClick={() => { setRunning(false); reset() }} style={{ background: C.panel, fontWeight: 400 }}>
          Reset
        </Button>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
        {(
          [
            { name: 'B-tree (in-place updates)', v: s.btree, col: C.storage, note: `${fmtNum(BTREE_WPS)} writes/s. Every write hunts down its page on disk.` },
            { name: `LSM (append and flush) · ${s.files} files on disk`, v: s.lsm, col: C.mem, note: `${fmtNum(LSM_WPS)} writes/s. The disk only writes sequentially.` },
          ] as const
        ).map((e) => (
          <div key={e.name} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span>{e.name}</span>
              <span className="mono" style={{ color: e.col, fontWeight: 600 }}>
                {fmtNum(e.v)} / {fmtNum(TOTAL_WRITES)}
              </span>
            </div>
            <div style={{ height: 14, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(e.v / TOTAL_WRITES) * 100}%`, background: `linear-gradient(90deg, ${e.col}55, ${e.col})` }} />
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>{e.note}</div>
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <button
            onClick={readOneRow}
            disabled={s.lsm < FLUSH_EVERY}
            style={{ padding: '9px 18px', borderRadius: 8, background: s.lsm < FLUSH_EVERY ? C.line : C.compute, color: s.lsm < FLUSH_EVERY ? C.faint : C.bg, border: 'none', fontWeight: 700, fontSize: 13, cursor: s.lsm < FLUSH_EVERY ? 'default' : 'pointer' }}
          >
            Read one row (cold)
          </button>
          {readResult && (
            <div className="mono" style={{ marginTop: 10, fontSize: 13, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <span style={{ color: C.storage }}>
                B-tree: <b>{readResult.btreeMs} ms</b> (3 page hops, found it)
              </span>
              <span style={{ color: readResult.lsmMs > readResult.btreeMs ? C.alert : C.mem }}>
                LSM: <b>{readResult.lsmMs} ms</b> (checked {Math.max(1, s.files)} {Math.max(1, s.files) === 1 ? 'file' : 'files'}, newest first)
              </span>
            </div>
          )}
        </div>
      </div>

      <Punchline color={C.storage}>
        Neither engine is simply faster. They just move the same work to opposite ends of the timeline. A B-tree pays up front
        at write time, running into random I/O and the disk's 120/s ceiling. An LSM defers the cost to reads (every unmerged
        file is another place a row can hide) and pays an ongoing background compaction tax to tidy up. Cassandra, RocksDB, and
        LevelDB pick LSMs for relentless write streams; Postgres and MySQL pick B-trees because most applications read far more
        than they write. Name the trade, not the brand: <b>write amplification vs read amplification</b>.
      </Punchline>
    </div>
  )
}
