import { useState, type ComponentType } from 'react'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { C, CH_COLOR } from '../../theme'
import { TOYS } from '../../content/toys'
import { COMPONENTS } from '../../content/components'
import { FinePrint } from '../../ui/FinePrint'
import { useProgress } from '../../state/progress'
import { RaceLight } from './RaceLight'
import { TheDisk } from './TheDisk'
import { LeakyBits } from './LeakyBits'
import { TheQueue } from './TheQueue'
import { HotPartition } from './HotPartition'
import { ReplicationLag } from './ReplicationLag'
import { ThePipe } from './ThePipe'
import { ConsensusRTT } from './ConsensusRTT'
import { LsmVsBtree } from './LsmVsBtree'
import { ConnectionPool } from './ConnectionPool'
import { Backpressure } from './Backpressure'
import { TtlStampede } from './TtlStampede'

// The toy registry: metadata lives in content/toys.ts, sims live here.
const TOY_COMPONENTS: Record<string, ComponentType<{ onComplete: () => void }>> = {
  light: RaceLight,
  disk: TheDisk,
  dram: LeakyBits,
  queue: TheQueue,
  hotpartition: HotPartition,
  replag: ReplicationLag,
  pipe: ThePipe,
  consensus: ConsensusRTT,
  lsmbtree: LsmVsBtree,
  connpool: ConnectionPool,
  backpressure: Backpressure,
  stampede: TtlStampede,
}

export default function Lab() {
  const [toyId, setToyId] = useState('light')
  const { toysCompleted, completeToy } = useProgress()
  const toy = TOYS.find((t) => t.id === toyId)!
  const Comp = TOY_COMPONENTS[toyId]
  const done = !!toysCompleted[toyId]
  // forge ids use the product-spec plural names; map to parts-bin components
  const FORGE_TO_COMPONENT: Record<string, string> = { shards: 'shard', replicas: 'replica', cache: 'cache', queue: 'queue' }
  const forgedComp = toy.forgeUnlocks ? COMPONENTS.find((c) => c.id === FORGE_TO_COMPONENT[toy.forgeUnlocks!]) : null
  const forgedName =
    forgedComp?.name ?? (toy.forgeUnlocks === 'workers' ? 'Workers' : toy.forgeUnlocks === 'cdn' ? 'CDN' : toy.forgeUnlocks)
  return (
    <div>
      <ModeHeader title="INTUITION LAB" thesis="numbers don't stick — mechanisms do">
        <TabNav
          tabs={TOYS.map((t) => ({
            id: t.id,
            label: `${toysCompleted[t.id] ? '✓ ' : ''}${t.n} · ${t.name}`,
            sub: t.sub,
            ch: CH_COLOR[t.ch],
          }))}
          active={toyId}
          onPick={setToyId}
        />
      </ModeHeader>
      <p style={{ color: C.text, fontSize: 14.5, margin: '0 0 6px', fontWeight: 500 }}>{toy.oneLiner}</p>
      {done && toy.forgeUnlocks && (
        <span
          className="mono"
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            color: C.gold,
            border: `1px solid ${C.gold}66`,
            borderRadius: 6,
            padding: '3px 8px',
            marginBottom: 4,
          }}
        >
          ⚒ FORGED: {String(forgedName).toUpperCase()} — unlocked for the Builder
        </span>
      )}
      <Comp onComplete={() => completeToy(toyId)} />
      <FinePrint text={toy.simplifies} />
    </div>
  )
}
