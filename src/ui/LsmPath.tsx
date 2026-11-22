// LsmPath (spec 076, indexing block 4): the log-structured write path, one
// stage at a time. The point the steps are built to make is that durability
// arrives at stage 1 (the fsynced log) and speed arrives at stage 2 (the
// in-memory table) — two different components that get merged into one in most
// explanations. The bloom-filter toggle switches the read cost between "consult
// every file" and "consult the one file the filter could not rule out", which is
// the mitigation that makes the read path survivable at all.

import { useState } from 'react'
import { C } from '../theme'
import { VizFrame } from './viz'

interface Stage {
  id: string
  label: string
  durable: string
  memory: string
  disk: string
  /** files a read of this key must actually open, with and without bloom filters */
  reads: (bloom: boolean) => string
  note: string
}

const STAGES: Stage[] = [
  {
    id: 'wal',
    label: '1 · append to the write-ahead log, fsync',
    durable: 'YES, the moment fsync returns',
    memory: 'not in memory yet',
    disk: 'log + 6 SSTables',
    reads: (b) => (b ? 'memtable, then 1 of 6 SSTables' : 'memtable, then all 6 SSTables'),
    note: 'One sequential append followed by one fsync. That single step handles durability. Everything after this exists for speed, not safety.',
  },
  {
    id: 'memtable',
    label: '2 · insert into the in-memory table',
    durable: 'YES, still backed by the log',
    memory: 'new key stored in sorted order',
    disk: 'log + 6 SSTables',
    reads: () => 'memtable hit (0 disk reads)',
    note: 'Inserted at RAM speed and kept sorted so the later flush becomes one clean sequential write. Any read for this key now stops in the memtable and never touches disk.',
  },
  {
    id: 'flush',
    label: '3 · memtable fills → flush as an immutable SSTable',
    durable: 'YES, now in the SSTable too',
    memory: 'cleared, ready for the next 64 MB',
    disk: '7 SSTables',
    reads: (b) => (b ? 'memtable (miss), then 1 of 7 SSTables' : 'memtable (miss), then all 7 SSTables'),
    note: 'Around 64 MB, the memtable flushes out in one sequential burst as a file that will never be edited. The file count just climbed by one, raising the work for every read that misses RAM.',
  },
  {
    id: 'compaction',
    label: '4 · compaction merges files in the background',
    durable: 'YES',
    memory: 'live memtable only',
    disk: '2 SSTables',
    reads: (b) => (b ? 'memtable (miss), then 1 of 2 SSTables' : 'memtable (miss), then both SSTables'),
    note: 'Background workers merge older files, keep only the newest value for each key, and drop tombstones for good. Here is where an LSM pays for its fast writes: the same bytes get rewritten several times over their lifetime, using background I/O that shares bandwidth with live traffic.',
  },
]

function Row({ label, value, bright }: { label: string; value: string; bright?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(72px, 96px) 1fr', gap: 10, marginTop: 7 }}>
      <span
        className="mono"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.1, color: C.faint, textAlign: 'right', paddingTop: 2 }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: bright ? C.text : C.dim, lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}

export function LsmPath({ accent = C.storage }: { accent?: string }) {
  const [i, setI] = useState(0)
  const [bloom, setBloom] = useState(true)
  const stage = STAGES[i]
  return (
    <VizFrame accent={accent}>
      <div className="mono" style={{ fontSize: 11, color: C.dim, letterSpacing: 0.5, marginBottom: 10 }}>
        one write, four stages · watch what a READ costs at each step
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {STAGES.map((s, k) => {
          const on = k === i
          return (
            <button
              key={s.id}
              onClick={() => setI(k)}
              aria-pressed={on}
              className="mono"
              style={{
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: 11.5,
                fontWeight: on ? 700 : 500,
                color: on ? accent : C.faint,
                background: on ? accent + '14' : 'transparent',
                border: `1px solid ${on ? accent : C.line}`,
                borderRadius: 8,
                padding: '7px 11px',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 6 }}>
        <Row label="DURABLE" value={stage.durable} bright />
        <Row label="IN MEMORY" value={stage.memory} />
        <Row label="ON DISK" value={stage.disk} />
        <Row label="A READ COSTS" value={stage.reads(bloom)} bright />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={bloom} onChange={(e) => setBloom(e.target.checked)} aria-label="bloom filters" />
        <span className="mono" style={{ fontSize: 11.5, color: bloom ? accent : C.dim }}>
          bloom filter per file {bloom ? '· on' : '· off'}
        </span>
      </label>
      <div style={{ fontSize: 12.5, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>
        {bloom
          ? 'A few bits per key let the engine rule most files OUT with certainty, so the read only opens the file that might hold your key.'
          : 'Without bloom filters, a read has to check every file on disk, because any one of them could hold a newer version of the key.'}
      </div>

      <div style={{ fontSize: 13, color: C.text, marginTop: 12, lineHeight: 1.55, minHeight: 66 }}>{stage.note}</div>
    </VizFrame>
  )
}
