// The Forge gate (spec 070 / product-spec §3.8). These tests encode the rule
// the progression spine rests on: a part is usable only after its challenge is
// answered, and answering is idempotent.

import { beforeEach, describe, expect, it } from 'vitest'
import { FORGE, FORGEABLE, forgeById, forgeForToy } from '../src/content/forge'
import { COMPONENTS } from '../src/content/components'
import { forgedComponents, isForged, useProgress } from '../src/state/progress'

const reset = () => useProgress.setState({ toysCompleted: {}, sectionsRead: {}, forecasts: {}, forged: {} })

describe('the forge graph', () => {
  it('resolves a challenge by component id and by toy', () => {
    expect(forgeById('cache')!.toyId).toBe('stampede')
    expect(forgeForToy('light')!.id).toBe('cdn')
    expect(forgeById('nope')).toBeUndefined()
    expect(forgeForToy('cachecliff')).toBeUndefined()
  })

  it('every forgeable id is reachable from exactly one toy', () => {
    for (const id of FORGEABLE) {
      const owners = FORGE.filter((f) => f.id === id)
      expect(owners, id).toHaveLength(1)
    }
  })
})

describe('the gate', () => {
  beforeEach(reset)

  it('locks every gated part on a fresh save', () => {
    const { forged } = useProgress.getState()
    for (const id of FORGEABLE) expect(isForged(forged, id), id).toBe(false)
    expect(forgedComponents(forged)).toEqual([])
  })

  it('never gates the parts you cannot build without', () => {
    const { forged } = useProgress.getState()
    for (const c of COMPONENTS.filter((x) => x.forge === null)) expect(isForged(forged, c.forge), c.id).toBe(true)
  })

  it('opens exactly the part that was forged, and nothing else', () => {
    useProgress.getState().forgeComponent('shards')
    const { forged } = useProgress.getState()
    expect(isForged(forged, 'shards')).toBe(true)
    for (const id of FORGEABLE.filter((i) => i !== 'shards')) expect(isForged(forged, id), id).toBe(false)
    expect(forgedComponents(forged)).toEqual(['shards'])
  })

  it('is idempotent — forging twice is forging once', () => {
    useProgress.getState().forgeComponent('cdn')
    const first = useProgress.getState().forged
    useProgress.getState().forgeComponent('cdn')
    expect(useProgress.getState().forged).toBe(first)
  })

  it('reports the forged set in graph order once everything is forged', () => {
    for (const id of FORGEABLE) useProgress.getState().forgeComponent(id)
    expect(forgedComponents(useProgress.getState().forged)).toEqual(FORGEABLE)
  })

  it('ignores component ids outside the graph', () => {
    useProgress.getState().forgeComponent('warp-drive')
    expect(forgedComponents(useProgress.getState().forged)).toEqual([])
  })
})
