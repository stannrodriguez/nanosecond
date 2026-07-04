import { useState, type ComponentType } from 'react'
import { ModeHeader } from '../../ui/ModeHeader'
import { TabNav } from '../../ui/TabNav'
import { CH_COLOR } from '../../theme'
import { TOYS } from '../../content/toys'
import { FinePrint } from '../../ui/FinePrint'
import { RaceLight } from './RaceLight'
import { TheDisk } from './TheDisk'
import { LeakyBits } from './LeakyBits'
import { TheQueue } from './TheQueue'

const TOY_COMPONENTS: Record<string, ComponentType> = {
  light: RaceLight,
  disk: TheDisk,
  dram: LeakyBits,
  queue: TheQueue,
}

export default function Lab() {
  const [toyId, setToyId] = useState('light')
  const toy = TOYS.find((t) => t.id === toyId)!
  const Comp = TOY_COMPONENTS[toyId]
  return (
    <div>
      <ModeHeader title="INTUITION LAB" thesis="numbers don't stick — mechanisms do">
        <TabNav
          tabs={TOYS.map((t) => ({ id: t.id, label: `${t.n} · ${t.name}`, sub: t.sub, ch: CH_COLOR[t.ch] }))}
          active={toyId}
          onPick={setToyId}
        />
      </ModeHeader>
      <Comp />
      <FinePrint text={toy.simplifies} />
    </div>
  )
}
