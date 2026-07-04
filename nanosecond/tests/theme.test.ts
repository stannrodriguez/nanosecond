import { describe, expect, it } from 'vitest'
import { C, CH_COLOR, DANGER_UTIL } from '../src/theme'

// Guards the design-system contract in docs/architecture.md.
describe('theme tokens', () => {
  it('matches the documented palette', () => {
    expect(C.bg).toBe('#0F1930')
    expect(C.panel).toBe('#152238')
    expect(C.panelUp).toBe('#1B2C48')
    expect(C.line).toBe('#283A5C')
    expect(C.text).toBe('#E9EEF8')
    expect(C.dim).toBe('#8FA0C0')
    expect(C.faint).toBe('#5B6C8F')
    expect(C.net).toBe('#53DCEC')
    expect(C.compute).toBe('#F6BB52')
    expect(C.storage).toBe('#EF7BD0')
    expect(C.mem).toBe('#72EAA8')
    expect(C.alert).toBe('#F26D5E')
    expect(C.gold).toBe('#F6D452')
  })

  it('maps every channel to a palette color', () => {
    expect(CH_COLOR.net).toBe(C.net)
    expect(CH_COLOR.compute).toBe(C.compute)
    expect(CH_COLOR.storage).toBe(C.storage)
    expect(CH_COLOR.mem).toBe(C.mem)
  })

  it('keeps the danger line at 80%', () => {
    expect(DANGER_UTIL).toBe(0.8)
  })
})
